# S2RTool Tray App Assets

This directory contains icon assets for the System Tray Application.

## Required Icons

### tray-icon.ico
- **Size:** 16x16, 32x32, 48x48, 256x256 (multi-resolution ICO)
- **Purpose:** System tray icon when services are stopped/inactive
- **Style:** Grayscale or muted colors

### tray-icon-active.ico
- **Size:** 16x16, 32x32, 48x48, 256x256 (multi-resolution ICO)
- **Purpose:** System tray icon when services are running/active
- **Style:** Green accent or brighter colors to indicate active state

## Icon Design Guidelines

- **Simple and recognizable** at small sizes (16x16)
- **Consistent design** between inactive and active states
- **High contrast** for visibility on both light and dark taskbars
- **Professional appearance** matching S2RTool branding

## Creating Icons

You can create ICO files using:
- **Online tools:** https://icoconvert.com, https://convertio.co/png-ico/
- **Desktop tools:** GIMP, Paint.NET (with ICO plugin), IconWorkshop
- **CLI tools:** ImageMagick, icon-gen

Example using ImageMagick:
```bash
convert logo.png -define icon:auto-resize=256,48,32,16 tray-icon.ico
```

## Placeholder Icons

For development/testing, you can use simple placeholder icons. The application will still function without custom icons, though the visual experience will be basic.

## Production Icons

For production deployment, replace these placeholders with professionally designed icons that match your S2RTool branding.
