@echo off
setlocal
cd /d "%~dp0\..\.."
call npm.cmd run dev -- --host 0.0.0.0
pause
