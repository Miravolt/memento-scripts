@echo off
rem Dubbelklicka den har filen for att kora testerna och pusha till GitHub.
chcp 65001 >nul
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\push.ps1" %*
