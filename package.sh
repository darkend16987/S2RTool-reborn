#!/bin/bash

# ========================================
# S2RTool Packaging Script
# ========================================
# This script creates a deployment package for S2RTool
# Run this on your SOURCE machine to create a distributable package
#
# Usage:
#   ./package.sh [OPTIONS]
#
# Options:
#   -v, --version VERSION    Package version (default: auto-detect from git)
#   -o, --output DIR        Output directory (default: ./dist)
#   --include-source        Include source code in package
#   --help                  Show this help message
#
# Output:
#   Creates s2rtool-deploy-{version}.tar.gz in output directory
# ========================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
VERSION=""
OUTPUT_DIR="./dist"
INCLUDE_SOURCE=false

# Script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# ========================================
# Helper Functions
# ========================================

print_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

show_help() {
    cat << EOF
S2RTool Packaging Script

Usage:
  ./package.sh [OPTIONS]

Options:
  -v, --version VERSION    Package version (default: auto-detect from git)
  -o, --output DIR        Output directory (default: ./dist)
  --include-source        Include full source code in package
  --help                  Show this help message

Examples:
  # Create package with auto-detected version
  ./package.sh

  # Create package with specific version
  ./package.sh -v 1.0.0

  # Include source code in package (for offline builds)
  ./package.sh --include-source

  # Custom output directory
  ./package.sh -o /tmp/packages

EOF
    exit 0
}

# ========================================
# Parse Command Line Arguments
# ========================================

parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -v|--version)
                VERSION="$2"
                shift 2
                ;;
            -o|--output)
                OUTPUT_DIR="$2"
                shift 2
                ;;
            --include-source)
                INCLUDE_SOURCE=true
                shift
                ;;
            --help)
                show_help
                ;;
            *)
                print_error "Unknown option: $1"
                echo "Use --help to see available options"
                exit 1
                ;;
        esac
    done
}

# ========================================
# Detect Version
# ========================================

detect_version() {
    if [ -z "$VERSION" ]; then
        # Try to get version from git
        if command -v git &> /dev/null && git rev-parse --git-dir > /dev/null 2>&1; then
            VERSION=$(git describe --tags --always --dirty 2>/dev/null || echo "dev")
            print_info "Auto-detected version from git: $VERSION"
        else
            VERSION="latest"
            print_warning "Could not detect version, using: $VERSION"
        fi
    fi
}

# ========================================
# Create Package
# ========================================

