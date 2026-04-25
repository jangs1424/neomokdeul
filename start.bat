@echo off
echo Starting neomokdeul dev servers...

start "admin (3001)" cmd /k "cd /d C:\dev\neomokdeul\apps\admin && pnpm next dev -p 3001 --turbopack"
start "webapp (3002)" cmd /k "cd /d C:\dev\neomokdeul\apps\webapp && pnpm next dev -p 3002 --turbopack"

timeout /t 3 /nobreak >nul
start chrome http://localhost:3001
start chrome http://localhost:3002
