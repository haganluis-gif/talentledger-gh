# Build .env.local from the real hosted keys saved by the Supabase CLI.
# Deterministic: reads JSON, picks JWT keys, writes .env.local. No copy/paste.
$ErrorActionPreference = 'Stop'

$jsonPath = Join-Path $env:TEMP 'sb-keys.json'
$items = Get-Content $jsonPath -Raw | ConvertFrom-Json

$anon = ($items | Where-Object { $_.name -eq 'anon' } | Select-Object -First 1).api_key
$svc  = ($items | Where-Object { $_.name -eq 'service_role' } | Select-Object -First 1).api_key
if (-not $anon -or -not $svc) { throw "Could not find anon/service_role rows in $jsonPath" }
if ($anon.Length -lt 120 -or $svc.Length -lt 120) { throw "Keys look wrong: anon=$($anon.Length) svc=$($svc.Length)" }

$ERROR_MSG = @"

Missing TALENTLEDGER_ADMIN_PASSWORD environment variable.

This script never hardcodes the admin password. Set it before running, e.g.:
    `$env:TALENTLEDGER_ADMIN_PASSWORD = 'use-a-long-random-password'
    .\build-env.ps1
"@

$adminPw = $env:TALENTLEDGER_ADMIN_PASSWORD
if (-not $adminPw) { throw $ERROR_MSG }
if ($adminPw.Length -lt 16) { throw "ADMIN_PASSWORD must be at least 16 characters." }

$lines = [System.Collections.Generic.List[string]]::new()
$lines.Add('# ---------------------------------------------------------------')
$lines.Add('# TalentLedger GH - REAL HOSTED env (equals live Vercel env)')
$lines.Add('# Project dtqdphimezsixfudpaoy - keys pulled from linked CLI ' + (Get-Date -Format 'yyyy-MM-dd HH:mm'))
$lines.Add('# ---------------------------------------------------------------')
$lines.Add('NEXT_PUBLIC_SUPABASE_URL=https://dtqdphimezsixfudpaoy.supabase.co')
$lines.Add('NEXT_PUBLIC_SUPABASE_ANON_KEY=' + $anon)
$lines.Add('SUPABASE_SERVICE_ROLE_KEY=' + $svc)
$lines.Add('')
$lines.Add('# Paystack is configured for REAL GHS payments (webhook active).')
$lines.Add('PAYSTACK_SECRET_KEY=')
$lines.Add('NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=')
$lines.Add('')
$lines.Add('NEXT_PUBLIC_APP_URL=https://talentledger-gh.vercel.app')
$lines.Add('')
$lines.Add('# Set manually to a strong value; must match the value in Vercel.')
$lines.Add('ADMIN_PASSWORD=' + $adminPw)

[System.IO.File]::WriteAllLines(
  (Join-Path (Get-Location) '.env.local'),
  [string[]]$lines,
  (New-Object System.Text.UTF8Encoding($false))
)

# Sanity check back
$anonOut = Get-Content .env.local | Where-Object { $_ -match '^NEXT_PUBLIC_SUPABASE_ANON_KEY=' }
$svcOut  = Get-Content .env.local | Where-Object { $_ -match '^SUPABASE_SERVICE_ROLE_KEY=' }
Write-Output ("written. url-bracket-trace=" + [string](Get-Content .env.local | Where-Object { $_ -match '\[https' }))
Write-Output ("anon ok=" + (($anonOut -replace '^NEXT_PUBLIC_SUPABASE_ANON_KEY=','') -eq $anon))
Write-Output ("svc  ok=" + (($svcOut  -replace '^SUPABASE_SERVICE_ROLE_KEY=','') -eq $svc))
