$ErrorActionPreference = 'Stop'

$Repo     = 'C:\Users\maxi_\Opencode\open-daycare'
$OpenCode = Join-Path $env:APPDATA 'npm\node_modules\opencode-ai\bin\opencode.exe'
if (-not (Test-Path -LiteralPath $OpenCode)) {
    $OpenCode = (Get-Command opencode -CommandType Application -ErrorAction Stop).Source
}

$LogDir = Join-Path $Repo '.opencode\logs'
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
$Log = Join-Path $LogDir ('db-security-audit_{0:yyyy-MM-dd_HHmmss}.log' -f (Get-Date))

$env:PATH     = "C:\Program Files\nodejs;$env:APPDATA\npm;$env:PATH"
$env:NO_COLOR = '1'

$mutex = [System.Threading.Mutex]::new($false, 'OpenDaycareDbSecurityAudit')
if (-not $mutex.WaitOne(0)) {
    'Otra ejecución ya está en curso; se omite este disparo.' | Out-File -LiteralPath $Log -Encoding utf8
    exit 0
}

try {
    Set-Location -LiteralPath $Repo

    $Prompt = 'Realiza una auditoría completa de seguridad de PostgreSQL/Supabase y control de acceso. Revisa supabase/migrations/, app/, utils/supabase/ y proxy.ts. Entrega el informe por severidad con SQL/TS de remediación.'

    & $OpenCode run --agent db-security-auditor $Prompt 2>&1 | Tee-Object -FilePath $Log
    $exitCode = $LASTEXITCODE

    if ($exitCode -ne 0) {
        "opencode terminó con código $exitCode" | Out-File -LiteralPath $Log -Append -Encoding utf8
        exit $exitCode
    }
}
catch {
    $_ | Out-String | Out-File -LiteralPath $Log -Append -Encoding utf8
    exit 1
}
finally {
    $mutex.ReleaseMutex()
}
