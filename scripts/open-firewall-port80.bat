@echo off
:: Run as Administrator to allow LAN access to Life OS on port 80
netsh advfirewall firewall delete rule name="Life OS Web HTTP" >nul 2>&1
netsh advfirewall firewall add rule name="Life OS Web HTTP" dir=in action=allow protocol=TCP localport=80 profile=private,domain
if %ERRORLEVEL% EQU 0 (
  echo Firewall rule "Life OS Web HTTP" created: inbound TCP 80 allowed.
) else (
  echo Failed. Right-click this file and choose "Run as administrator".
  exit /b 1
)
pause
