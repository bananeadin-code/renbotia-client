# ─────────────────────────────────────────────────────────────────────────────
# Versiones de Terraform y del proveedor de AWS.
# "~> 6.0" = cualquier 6.x (actualizaciones compatibles), nunca un 7.0 sin querer.
# ─────────────────────────────────────────────────────────────────────────────
terraform {
  required_version = ">= 1.10"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }

  # Estado: al empezar se guarda en tu computadora (terraform.tfstate). En la
  # guía (paso 11) lo pasamos a S3 para no perderlo. Cuando llegues ahí, quita el
  # comentario de este bloque y corre `terraform init -migrate-state`.
  #
  # backend "s3" {
  #   bucket       = "NOMBRE-DEL-BUCKET-DE-ESTADO"
  #   key          = "renbotia/frontend/terraform.tfstate"
  #   region       = "us-east-1"
  #   use_lockfile = true # bloqueo nativo en S3 (ya no se usa DynamoDB)
  #   encrypt      = true
  # }
}

# Todo en us-east-1 (Virginia): CloudFront exige que su certificado (ACM) viva
# ahí, y así el proyecto usa una sola región. Los visitantes NO se conectan a
# Virginia: CloudFront los atiende desde la ubicación más cercana (México, EE. UU.).
provider "aws" {
  region = "us-east-1"

  # ¿En qué cuenta construye? En la de las credenciales con las que corres
  # Terraform (perfil de AWS SSO, paso 2 de la guía). Este candado hace que se
  # NIEGUE a trabajar si esas credenciales son de otra cuenta.
  allowed_account_ids = [var.aws_account_id]

  # Etiquetas automáticas en todo lo que se cree: sirven para ver costos por proyecto.
  default_tags {
    tags = {
      Project   = "renbotia"
      Component = "frontend"
      ManagedBy = "terraform"
    }
  }
}
