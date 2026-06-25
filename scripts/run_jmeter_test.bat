@echo off
echo ====================================================
echo BATCH SCRIPT CHAY JMETER LOAD TEST CHO CANVAS LMS
echo ====================================================

REM Setup duong dan den thu muc Jmeter bin (Neu da add vao PATH thi co de the bo qua)
REM set JMETER_HOME="C:\apache-jmeter\bin"

set SCRIPT_DIR=%~dp0
set JMETER_SCRIPT=%SCRIPT_DIR%jmeter_test_plan.jmx
set RESULT_FILE=%SCRIPT_DIR%jmeter_results.csv
set REPORT_DIR=%SCRIPT_DIR%jmeter_html_report

echo Xoa ket qua cu...
if exist "%RESULT_FILE%" del /q "%RESULT_FILE%"
if exist "%REPORT_DIR%" rmdir /s /q "%REPORT_DIR%"

echo.
echo Dang chay JMeter Test Plan trong che do Non-GUI Mode...
echo Xin doi trong vai giay...

REM Chay script (Luu y: ban phai dam bao command 'jmeter' chay duoc o terminal)
jmeter -n -t "%JMETER_SCRIPT%" -l "%RESULT_FILE%" -e -o "%REPORT_DIR%"

echo.
echo ====================================================
echo KIEM THU HOAN TAT!
echo Xem log ket qua tai: %RESULT_FILE%
echo Xem Report HTML (Mo bang Chrome/Edge) tai: %REPORT_DIR%\index.html
echo ====================================================
pause
