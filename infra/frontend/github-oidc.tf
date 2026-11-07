# ─────────────────────────────────────────────────────────────────────────────
# Despliegue desde GitHub SIN guardar llaves de AWS en GitHub (OIDC).
# GitHub le presenta a AWS un "pase" temporal firmado; AWS solo lo acepta si viene
# del repo y rama configurados, y a cambio da permisos mínimos por unos minutos:
# subir archivos a ESTE bucket, limpiar el caché de ESTA distribución y
# actualizar ESTE enrutador. Nada más.
# ─────────────────────────────────────────────────────────────────────────────

resource "aws_iam_openid_connect_provider" "github" {
  count          = var.create_github_oidc_provider ? 1 : 0
  url            = "https://token.actions.githubusercontent.com"
  client_id_list = ["sts.amazonaws.com"]
}

data "aws_iam_openid_connect_provider" "github" {
  count = var.create_github_oidc_provider ? 0 : 1
  url   = "https://token.actions.githubusercontent.com"
}

locals {
  github_oidc_arn = var.create_github_oidc_provider ? aws_iam_openid_connect_provider.github[0].arn : data.aws_iam_openid_connect_provider.github[0].arn
}

# Quién puede usar el rol: solo GitHub Actions del repo y la rama indicados.
data "aws_iam_policy_document" "deploy_trust" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [local.github_oidc_arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:${var.github_repository}:ref:refs/heads/${var.github_branch}"]
    }
  }
}

resource "aws_iam_role" "deploy" {
  name               = "renbotia-frontend-deploy"
  description        = "GitHub Actions publica el sitio de RenBotIA"
  assume_role_policy = data.aws_iam_policy_document.deploy_trust.json
  # Sesiones cortas: un despliegue tarda unos minutos.
  max_session_duration = 3600
}

# Qué puede hacer el rol (lo mínimo para desplegar).
data "aws_iam_policy_document" "deploy" {
  statement {
    sid       = "ListarBucket"
    actions   = ["s3:ListBucket"]
    resources = [aws_s3_bucket.site.arn]
  }

  statement {
    sid       = "SubirYBorrarArchivos"
    actions   = ["s3:PutObject", "s3:DeleteObject", "s3:GetObject"]
    resources = ["${aws_s3_bucket.site.arn}/*"]
  }

  statement {
    sid       = "LimpiarCache"
    actions   = ["cloudfront:CreateInvalidation", "cloudfront:GetInvalidation"]
    resources = [aws_cloudfront_distribution.site.arn]
  }

  statement {
    sid       = "ActualizarEnrutador"
    actions   = ["cloudfront:DescribeFunction", "cloudfront:GetFunction", "cloudfront:UpdateFunction", "cloudfront:PublishFunction", "cloudfront:TestFunction"]
    resources = [aws_cloudfront_function.router.arn]
  }
}

resource "aws_iam_role_policy" "deploy" {
  name   = "renbotia-frontend-deploy"
  role   = aws_iam_role.deploy.id
  policy = data.aws_iam_policy_document.deploy.json
}
