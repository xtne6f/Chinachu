@echo off
setlocal
pushd "%~dp0"
set PATH=%~dp0\usr\bin;%PATH%
rem pushd C:\Chinachu
rem set PATH=C:\Chinachu\usr\bin;%PATH%

set op=%1

if "%op%" == "" set /p op=Enter update^|start-operator^|start-wui^|unlock : 

if "%op%" == "update" (
  rem Be careful, this command is called from wui.
  node.exe app-scheduler.js %2 >>log\scheduler 2>&1
) else if "%op%" == "start-operator" (
  start "chinachu-operator" /min cmd /c node.exe --expose_gc app-operator.js ^>^>log\operator 2^>^&1
) else if "%op%" == "start-wui" (
  start "chinachu-wui" /min cmd /c node.exe --expose_gc app-wui.js ^>^>log\wui 2^>^&1
) else if "%op%" == "unlock" (
  echo Do NOT execute while recording or running scheduler, any key to continue:
  pause
  del data\tuner.*.lock
) else (
  echo Usage: chinachu update^|start-operator^|start-wui^|unlock
  pause
)

popd
endlocal
