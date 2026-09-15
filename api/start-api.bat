@echo off
cd /d "%~dp0"
echo PHP + SQLite: http://127.0.0.1:8080/index.php
php -S 127.0.0.1:8080 -t "%~dp0"
pause
