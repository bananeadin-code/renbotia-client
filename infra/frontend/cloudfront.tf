# ─────────────────────────────────────────────────────────────────────────────
# CloudFront: la red de distribución (CDN) que entrega el sitio desde la
# ubicación más cercana al visitante. Reemplaza lo que hacía Vercel.
#
# Orígenes (de dónde saca el contenido):
#   1. S3          → los archivos del sitio.
#   2. Render      → /api/media/* y /api/widget/public/* (igual que los rewrites de vercel.json).
#
# Comportamientos (qué regla aplica según la ruta), del más específico al general:
#   /api/media/*          → Render, respeta el caché que indique Render (imágenes).
#   /api/widget/public/*  → Render, sin caché (mensajes del chat embebido).
#   /w/*                  → S3, CSP que permite incrustarse en otros sitios.
#   /widget.js            → S3, accesible desde cualquier dominio.
#   todo lo demás         → S3, con el enrutador (páginas para Google / app / redirecciones).
# ─────────────────────────────────────────────────────────────────────────────

# Políticas administradas por AWS (se buscan por nombre; no hay que crearlas).
data "aws_cloudfront_cache_policy" "optimized" {
  name = "Managed-CachingOptimized"
}
data "aws_cloudfront_cache_policy" "disabled" {
  name = "Managed-CachingDisabled"
}
data "aws_cloudfront_cache_policy" "use_origin_headers" {
  name = "UseOriginCacheControlHeaders-QueryStrings"
}
data "aws_cloudfront_origin_request_policy" "all_viewer_except_host" {
  name = "Managed-AllViewerExceptHostHeader"
}

# Permiso para que CloudFront lea el bucket privado (Origin Access Control).
resource "aws_cloudfront_origin_access_control" "site" {
  name                              = "renbotia-frontend-oac"
  description                       = "CloudFront lee el bucket privado del sitio"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# El enrutador (CloudFront Function). Su código lo genera scripts/gen-edge-router.mjs.
# Terraform lo crea la primera vez; después lo actualiza el despliegue automático
# (cada vez que cambian las páginas para Google), por eso se ignoran cambios de código aquí.
resource "aws_cloudfront_function" "router" {
  name    = "renbotia-edge-router"
  runtime = "cloudfront-js-2.0"
  comment = "Enrutador RenBotIA" # igual que en el despliegue automatico
  publish = true
  code    = file("${path.module}/edge-router.js")

  lifecycle {
    ignore_changes = [code]
  }
}

locals {
  s3_origin_id     = "s3-site"
  render_origin_id = "render-api"
  aliases          = var.attach_domain ? concat([var.domain], var.redirect_domains) : []
}

resource "aws_cloudfront_distribution" "site" {
  enabled             = true
  comment             = "RenBotIA — sitio y panel"
  default_root_object = "index.html"
  http_version        = "http2and3"
  is_ipv6_enabled     = true
  # PriceClass_100: ubicaciones de Norteamérica (incluye México) y Europa. La más barata.
  price_class = "PriceClass_100"
  aliases     = local.aliases

  # ── Origen 1: S3 (privado, vía OAC)
  origin {
    origin_id                = local.s3_origin_id
    domain_name              = aws_s3_bucket.site.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.site.id
  }

  # ── Origen 2: Render (el servidor de RenBotIA)
  origin {
    origin_id   = local.render_origin_id
    domain_name = var.render_origin

    custom_origin_config {
      http_port                = 80
      https_port               = 443
      origin_protocol_policy   = "https-only"
      origin_ssl_protocols     = ["TLSv1.2"]
      origin_read_timeout      = 60
      origin_keepalive_timeout = 5
    }
  }

  # ── /api/media/* → Render (imágenes). Usa el caché que indique Render.
  ordered_cache_behavior {
    path_pattern             = "/api/media/*"
    target_origin_id         = local.render_origin_id
    viewer_protocol_policy   = "redirect-to-https"
    allowed_methods          = ["GET", "HEAD", "OPTIONS"]
    cached_methods           = ["GET", "HEAD"]
    compress                 = true
    cache_policy_id          = data.aws_cloudfront_cache_policy.use_origin_headers.id
    origin_request_policy_id = data.aws_cloudfront_origin_request_policy.all_viewer_except_host.id
  }

  # ── /api/widget/public/* → Render (chat embebido). Sin caché; todos los métodos.
  ordered_cache_behavior {
    path_pattern             = "/api/widget/public/*"
    target_origin_id         = local.render_origin_id
    viewer_protocol_policy   = "redirect-to-https"
    allowed_methods          = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods           = ["GET", "HEAD"]
    compress                 = true
    cache_policy_id          = data.aws_cloudfront_cache_policy.disabled.id
    origin_request_policy_id = data.aws_cloudfront_origin_request_policy.all_viewer_except_host.id
  }

  # ── /w/* → página del chat embebido (se puede incrustar en otros sitios).
  ordered_cache_behavior {
    path_pattern               = "/w/*"
    target_origin_id           = local.s3_origin_id
    viewer_protocol_policy     = "redirect-to-https"
    allowed_methods            = ["GET", "HEAD", "OPTIONS"]
    cached_methods             = ["GET", "HEAD"]
    compress                   = true
    cache_policy_id            = data.aws_cloudfront_cache_policy.optimized.id
    response_headers_policy_id = aws_cloudfront_response_headers_policy.widget_page.id

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.router.arn
    }
  }

  # ── /widget.js → script que los clientes pegan en su sitio.
  ordered_cache_behavior {
    path_pattern               = "/widget.js"
    target_origin_id           = local.s3_origin_id
    viewer_protocol_policy     = "redirect-to-https"
    allowed_methods            = ["GET", "HEAD", "OPTIONS"]
    cached_methods             = ["GET", "HEAD"]
    compress                   = true
    cache_policy_id            = data.aws_cloudfront_cache_policy.optimized.id
    response_headers_policy_id = aws_cloudfront_response_headers_policy.widget_js.id
  }

  # ── Todo lo demás → S3 con el enrutador.
  default_cache_behavior {
    target_origin_id           = local.s3_origin_id
    viewer_protocol_policy     = "redirect-to-https"
    allowed_methods            = ["GET", "HEAD", "OPTIONS"]
    cached_methods             = ["GET", "HEAD"]
    compress                   = true
    cache_policy_id            = data.aws_cloudfront_cache_policy.optimized.id
    response_headers_policy_id = aws_cloudfront_response_headers_policy.site.id

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.router.arn
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  # Certificado: el de CloudFront (*.cloudfront.net) mientras pruebas; el tuyo
  # (ACM) cuando attach_domain = true.
  viewer_certificate {
    cloudfront_default_certificate = var.attach_domain ? null : true
    acm_certificate_arn            = var.attach_domain ? aws_acm_certificate_validation.site[0].certificate_arn : null
    ssl_support_method             = var.attach_domain ? "sni-only" : null
    minimum_protocol_version       = var.attach_domain ? "TLSv1.2_2021" : null
  }
}
