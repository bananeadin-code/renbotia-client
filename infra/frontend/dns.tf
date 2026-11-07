# ─────────────────────────────────────────────────────────────────────────────
# DNS de renbotia.com en Route 53.
#
# El dominio sigue COMPRADO en Squarespace (ahí se renueva cada año). Lo único
# que cambia es QUIÉN responde las consultas de DNS: en Squarespace apuntas los
# "servidores de nombres" a los 4 de esta zona (salen en `terraform output name_servers`).
#
# Por qué Route 53: CloudFront no tiene IP fija, y el dominio principal
# (renbotia.com, sin www) no puede ser CNAME. Route 53 tiene registros ALIAS que
# apuntan a CloudFront sin costo por consulta. Además, Terraform crea solo los
# registros para validar el certificado.
#
# Los registros de abajo son COPIA EXACTA de los que había en Squarespace
# (correo, envío de correos, verificación de Google, API). Si agregas un servicio
# nuevo que pida un registro DNS, se agrega aquí → plan → apply. Ya NO en Squarespace.
# ─────────────────────────────────────────────────────────────────────────────

resource "aws_route53_zone" "main" {
  name    = var.domain
  comment = "DNS de ${var.domain} (administrado con Terraform)"
}

locals {
  # name = "" es el dominio principal (@ en Squarespace).
  dns_records = {
    # Servidor (API) en Render.
    api = { name = "api", type = "CNAME", records = ["renbotia-server.onrender.com"] }

    # Correo entrante (ImprovMX reenvía los correos @renbotia.com).
    mx_root = { name = "", type = "MX", records = ["10 mx1.improvmx.com", "20 mx2.improvmx.com"] }

    # Varios TXT con el mismo nombre van juntos en un solo registro.
    #   - Verificación de Google Search Console.
    #   - SPF de ImprovMX (quién puede enviar correo como @renbotia.com).
    txt_root = {
      name = ""
      type = "TXT"
      records = [
        "google-site-verification=bcVt6I54NQXHzb0rzQoO_5sZDSSgjwpgnJ05INobQS4",
        "v=spf1 include:spf.improvmx.com ~all",
      ]
    }

    # Correos que envía el sistema (Resend, que usa Amazon SES por dentro).
    resend_dkim = {
      name    = "resend._domainkey"
      type    = "TXT"
      records = ["p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDDxiluk2mwh2pUdjf+E7gmD/k5a+n6W5o/0n2WJlYlJwbeOprBmryMKNyls7TTBKEAd2qg9iZ0rJxj+5WNFJuhevpN2sK9CB2QSP04R2rYlyKKq+29ezT1u3LxHtd83EkX3aNDjMfsFiaCtwnwvFIxBOw72WP6kFWcUI0q8YCf+QIDAQAB"]
    }
    send_mx  = { name = "send", type = "MX", records = ["10 feedback-smtp.us-east-1.amazonses.com"] }
    send_spf = { name = "send", type = "TXT", records = ["v=spf1 include:amazonses.com ~all"] }
  }

  site_on_aws = var.site_target == "aws"
}

resource "aws_route53_record" "static" {
  for_each = local.dns_records

  zone_id = aws_route53_zone.main.zone_id
  name    = each.value.name == "" ? var.domain : "${each.value.name}.${var.domain}"
  type    = each.value.type
  ttl     = 1800 # 30 minutos, igual que en Squarespace
  records = each.value.records
}

# ── El sitio: Vercel o CloudFront, según var.site_target ─────────────────────
# Cambiar de uno a otro es cambiar una línea en terraform.tfvars → plan → apply.
# Volver atrás (rollback) es lo mismo al revés.

# renbotia.com (sin www)
resource "aws_route53_record" "apex" {
  zone_id = aws_route53_zone.main.zone_id
  name    = var.domain
  type    = "A"

  # Vercel: su IP fija. TTL corto (5 min) para que el cambio y un posible
  # rollback se noten rápido.
  ttl     = local.site_on_aws ? null : 300
  records = local.site_on_aws ? null : ["216.198.79.1"]

  # AWS: ALIAS a CloudFront (Route 53 responde con las IPs de CloudFront del momento).
  dynamic "alias" {
    for_each = local.site_on_aws ? [1] : []
    content {
      name                   = aws_cloudfront_distribution.site.domain_name
      zone_id                = aws_cloudfront_distribution.site.hosted_zone_id
      evaluate_target_health = false
    }
  }

  lifecycle {
    precondition {
      condition     = !local.site_on_aws || var.attach_domain
      error_message = "site_target = \"aws\" requiere attach_domain = true (CloudFront debe tener asignado renbotia.com y el certificado)."
    }
  }
}

# IPv6 del dominio principal: solo con CloudFront (Vercel no tenía AAAA).
resource "aws_route53_record" "apex_ipv6" {
  count   = local.site_on_aws ? 1 : 0
  zone_id = aws_route53_zone.main.zone_id
  name    = var.domain
  type    = "AAAA"

  alias {
    name                   = aws_cloudfront_distribution.site.domain_name
    zone_id                = aws_cloudfront_distribution.site.hosted_zone_id
    evaluate_target_health = false
  }
}

# www.renbotia.com: CNAME en los dos casos (así el cambio es solo de valor, sin
# borrar y crear). El enrutador de CloudFront lo redirige a renbotia.com.
resource "aws_route53_record" "www" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "www.${var.domain}"
  type    = "CNAME"
  ttl     = 300
  records = [local.site_on_aws ? aws_cloudfront_distribution.site.domain_name : "72de1f8df8c26032.vercel-dns-017.com"]
}

# ── Validación del certificado (ACM) ─────────────────────────────────────────
# Los CNAME que AWS pide para comprobar que el dominio es tuyo. Se quedan para
# siempre: AWS los usa para renovar el certificado solo cada año.
resource "aws_route53_record" "acm_validation" {
  for_each = {
    for o in aws_acm_certificate.site.domain_validation_options : o.domain_name => o
  }

  zone_id         = aws_route53_zone.main.zone_id
  name            = each.value.resource_record_name
  type            = each.value.resource_record_type
  ttl             = 300
  records         = [each.value.resource_record_value]
  allow_overwrite = true
}
