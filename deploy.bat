@echo off
cd C:\Users\Usuario\panapp
set /p msg="Mensaje del commit: "
git add .
git commit -m "%msg%"
git push origin main
npm run deploy
pause
