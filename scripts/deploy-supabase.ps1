param(
  [string]$ProjectRef = "tcmdsdllbnlvqynkmawy"
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$localSecrets = Join-Path $PSScriptRoot "supabase.local.ps1"
$functionSecrets = Join-Path $root "supabase\.env.local"

if (-not (Test-Path $localSecrets)) {
  throw "Arquivo local ausente: $localSecrets. Copie scripts/supabase.local.example.ps1 para scripts/supabase.local.ps1 e preencha os valores."
}

if (-not (Test-Path $functionSecrets)) {
  throw "Arquivo local ausente: $functionSecrets. Copie supabase/.env.example para supabase/.env.local e preencha os valores."
}

. $localSecrets

if (-not $env:SUPABASE_ACCESS_TOKEN) {
  throw "SUPABASE_ACCESS_TOKEN nao foi definido em scripts/supabase.local.ps1."
}

if (-not $env:SUPABASE_DB_PASSWORD) {
  throw "SUPABASE_DB_PASSWORD nao foi definido em scripts/supabase.local.ps1."
}

Push-Location $root
try {
  npx.cmd supabase link --project-ref $ProjectRef --password $env:SUPABASE_DB_PASSWORD
  npx.cmd supabase db push --linked --password $env:SUPABASE_DB_PASSWORD
  npx.cmd supabase secrets set --project-ref $ProjectRef --env-file $functionSecrets
  npx.cmd supabase functions deploy protocolo --project-ref $ProjectRef --no-verify-jwt --use-api
}
finally {
  Pop-Location
}
