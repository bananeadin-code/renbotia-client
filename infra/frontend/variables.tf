# ─────────────────────────────────────────────────────────────────────────────
# Variables: los datos que cambian de un proyecto a otro. Los valores reales van
# en terraform.tfvars (copia terraform.tfvars.example).
# ─────────────────────────────────────────────────────────────────────────────

variable "domain" {
  description = "Dominio principal del sitio."
  type        = string
  default     = "renbotia.com"
}

variable "redirect_domains" {
  description = "Dominios que redirigen al principal (el enrutador los manda a var.domain)."
  type        = list(string)
  default     = ["www.renbotia.com"]
}

variable "render_origin" {
  description = "Dominio del servidor en Render (sin https://). Atiende /api/media y /api/widget/public."
  type        = string
  default     = "renbotia-server.onrender.com"
}

variable "github_repository" {
  description = "Repositorio del sitio en GitHub (usuario/repo). Solo ese repo puede desplegar."
  type        = string
  default     = "bananeadin-code/renbotia-client"
}

variable "github_branch" {
  description = "Rama que puede desplegar a producción."
  type        = string
  default     = "main"
}

variable "create_github_oidc_provider" {
  description = "true la primera vez en la cuenta; false si tu cuenta ya tiene el proveedor OIDC de GitHub."
  type        = bool
  default     = true
}

variable "budget_email" {
  description = "Correo que recibe la alerta si el gasto del mes se acerca al límite."
  type        = string
}

variable "budget_limit_usd" {
  description = "Límite mensual (USD) para la alerta de gasto de TODA la cuenta."
  type        = number
  default     = 5
}

variable "attach_domain" {
  description = "false: la distribución funciona solo con su dominio *.cloudfront.net (pruebas). true: se le asigna renbotia.com (requiere el certificado validado)."
  type        = bool
  default     = false
}
