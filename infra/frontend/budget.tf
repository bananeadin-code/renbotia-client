# ─────────────────────────────────────────────────────────────────────────────
# Alerta de gasto de TODA la cuenta de AWS (no solo de este proyecto).
# Te avisa por correo al 80% del límite (estimado del mes) y al 100% (real).
# Los dos primeros presupuestos de AWS Budgets son gratis.
# Importante: es una ALERTA, no un tope; AWS no apaga nada por sí solo.
# ─────────────────────────────────────────────────────────────────────────────

resource "aws_budgets_budget" "monthly" {
  name         = "renbotia-mensual"
  budget_type  = "COST"
  limit_amount = tostring(var.budget_limit_usd)
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 80
    threshold_type             = "PERCENTAGE"
    notification_type          = "FORECASTED"
    subscriber_email_addresses = [var.budget_email]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = [var.budget_email]
  }
}
