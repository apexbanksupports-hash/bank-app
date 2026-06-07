@ECHO off
SET NODE_PATH=C:\Program Files\nodejs\node.exe
"%NODE_PATH%" "%~dp0node_modules\tsx\dist\cli.mjs" %*
