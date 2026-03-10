@echo off
title Hutch Turbo Network Dashboard
color 0A
chcp 65001 >nul

echo Starting Hutch Turbo Dashboard...
echo.

powershell -ExecutionPolicy Bypass -NoProfile -File "%~dp0hutch_dashboard.ps1"

pause