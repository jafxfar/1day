$ErrorActionPreference = 'Stop'
$ollama = Join-Path $env:LOCALAPPDATA 'Programs\Ollama\ollama.exe'
Write-Output "path=$ollama exists=$([IO.File]::Exists($ollama))"

Get-Process ollama* -ErrorAction SilentlyContinue | ForEach-Object {
  Write-Output "killing $($_.Id) $($_.ProcessName)"
  Stop-Process -Id $_.Id -Force
}
Start-Sleep -Seconds 2

[Environment]::SetEnvironmentVariable('OLLAMA_HOST', '0.0.0.0', 'User')
$env:OLLAMA_HOST = '0.0.0.0'

Start-Process -FilePath $ollama -ArgumentList 'serve' -WindowStyle Hidden
Start-Sleep -Seconds 5

Get-NetTCPConnection -LocalPort 11434 -ErrorAction SilentlyContinue |
  Select-Object LocalAddress, LocalPort, State |
  Format-Table -AutoSize

try {
  Write-Output ("loopback=" + (Invoke-WebRequest -Uri 'http://127.0.0.1:11434/api/tags' -UseBasicParsing -TimeoutSec 5).StatusCode)
} catch {
  Write-Output ("loopback_error=" + $_.Exception.Message)
}

try {
  Write-Output ("lan=" + (Invoke-WebRequest -Uri 'http://10.0.0.90:11434/api/tags' -UseBasicParsing -TimeoutSec 5).StatusCode)
} catch {
  Write-Output ("lan_error=" + $_.Exception.Message)
}
