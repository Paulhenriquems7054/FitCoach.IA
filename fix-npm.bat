@echo off
echo Copiando dependencias de D:\NUTRI.IA para D:\APP-NUTRI.IA...
echo.

set "SOURCE=D:\NUTRI.IA\node_modules"
set "DEST=D:\APP-NUTRI.IA\node_modules"

echo Copiando Vite...
xcopy /E /I /Y "%SOURCE%\vite" "%DEST%\vite" >nul

echo Copiando Rollup...
xcopy /E /I /Y "%SOURCE%\rollup" "%DEST%\rollup" >nul

echo Copiando plugin-react...
if not exist "%DEST%\@vitejs" mkdir "%DEST%\@vitejs"
xcopy /E /I /Y "%SOURCE%\@vitejs\plugin-react" "%DEST%\@vitejs\plugin-react" >nul

echo Copiando esbuild...
xcopy /E /I /Y "%SOURCE%\esbuild" "%DEST%\esbuild" >nul

echo Copiando outras dependencias essenciais...
xcopy /E /I /Y "%SOURCE%\.bin" "%DEST%\.bin" /Y >nul

echo.
echo Concluido! Execute: npm run dev
echo.
pause
