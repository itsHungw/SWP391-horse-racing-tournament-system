# Loads the repo-root .env into this session, then runs the Spring Boot backend.
# Why: Spring Boot does NOT read .env natively, and Maven only inherits the shell's
# environment. This bridges .env -> `mvn spring-boot:run` so ALL config (DB, JWT,
# MinIO, VNPay) lives in one place (.env) instead of scattered Windows system vars.
#
# Usage (from repo root):  .\run-backend.ps1

$envFile = Join-Path $PSScriptRoot '.env'
if (-not (Test-Path $envFile)) { throw ".env not found at $envFile (copy .env.example -> .env)" }

function Set-EnvIfMissing {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Name,
        [Parameter(Mandatory = $true)]
        [string]$Value
    )

    if ([string]::IsNullOrWhiteSpace((Get-Item -Path "Env:$Name" -ErrorAction SilentlyContinue).Value)) {
        [Environment]::SetEnvironmentVariable($Name, $Value)
    }
}

Get-Content $envFile | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith('#') -and $line.Contains('=')) {
        $idx = $line.IndexOf('=')
        $key = $line.Substring(0, $idx).Trim()
        $val = $line.Substring($idx + 1).Trim()
        [Environment]::SetEnvironmentVariable($key, $val)   # process scope -> inherited by mvn/java
    }
}

# Spring Boot / PostgreSQL are sensitive to the JVM timezone during datasource
# and Flyway initialization, so set a canonical zone if the caller did not.
Set-EnvIfMissing -Name 'JAVA_TOOL_OPTIONS' -Value '-Duser.timezone=Asia/Ho_Chi_Minh'

# Default to the local dev profile when .env omits it.
Set-EnvIfMissing -Name 'SPRING_PROFILES_ACTIVE' -Value 'dev'

Write-Host "Loaded .env. Profile='$env:SPRING_PROFILES_ACTIVE', DB=$env:DB_URL" -ForegroundColor Green
Set-Location (Join-Path $PSScriptRoot 'backend')
& .\mvnw.cmd spring-boot:run