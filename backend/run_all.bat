@echo off
echo Starting all backend and frontend processes...

:: Start flight.py
start cmd /k "cd C:\xampp\htdocs\Internship\tripglide\backend\flight && python flight.py"

:: Start server.js
start cmd /k "cd C:\xampp\htdocs\Internship\tripglide\backend && node server.js"

:: Start login.py
start cmd /k "cd C:\xampp\htdocs\Internship\tripglide\backend && python login.py"

:: Start hotelApp.py
start cmd /k "cd C:\xampp\htdocs\Internship\tripglide\backend && python hotelApp.py"

:: Start carapp.py
start cmd /k "cd C:\xampp\htdocs\Internship\tripglide\backend && python carapp.py"

:: Start frontend
start cmd /k "cd C:\xampp\htdocs\Internship\tripglide\frontend && npm run dev"

echo All processes started. Press any key to exit...
pause