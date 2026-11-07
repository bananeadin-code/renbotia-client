# Compara lo que responde Squarespace con lo que responde la zona nueva de Route 53,
# registro por registro, ANTES de cambiar los servidores de nombres.
# Uso (desde infra\frontend):
#   powershell -ExecutionPolicy Bypass -File .\comparar-dns.ps1
# Si todo dice OK, la zona de Route 53 es una copia fiel y el cambio no rompe nada.

param(
  [string]$Viejo = "nsd1.squarespacedns.com",
  [string]$Nuevo = ""
)

if (-not $Nuevo) {
  $Nuevo = (terraform output -json name_servers | ConvertFrom-Json)[0]
}

function Valores([string]$Nombre, [string]$Tipo, [string]$Servidor) {
  Resolve-DnsName $Nombre -Type $Tipo -Server $Servidor -DnsOnly -ErrorAction SilentlyContinue |
    Where-Object { $_.Type -eq $Tipo } |
    ForEach-Object {
      $rec = $_ # dentro de switch, $_ es el valor del switch, no el registro
      switch ($Tipo) {
        "A"     { $rec.IPAddress }
        "MX"    { "$($rec.Preference) $($rec.NameExchange)" }
        "TXT"   { $rec.Strings -join "" }
        "CNAME" { $rec.NameHost }
      }
    } | Sort-Object
}

$revisar = @(
  @("renbotia.com", "A"),
  @("renbotia.com", "MX"),
  @("renbotia.com", "TXT"),
  @("www.renbotia.com", "CNAME"),
  @("api.renbotia.com", "CNAME"),
  @("send.renbotia.com", "MX"),
  @("send.renbotia.com", "TXT"),
  @("resend._domainkey.renbotia.com", "TXT")
)

Write-Host "Squarespace: $Viejo   ->   Route 53: $Nuevo`n"
$fallas = 0
foreach ($r in $revisar) {
  $a = @(Valores $r[0] $r[1] $Viejo)
  $b = @(Valores $r[0] $r[1] $Nuevo)
  $igual = (($a -join "|") -eq ($b -join "|")) -and $a.Count -gt 0
  if ($igual) {
    Write-Host ("OK         {0,-32} {1,-5} {2}" -f $r[0], $r[1], ($b -join " ; ")) -ForegroundColor Green
  } else {
    $fallas++
    Write-Host ("DIFERENTE  {0,-32} {1,-5}" -f $r[0], $r[1]) -ForegroundColor Red
    Write-Host ("   Squarespace: {0}" -f ($a -join " ; "))
    Write-Host ("   Route 53:    {0}" -f ($b -join " ; "))
  }
}
Write-Host ""
if ($fallas -eq 0) { Write-Host "Todo coincide." -ForegroundColor Green }
else { Write-Host "$fallas registro(s) no coinciden: NO cambies los servidores de nombres todavia." -ForegroundColor Red }
