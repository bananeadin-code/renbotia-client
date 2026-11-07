# ─────────────────────────────────────────────────────────────────────────────
# Encabezados de seguridad (lo que vercel.json ponía en "headers").
# Copiados tal cual de vercel.json. Si agregas un servicio externo (otro script,
# otra API), actualiza la CSP aquí y corre `terraform apply`.
# Límite de CloudFront: la CSP no puede pasar de 1,783 caracteres (hoy ~1,490).
# ─────────────────────────────────────────────────────────────────────────────

locals {
  csp_sources = {
    img     = "img-src 'self' data: blob: https:"
    font    = "font-src 'self' https://fonts.gstatic.com data:"
    style   = "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com"
    script  = "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://*.googletagmanager.com https://www.googleadservices.com https://googleads.g.doubleclick.net https://www.google.com https://js.stripe.com https://challenges.cloudflare.com https://static.cloudflareinsights.com https://accounts.google.com https://connect.facebook.net"
    connect = "connect-src 'self' https://www.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://www.googleadservices.com https://googleads.g.doubleclick.net https://*.doubleclick.net https://www.google.com https://www.google.com.mx https://connect.facebook.net https://api.renbotia.com https://api.stripe.com https://accounts.google.com https://cloudflareinsights.com https://static.cloudflareinsights.com https://graph.facebook.com https://www.facebook.com https://web.facebook.com"
    frame   = "frame-src https://challenges.cloudflare.com https://www.googletagmanager.com https://td.doubleclick.net https://*.doubleclick.net https://js.stripe.com https://hooks.stripe.com https://m.stripe.network https://accounts.google.com https://www.facebook.com https://web.facebook.com"
  }

  # Sitio y panel: nadie puede meter renbotia.com en un iframe (frame-ancestors 'none').
  csp_site = join("; ", [
    "default-src 'self'", "base-uri 'self'", "object-src 'none'", "frame-ancestors 'none'", "form-action 'self'",
    local.csp_sources.img, local.csp_sources.font, local.csp_sources.style, local.csp_sources.script,
    local.csp_sources.connect, local.csp_sources.frame, "upgrade-insecure-requests",
  ])

  # Chat embebido (/w/...): cualquier sitio de un cliente puede mostrarlo en un iframe.
  csp_widget = join("; ", [
    "default-src 'self'", "base-uri 'self'", "object-src 'none'", "frame-ancestors *", "form-action 'self'",
    local.csp_sources.img, local.csp_sources.font, local.csp_sources.style, local.csp_sources.script,
    local.csp_sources.connect, local.csp_sources.frame, "upgrade-insecure-requests",
  ])

  permissions_policy = "camera=(), microphone=(), geolocation=(), payment=(self \"https://js.stripe.com\")"
}

# Política general (todo el sitio y el panel).
resource "aws_cloudfront_response_headers_policy" "site" {
  name    = "renbotia-site-security"
  comment = "CSP y seguridad del sitio y panel de RenBotIA"

  security_headers_config {
    content_security_policy {
      content_security_policy = local.csp_site
      override                = true
    }
    frame_options {
      frame_option = "DENY"
      override     = true
    }
    strict_transport_security {
      access_control_max_age_sec = 63072000 # 2 años
      include_subdomains         = true
      preload                    = true
      override                   = true
    }
    content_type_options {
      override = true
    }
    referrer_policy {
      referrer_policy = "strict-origin-when-cross-origin"
      override        = true
    }
  }

  custom_headers_config {
    items {
      header   = "Permissions-Policy"
      value    = local.permissions_policy
      override = true
    }
  }
}

# Chat embebido /w/...: igual, pero se puede incrustar en otros sitios (sin X-Frame-Options).
resource "aws_cloudfront_response_headers_policy" "widget_page" {
  name    = "renbotia-widget-page-security"
  comment = "CSP del chat embebido (/w/*)"

  security_headers_config {
    content_security_policy {
      content_security_policy = local.csp_widget
      override                = true
    }
    strict_transport_security {
      access_control_max_age_sec = 63072000
      include_subdomains         = true
      preload                    = true
      override                   = true
    }
    content_type_options {
      override = true
    }
    referrer_policy {
      referrer_policy = "strict-origin-when-cross-origin"
      override        = true
    }
  }

  custom_headers_config {
    items {
      header   = "Permissions-Policy"
      value    = local.permissions_policy
      override = true
    }
  }
}

# widget.js: el script que los clientes pegan en su sitio. Se puede cargar desde cualquier dominio.
resource "aws_cloudfront_response_headers_policy" "widget_js" {
  name    = "renbotia-widget-js"
  comment = "widget.js accesible desde cualquier sitio"

  custom_headers_config {
    items {
      header   = "Access-Control-Allow-Origin"
      value    = "*"
      override = true
    }
  }

  security_headers_config {
    content_type_options {
      override = true
    }
  }
}
