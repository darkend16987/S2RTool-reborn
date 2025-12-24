; ============================================
; S2RTool Standalone Installer
; Inno Setup Script v6.0+
; ============================================

#define MyAppName "S2RTool"
#define MyAppVersion "4.0"
#define MyAppPublisher "S2RTool Development Team"
#define MyAppURL "https://github.com/darkend16987/S2RTool-reborn"
#define MyAppExeName "S2RTray.exe"

[Setup]
; Basic Information
AppId={{8F9C7E6D-4A3B-2E1D-9C8F-7E6D4A3B2E1D}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
AppCopyright=Copyright (C) 2025 {#MyAppPublisher}

; Installation Directories
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
DisableDirPage=no
DisableProgramGroupPage=yes

; Output
OutputDir=Output
OutputBaseFilename=S2RTool-Installer-v{#MyAppVersion}
SetupIconFile=assets\icon.ico
UninstallDisplayIcon={app}\tray-app\assets\tray-icon.ico

; Compression
Compression=lzma2/ultra64
SolidCompression=yes
LZMANumBlockThreads=4
LZMAUseSeparateProcess=yes

; Architecture
ArchitecturesAllowed=x64
ArchitecturesInstallIn64BitMode=x64

; Privileges
PrivilegesRequired=admin
PrivilegesRequiredOverridesAllowed=dialog

; Version Requirements
MinVersion=10.0.19041
OnlyBelowVersion=0

; Appearance
WizardStyle=modern
WizardSizePercent=120,100
DisableWelcomePage=no
ShowLanguageDialog=no
UsePreviousAppDir=yes
UsePreviousGroup=yes

; Uninstall
UninstallDisplayName={#MyAppName}
UninstallFilesDir={app}\uninstall
CreateUninstallRegKey=yes

; Logging (for debugging)
; SetupLogging=yes

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "Create a &desktop shortcut"; GroupDescription: "Additional icons:"; Flags: unchecked

[Files]
; ============================================
; Rancher Desktop Installer (600MB)
; ============================================
; NOTE: You need to download Rancher Desktop installer manually
; Download from: https://github.com/rancher-sandbox/rancher-desktop/releases
; Place it in: installer/bin/RancherDesktop-Setup.exe
; Uncomment the line below when you have the file:
; Source: "bin\RancherDesktop-Setup.exe"; DestDir: "{tmp}"; Flags: deleteafterinstall; Check: not IsRancherDesktopInstalled

; ============================================
; Docker Images (compressed)
; ============================================
; NOTE: You need to export and compress Docker images first
; Run: docker save s2rtool-backend:latest | gzip > s2rtool-backend-4.0.tar.gz
; Run: docker save s2rtool-frontend:latest | gzip > s2rtool-frontend-4.0.tar.gz
; Place them in: installer/images/
; Uncomment the lines below when you have the files:
; Source: "images\s2rtool-backend-4.0.tar.gz"; DestDir: "{app}\images"; Flags: ignoreversion
; Source: "images\s2rtool-frontend-4.0.tar.gz"; DestDir: "{app}\images"; Flags: ignoreversion

; ============================================
; Application Files
; ============================================
; Docker Compose configuration
Source: "..\docker-compose.yaml"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\docker-compose.production.yaml"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\.env.production.template"; DestName: ".env.template"; DestDir: "{app}"; Flags: ignoreversion

; Scripts
Source: "scripts\*.bat"; DestDir: "{app}\scripts"; Flags: ignoreversion

; Configuration Wizard
Source: "config-wizard\*"; DestDir: "{app}\config-wizard"; Flags: ignoreversion recursesubdirs createallsubdirs

; System Tray App
Source: "tray-app\*"; DestDir: "{app}\tray-app"; Flags: ignoreversion recursesubdirs createallsubdirs

; NSSM (Windows Service Manager)
; NOTE: You need to download NSSM manually
; Download from: https://nssm.cc/release/nssm-2.24.zip
; Extract and place nssm.exe in: installer/bin/
; Uncomment the line below when you have the file:
; Source: "bin\nssm.exe"; DestDir: "{app}\bin"; Flags: ignoreversion

; README and Documentation
Source: "README.md"; DestDir: "{app}"; Flags: ignoreversion isreadme
Source: "..\README.md"; DestName: "S2RTool-README.md"; DestDir: "{app}"; Flags: ignoreversion

[Dirs]
; Create necessary directories
Name: "{app}\references"; Permissions: users-modify
Name: "{app}\logs"; Permissions: users-modify
Name: "{app}\images"
Name: "{app}\scripts"
Name: "{app}\config-wizard"
Name: "{app}\tray-app"
Name: "{app}\bin"

[Icons]
; Start Menu shortcuts
Name: "{group}\{#MyAppName}"; Filename: "http://localhost:3001"; IconFilename: "{app}\tray-app\assets\tray-icon.ico"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
Name: "{group}\Configuration"; Filename: "{app}\config-wizard\S2RConfigWizard.exe"; Parameters: """{app}"""
Name: "{group}\View Logs"; Filename: "cmd.exe"; Parameters: "/k cd /d ""{app}"" && docker-compose logs -f"; IconFilename: "{sys}\cmd.exe"

; Desktop shortcut (if task selected)
Name: "{autodesktop}\{#MyAppName}"; Filename: "http://localhost:3001"; IconFilename: "{app}\tray-app\assets\tray-icon.ico"; Tasks: desktopicon

[Run]
; ============================================
; Installation Steps
; ============================================

; Step 1: Check and install WSL2 (if needed)
Filename: "{cmd}"; Parameters: "/c wsl --install --no-distribution"; StatusMsg: "Installing WSL2..."; Flags: runhidden waituntilterminated; Check: not IsWSL2Installed

; Step 2: Install Rancher Desktop (silent installation)
; Uncomment when you have Rancher Desktop installer:
; Filename: "{tmp}\RancherDesktop-Setup.exe"; Parameters: "/S"; StatusMsg: "Installing Rancher Desktop..."; Flags: waituntilterminated; Check: not IsRancherDesktopInstalled

; Step 3: Wait for Rancher Desktop to be ready
; Give Rancher Desktop time to start (30 seconds)
; Filename: "{cmd}"; Parameters: "/c timeout /t 30 /nobreak"; StatusMsg: "Waiting for Rancher Desktop to initialize..."; Flags: runhidden waituntilterminated; Check: not IsRancherDesktopInstalled

; Step 4: Configure Rancher Desktop to use dockerd
; Filename: "{cmd}"; Parameters: "/c ""rdctl"" set --container-engine dockerd"; StatusMsg: "Configuring container runtime..."; Flags: runhidden waituntilterminated; Check: not IsRancherDesktopInstalled

; Step 5: Disable Kubernetes (not needed for S2RTool)
; Filename: "{cmd}"; Parameters: "/c ""rdctl"" set --kubernetes-enabled=false"; StatusMsg: "Disabling Kubernetes..."; Flags: runhidden waituntilterminated; Check: not IsRancherDesktopInstalled

; Step 6: Load Docker images
; Uncomment when you have the load-images script ready:
; Filename: "{app}\scripts\load-images.bat"; Parameters: """{app}"""; StatusMsg: "Loading S2RTool container images..."; Flags: runhidden waituntilterminated

; Step 7: Launch Configuration Wizard
Filename: "{app}\config-wizard\S2RConfigWizard.exe"; Parameters: """{app}"""; Description: "Configure S2RTool now"; Flags: postinstall nowait skipifsilent

; Step 8: Start System Tray App
Filename: "{app}\tray-app\S2RTray.exe"; Parameters: """{app}"""; Description: "Start S2RTool Tray Application"; Flags: postinstall nowait skipifsilent

[UninstallRun]
; Stop services before uninstall
Filename: "{app}\scripts\uninstall-service.bat"; Parameters: """{app}"""; RunOnceId: "StopService"; Flags: runhidden waituntilterminated

; Stop containers
Filename: "{cmd}"; Parameters: "/c cd /d ""{app}"" && docker-compose down"; RunOnceId: "StopContainers"; Flags: runhidden waituntilterminated

[UninstallDelete]
; Clean up generated files
Type: files; Name: "{app}\.env"
Type: files; Name: "{app}\logs\*"
Type: dirifempty; Name: "{app}\logs"
Type: dirifempty; Name: "{app}\references"

[Registry]
; Add tray app to Windows startup
Root: HKCU; Subkey: "Software\Microsoft\Windows\CurrentVersion\Run"; ValueType: string; ValueName: "S2RTool"; ValueData: """{app}\tray-app\S2RTray.exe"" """{app}""""; Flags: uninsdeletevalue

[Code]
// ============================================
// Pascal Script Functions
// ============================================

var
  WSL2RequiresReboot: Boolean;

// Check if WSL2 is installed
function IsWSL2Installed: Boolean;
var
  ResultCode: Integer;
begin
  Result := Exec('wsl.exe', '--status', '', SW_HIDE, ewWaitUntilTerminated, ResultCode) and (ResultCode = 0);
end;

// Check if Rancher Desktop is installed
function IsRancherDesktopInstalled: Boolean;
var
  RancherPath: String;
begin
  RancherPath := ExpandConstant('{autopf}\Rancher Desktop\Rancher Desktop.exe');
  Result := FileExists(RancherPath);
end;

// Check if Docker is available
function IsDockerAvailable: Boolean;
var
  ResultCode: Integer;
begin
  Result := Exec('docker.exe', '--version', '', SW_HIDE, ewWaitUntilTerminated, ResultCode) and (ResultCode = 0);
end;

// Initialize Setup
function InitializeSetup(): Boolean;
var
  ResultCode: Integer;
  DiskSpace: Int64;
  MemorySize: Int64;
begin
  Result := True;
  WSL2RequiresReboot := False;

  // Check minimum Windows version
  if not IsWindows10OrLater then
  begin
    MsgBox('S2RTool requires Windows 10 Build 19041 or later, or Windows 11.' + #13#10#13#10 +
           'Your Windows version is not supported.', mbError, MB_OK);
    Result := False;
    Exit;
  end;

  // Check disk space (5GB minimum)
  DiskSpace := GetSpaceOnDisk(ExpandConstant('{autopf}'), False);
  if DiskSpace < 5368709120 then // 5GB in bytes
  begin
    MsgBox('Insufficient disk space.' + #13#10#13#10 +
           'S2RTool requires at least 5GB of free disk space.' + #13#10 +
           'Please free up some space and try again.', mbError, MB_OK);
    Result := False;
    Exit;
  end;

  // Check RAM (4GB minimum recommended)
  MemorySize := GetTotalPhysicalMemory div 1024 div 1024; // Convert to MB
  if MemorySize < 4096 then // 4GB
  begin
    if MsgBox('Your system has less than 4GB of RAM.' + #13#10#13#10 +
              'S2RTool may run slowly with limited memory.' + #13#10#13#10 +
              'Do you want to continue anyway?', mbConfirmation, MB_YESNO) = IDNO then
    begin
      Result := False;
      Exit;
    end;
  end;

  // Check WSL2 and offer to install
  if not IsWSL2Installed then
  begin
    if MsgBox('WSL2 (Windows Subsystem for Linux) is not installed.' + #13#10#13#10 +
              'S2RTool requires WSL2 to run Docker containers.' + #13#10#13#10 +
              'Would you like to install WSL2 now?' + #13#10 +
              'Note: This may require a system reboot.', mbConfirmation, MB_YESNO) = IDYES then
    begin
      WSL2RequiresReboot := True;
      // WSL2 installation will happen in [Run] section
    end
    else
    begin
      if MsgBox('S2RTool cannot function without WSL2.' + #13#10#13#10 +
                'Installation will be aborted.' + #13#10#13#10 +
                'You can install WSL2 manually by running:' + #13#10 +
                'wsl --install' + #13#10#13#10 +
                'in PowerShell as Administrator, then run this installer again.', mbInformation, MB_OK) = IDOK then
      begin
        Result := False;
        Exit;
      end;
    end;
  end;
end;

// Called when setup is finishing
procedure CurStepChanged(CurStep: TSetupStep);
var
  ResultCode: Integer;
begin
  if CurStep = ssPostInstall then
  begin
    // Check if WSL2 was just installed and needs reboot
    if WSL2RequiresReboot then
    begin
      MsgBox('WSL2 has been installed successfully.' + #13#10#13#10 +
             'Your computer needs to be restarted to complete the installation.' + #13#10#13#10 +
             'After restarting, please run this installer again to complete S2RTool setup.',
             mbInformation, MB_OK);
    end;
  end;
end;

// Custom page for showing installation progress
procedure InitializeWizard();
var
  WelcomePage: TWizardPage;
begin
  // Create custom welcome page with additional information
  // (This is optional - you can customize the wizard appearance here)
end;

// Check if uninstall should proceed
function InitializeUninstall(): Boolean;
var
  Choice: Integer;
begin
  Result := True;

  Choice := MsgBox('Are you sure you want to uninstall S2RTool?' + #13#10#13#10 +
                   'This will:' + #13#10 +
                   '• Stop all running services' + #13#10 +
                   '• Remove the Windows Service' + #13#10 +
                   '• Delete application files' + #13#10#13#10 +
                   'Note: Your reference images and configuration will be preserved.' + #13#10 +
                   'Rancher Desktop will NOT be removed.',
                   mbConfirmation, MB_YESNO);

  if Choice = IDNO then
    Result := False;
end;

// Cleanup after uninstall
procedure CurUninstallStepChanged(CurUninstallStep: TUninstallStep);
begin
  if CurUninstallStep = usPostUninstall then
  begin
    MsgBox('S2RTool has been uninstalled successfully.' + #13#10#13#10 +
           'Your reference images and Rancher Desktop have been preserved.' + #13#10 +
           'You can manually remove them if needed.', mbInformation, MB_OK);
  end;
end;

// ============================================
// End of Inno Setup Script
// ============================================