create_package() {
    print_header "Creating Deployment Package"

    # Create output directory
    mkdir -p "$OUTPUT_DIR"
    print_success "Created output directory: $OUTPUT_DIR"

    # Create temporary packaging directory
    PACKAGE_NAME="s2rtool-deploy-$VERSION"
    TEMP_DIR="$OUTPUT_DIR/tmp-$PACKAGE_NAME"
    rm -rf "$TEMP_DIR"
    mkdir -p "$TEMP_DIR"

    print_info "Preparing package: $PACKAGE_NAME"

    # Copy deployment files
    print_info "Copying deployment files..."

    # Essential files
    cp docker-compose.production.yaml "$TEMP_DIR/docker-compose.yaml"
    cp .env.production.template "$TEMP_DIR/.env.template"
    cp deploy.sh "$TEMP_DIR/"
    chmod +x "$TEMP_DIR/deploy.sh"

    # Documentation
    if [ -f "README.DEPLOY.md" ]; then
        cp README.DEPLOY.md "$TEMP_DIR/"
    fi

    print_success "Copied deployment files"

    # Include source code if requested
    if [ "$INCLUDE_SOURCE" = true ]; then
        print_info "Including source code..."

        # Copy backend
        mkdir -p "$TEMP_DIR/backend"
        cp -r backend/* "$TEMP_DIR/backend/"

        # Copy frontend
        mkdir -p "$TEMP_DIR/frontend"
        cp -r frontend/* "$TEMP_DIR/frontend/"

        # Copy additional files
        [ -f "README.md" ] && cp README.md "$TEMP_DIR/"
        [ -f "HOW-IT-WORKS.md" ] && cp HOW-IT-WORKS.md "$TEMP_DIR/"
        [ -f "DOCKER_README.md" ] && cp DOCKER_README.md "$TEMP_DIR/"

        print_success "Source code included"
    else
        print_info "Source code excluded (use --include-source to include)"

        # Create minimal backend/frontend dirs with Dockerfiles only
        mkdir -p "$TEMP_DIR/backend"
        mkdir -p "$TEMP_DIR/frontend"

        # Copy Dockerfiles for local build fallback
        [ -f "backend/Dockerfile" ] && cp backend/Dockerfile "$TEMP_DIR/backend/"
        [ -f "backend/requirements.txt" ] && cp backend/requirements.txt "$TEMP_DIR/backend/"
        [ -f "frontend/Dockerfile" ] && cp frontend/Dockerfile "$TEMP_DIR/frontend/"
        [ -f "frontend/nginx.conf" ] && cp frontend/nginx.conf "$TEMP_DIR/frontend/" || true
    fi

    # Create deployment info file
    cat > "$TEMP_DIR/DEPLOYMENT_INFO.txt" << EOF
S2RTool Deployment Package
==========================

Version: $VERSION
Created: $(date)
Package Type: $([ "$INCLUDE_SOURCE" = true ] && echo "Full (with source)" || echo "Minimal (Docker images)")

Quick Start:
------------
1. Extract this package
2. Run: ./deploy.sh
3. Follow the prompts

Requirements:
------------
- Docker Engine 20.10+
- Docker Compose 2.0+
- Gemini API Key (get from: https://makersuite.google.com/app/apikey)

Support:
--------
- Documentation: See README.DEPLOY.md
- Issues: https://github.com/yourusername/S2RTool/issues

EOF

    print_success "Created deployment info"

    # Create archive
    print_info "Creating archive..."
    ARCHIVE_PATH="$OUTPUT_DIR/$PACKAGE_NAME.tar.gz"

    # Remove old archive if exists
    rm -f "$ARCHIVE_PATH"

    # Create new archive
    tar -czf "$ARCHIVE_PATH" -C "$OUTPUT_DIR" "tmp-$PACKAGE_NAME"

    # Rename directory inside archive
    mkdir -p "$OUTPUT_DIR/final"
    tar -xzf "$ARCHIVE_PATH" -C "$OUTPUT_DIR/final"
    mv "$OUTPUT_DIR/final/tmp-$PACKAGE_NAME" "$OUTPUT_DIR/final/$PACKAGE_NAME"
    tar -czf "$ARCHIVE_PATH" -C "$OUTPUT_DIR/final" "$PACKAGE_NAME"

    # Cleanup
    rm -rf "$TEMP_DIR"
    rm -rf "$OUTPUT_DIR/final"

    print_success "Archive created: $ARCHIVE_PATH"

    # Display archive info
    ARCHIVE_SIZE=$(du -h "$ARCHIVE_PATH" | cut -f1)
    print_info "Archive size: $ARCHIVE_SIZE"
}

# ========================================
# Generate Checksum
# ========================================

generate_checksum() {
    print_header "Generating Checksum"

    ARCHIVE_PATH="$OUTPUT_DIR/$PACKAGE_NAME.tar.gz"
    CHECKSUM_FILE="$ARCHIVE_PATH.sha256"

    if command -v sha256sum &> /dev/null; then
        sha256sum "$ARCHIVE_PATH" > "$CHECKSUM_FILE"
        print_success "SHA256 checksum created: $CHECKSUM_FILE"
        cat "$CHECKSUM_FILE"
    else
        print_warning "sha256sum not available, skipping checksum"
    fi
}

# ========================================
# Display Instructions
# ========================================

show_instructions() {
    print_header "Package Created Successfully!"

    ARCHIVE_PATH="$OUTPUT_DIR/$PACKAGE_NAME.tar.gz"

    echo ""
    print_success "Deployment package is ready!"
    echo ""
    print_info "Package location:"
    echo "  $ARCHIVE_PATH"
    echo ""
    print_info "To deploy on target machine:"
    echo ""
    echo "  # 1. Transfer package to target machine"
    echo "  scp $ARCHIVE_PATH user@target-machine:/tmp/"
    echo ""
    echo "  # 2. Extract on target machine"
    echo "  tar -xzf $PACKAGE_NAME.tar.gz"
    echo "  cd $PACKAGE_NAME"
    echo ""
    echo "  # 3. Run deployment script"
    echo "  ./deploy.sh"
    echo ""

    if [ "$INCLUDE_SOURCE" = false ]; then
        print_warning "This is a minimal package (no source code included)"
        print_info "It will pull pre-built images from Docker registry"
        print_info "Make sure you've pushed images using: ./build-and-push.sh"
    else
        print_info "This package includes full source code"
        print_info "It can build images locally without registry access"
    fi

    echo ""
}

# ========================================
# Main Execution
# ========================================

main() {
    print_header "S2RTool Packaging Script v1.0"

    parse_args "$@"
    detect_version
    create_package
    generate_checksum
    show_instructions

    print_success "All done! 🎉"
}

# Run main function
main "$@"
