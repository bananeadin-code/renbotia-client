# ─────────────────────────────────────────────────────────────────────────────
# Certificado SSL (ACM) para renbotia.com y www.renbotia.com. Es gratis.
# AWS lo emite cuando demuestras que el dominio es tuyo: te da unos registros
# CNAME que agregas en Cloudflare (salen en `terraform output acm_validation_records`).
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

# Espera a que AWS confirme los registros de Cloudflare y emita el certificado.
# Solo se usa cuando attach_domain = true (paso 7 de la guía), para que el primer
# `terraform apply` no se quede esperando.
resource "aws_acm_certificate_validation" "site" {
  count           = var.attach_domain ? 1 : 0
  certificate_arn = aws_acm_certificate.site.arn

  timeouts {
    create = "30m"
  }
}
