# ─────────────────────────────────────────────────────────────────────────────
# Certificado SSL (ACM) para renbotia.com y www.renbotia.com. Es gratis.
# AWS lo emite cuando demuestras que el dominio es tuyo con unos registros CNAME.
# Terraform los crea solo en Route 53 (dns.tf → aws_route53_record.acm_validation).
# ─────────────────────────────────────────────────────────────────────────────

resource "aws_acm_certificate" "site" {
  domain_name               = var.domain
  subject_alternative_names = var.redirect_domains
  validation_method         = "DNS"

  lifecycle {
    # Al renovar o cambiar dominios, crea el nuevo antes de borrar el viejo (sin caída).
    create_before_destroy = true
  }
}

# Espera a que AWS vea esos registros y emita el certificado. Solo se usa cuando
# attach_domain = true: antes de cambiar los servidores de nombres en Squarespace,
# nadie en internet ve todavía la zona de Route 53 y se quedaría esperando.
resource "aws_acm_certificate_validation" "site" {
  count                   = var.attach_domain ? 1 : 0
  certificate_arn         = aws_acm_certificate.site.arn
  validation_record_fqdns = [for r in aws_route53_record.acm_validation : r.fqdn]

  timeouts {
    create = "30m"
  }
}
