# S2RTool Configuration Wizard Assets

This directory contains assets for the Configuration Wizard application.

## Required Assets

### icon.ico
- **Size:** Multi-resolution (16x16, 32x32, 48x48, 256x256)
- **Purpose:** Window icon for Configuration Wizard
- **Style:** S2RTool logo or branded icon

### logo.png
- **Size:** 200x200px (or larger, will be scaled)
- **Purpose:** Logo displayed in wizard header
- **Format:** PNG with transparency
- **Style:** Full-color S2RTool logo

## Optional Assets

### banner.bmp
- **Size:** 164x314px
- **Purpose:** Side banner for installer wizard (if using advanced Inno Setup)
- **Format:** BMP, 24-bit color

### wizard-image.bmp
- **Size:** 497x312px
- **Purpose:** Large image for installer welcome screen
- **Format:** BMP, 24-bit color

## Asset Guidelines

- Use **consistent branding** across all assets
- Ensure **high quality** at all resolutions
- Use **transparent backgrounds** for PNG files
- Follow **Windows UI guidelines** for icon design

## Temporary Placeholders

During development, the application will use default Electron icons if these assets are not present. For production, ensure all required assets are included.
