@echo off
REM serve_local.bat — emergency local-serve for the showcase deck.
REM
REM Double-click in File Explorer, or run from any cmd/PowerShell.
REM Vercel free tier hit 100 deploys/day; this is the deterministic backup.
REM
REM Opens http://localhost:8000/slide/ in your default browser, then keeps
REM serving until you close this window or press Ctrl+C.

setlocal
cd /d "%~dp0\web"

if not exist "slide\index.html" (
  echo FATAL: %~dp0web\slide\index.html not found.
  pause
  exit /b 1
)
if not exist "live-demo.mp4" (
  echo FATAL: %~dp0web\live-demo.mp4 not found - embedded video will 404.
  pause
  exit /b 1
)

where python >nul 2>&1
if errorlevel 1 (
  where py >nul 2>&1
  if errorlevel 1 (
    echo FATAL: no python on PATH. Install Python 3 then retry.
    pause
    exit /b 1
  )
  set PY=py
) else (
  set PY=python
)

echo.
echo ==== showcase deck: local serve ====
echo   serving   : %CD%
echo   port      : 8000
echo   deck URL  : http://localhost:8000/slide/
echo   video URL : http://localhost:8000/live-demo.mp4
echo   stop      : close this window or Ctrl+C
echo.

start "" "http://localhost:8000/slide/"

%PY% -m http.server 8000 --bind 127.0.0.1
