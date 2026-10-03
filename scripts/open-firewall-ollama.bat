@echo off
:: Run as Administrator — allow LAN/Docker access to Ollama on port 11434
netsh advfirewall firewall delete rule name="Life OS Ollama" >nul 2>&1
netsh advfirewall firewall add rule name="Life OS Ollama" dir=in action=allow protocol=TCP localport=11434 profile=private,domain
if %ERRORLEVEL% EQU 0 (
  echo Firewall rule "Life OS Ollama" created: inbound TCP 11434 allowed.
) else (
  echo Failed. Right-click this file and choose "Run as administrator".
  exit /b 1
)
pause
