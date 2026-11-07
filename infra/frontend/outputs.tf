# ─────────────────────────────────────────────────────────────────────────────
# Salidas: datos que necesitas después (para Squarespace y para GitHub).
# Se ven con `terraform output` (o `terraform output -raw nombre`).
# ─────────────────────────────────────────────────────────────────────────────

output "bucket_name" {
  description = "Bucket del sitio → variable AWS_S3_BUCKET en GitHub."
  value       = aws_s3_bucket.site.id
}

output "distribution_id" {
  description = "ID de CloudFront → variable AWS_CLOUDFRONT_DISTRIBUTION_ID en GitHub."
  value       = aws_cloudfront_distribution.site.id
}

output "cloudfront_domain" {
  description = "Dominio de CloudFront (dxxxx.cloudfront.net): para probar antes del corte."
  value       = aws_cloudfront_distribution.site.domain_name
}

output "deploy_role_arn" {
  description = "Rol que usa GitHub Actions → variable AWS_DEPLOY_ROLE_ARN en GitHub."
  value       = aws_iam_role.deploy.arn
}

output "router_function_name" {
  description = "Nombre del enrutador → variable AWS_CF_FUNCTION_NAME en GitHub."
  value       = aws_cloudfront_function.router.name
}

output "name_servers" {
  description = "Los 4 servidores de nombres de Route 53: van en Squarespace → DNS → Servidores de nombres de dominio."
  value       = aws_route53_zone.main.name_servers
}

output "zone_id" {
  description = "ID de la zona de Route 53 de renbotia.com."
  value       = aws_route53_zone.main.zone_id
}

output "acm_validation_records" {
  description = "Registros CNAME para validar el certificado (Terraform ya los crea en Route 53; solo informativo)."
  value = [
    for o in aws_acm_certificate.site.domain_validation_options : {
      dominio = o.domain_name
      tipo    = o.resource_record_type
      nombre  = o.resource_record_name
      valor   = o.resource_record_value
    }
  ]
}
