# ─────────────────────────────────────────────────────────────────────────────
# S3: donde viven los archivos del sitio (lo que genera `npm run build`).
# Es PRIVADO: nadie lo lee directo de internet, solo CloudFront (ver bucket policy).
# ─────────────────────────────────────────────────────────────────────────────

resource "aws_s3_bucket" "site" {
  # bucket_prefix: AWS completa el nombre con un sufijo único (los nombres de
  # bucket son globales en todo AWS y "renbotia-frontend" podría estar tomado).
  bucket_prefix = "renbotia-frontend-"
}

# Bloquea cualquier acceso público, aunque alguien se equivoque con un permiso.
resource "aws_s3_bucket_public_access_block" "site" {
  bucket                  = aws_s3_bucket.site.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# El dueño del bucket es dueño de todos los objetos (sin ACLs antiguas).
resource "aws_s3_bucket_ownership_controls" "site" {
  bucket = aws_s3_bucket.site.id
  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

# Versionado: cada despliegue guarda la versión anterior de cada archivo.
# Sirve para recuperar algo borrado por error.
resource "aws_s3_bucket_versioning" "site" {
  bucket = aws_s3_bucket.site.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Las versiones viejas se borran solas a los 30 días (para no pagar almacenamiento de más).
resource "aws_s3_bucket_lifecycle_configuration" "site" {
  bucket = aws_s3_bucket.site.id

  rule {
    id     = "limpiar-versiones-viejas"
    status = "Enabled"
    filter {}
    noncurrent_version_expiration {
      noncurrent_days = 30
    }
    abort_incomplete_multipart_upload {
      days_after_initiation = 1
    }
  }

  depends_on = [aws_s3_bucket_versioning.site]
}

# Cifrado en reposo (gratis, con llaves administradas por S3).
resource "aws_s3_bucket_server_side_encryption_configuration" "site" {
  bucket = aws_s3_bucket.site.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Única puerta de entrada: CloudFront, y solo ESTA distribución (condición SourceArn).
data "aws_iam_policy_document" "site_bucket" {
  statement {
    sid       = "SoloCloudFrontDeEsteSitio"
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.site.arn}/*"]

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.site.arn]
    }
  }
}

resource "aws_s3_bucket_policy" "site" {
  bucket     = aws_s3_bucket.site.id
  policy     = data.aws_iam_policy_document.site_bucket.json
  depends_on = [aws_s3_bucket_public_access_block.site]
}
