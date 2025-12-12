================================================================
   S2RTool - Sketch to Render Tool
   Quick Start for Windows 10/11
================================================================

STEP 1: Install Docker Desktop (if not already installed)
----------------------------------------------------------
1. Open: DOCKER-INSTALLATION-GUIDE.md
2. Follow the instructions
3. Come back here when Docker is running


STEP 2: Install S2RTool
----------------------------------------------------------
1. Double-click: install-windows.bat
2. Follow the on-screen instructions
3. Enter your Gemini API key when prompted
4. Wait for installation to complete
5. Browser will open automatically


STEP 3: Daily Usage
----------------------------------------------------------
To START the app:
  → Double-click: start.bat

To STOP the app:
  → Double-click: stop.bat

To check STATUS:
  → Double-click: status.bat

To view LOGS:
  → Double-click: logs.bat


TROUBLESHOOTING
----------------------------------------------------------
If something goes wrong:
  1. Open: WINDOWS-SETUP.md
  2. Go to "Troubleshooting" section
  3. Or run: status.bat to check what's wrong


QUICK HELP
----------------------------------------------------------
Q: Docker Desktop is not installed?
A: Open DOCKER-INSTALLATION-GUIDE.md

Q: Where do I get Gemini API key?
A: https://makersuite.google.com/app/apikey

Q: Application won't start?
A: 1. Make sure Docker Desktop is running
   2. Run status.bat to check
   3. Run logs.bat to see errors

Q: Port already in use?
A: Edit .env file and change FRONTEND_PORT

Q: How to update S2RTool?
A: Double-click update.bat


AVAILABLE SCRIPTS
----------------------------------------------------------
install-windows.bat  → First-time installation
start.bat            → Launch application (daily use)
stop.bat             → Stop application
restart.bat          → Restart application
status.bat           → Check system status
logs.bat             → View logs
update.bat           → Update to new version
clean.bat            → Clean up containers


SYSTEM REQUIREMENTS
----------------------------------------------------------
- Windows 10 version 1903+ or Windows 11
- 4GB RAM minimum (8GB recommended)
- 10GB free disk space
- Internet connection


DOCUMENTATION
----------------------------------------------------------
DOCKER-INSTALLATION-GUIDE.md → How to install Docker
WINDOWS-SETUP.md             → Complete Windows guide
.env.production.template     → Configuration template


SUPPORT
----------------------------------------------------------
For detailed help, open: WINDOWS-SETUP.md


================================================================
Ready to start? Double-click: install-windows.bat
================================================================
