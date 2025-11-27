#!/bin/bash

# ========================================
# S2RTool Build and Push Script
# ========================================
# This script builds Docker images and pushes them to a registry
# Run this on your SOURCE machine (where you develop)
#
# Usage:
#   ./build-and-push.sh [OPTIONS]
#
# Options:
#   -u, --username USERNAME    Docker registry username (default: from .env)
#   -r, --registry REGISTRY    Docker registry URL (default: docker.io)
#   -v, --version VERSION      Image version tag (default: latest)
#   -n, --no-push             Build only, don't push to registry
#   --help                    Show this help message
#
# Prerequisites:
#   - Docker Engine 20.10+
#   - Docker Hub account (or other registry)
#   - Logged in to registry (docker login)
# ========================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
DOCKER_REGISTRY="docker.io"
DOCKER_USERNAME=""
VERSION="latest"
PUSH_IMAGES=true

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
S2RTool Build and Push Script

Usage:
  ./build-and-push.sh [OPTIONS]

Options:
  -u, --username USERNAME    Docker registry username
  -r, --registry REGISTRY    Docker registry URL (default: docker.io)
  -v, --version VERSION      Image version tag (default: latest)
  -n, --no-push             Build only, don't push to registry
  --help                    Show this help message

Examples:
  # Build and push with default settings
  ./build-and-push.sh

  # Build and push with custom username and version
  ./build-and-push.sh -u myusername -v 1.0.0

  # Build only (no push)
  ./build-and-push.sh -n

  # Push to GitHub Container Registry
  ./build-and-push.sh -r ghcr.io -u myusername

EOF
    exit 0
}

# ========================================
# Parse Command Line Arguments
# ========================================

parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -u|--username)
                DOCKER_USERNAME="$2"
                shift 2
                ;;
            -r|--registry)
                DOCKER_REGISTRY="$2"
                shift 2
                ;;
            -v|--version)
                VERSION="$2"
                shift 2
                ;;
            -n|--no-push)
                PUSH_IMAGES=false
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
# Load Configuration
# ========================================

load_config() {
    # Try to load from .env file if exists
    if [ -f ".env" ]; then
        source .env
        print_info "Loaded configuration from .env"
    fi

    # Use environment variables if not set by command line
    if [ -z "$DOCKER_USERNAME" ]; then
        DOCKER_USERNAME="${DOCKER_USERNAME:-}"
    fi
}

# ========================================
# Validate Configuration
# ========================================

validate_config() {
    print_header "Validating Configuration"

    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed!"
        exit 1
    fi
    print_success "Docker is installed"

    # Check if Docker daemon is running
    if ! docker info &> /dev/null; then
        print_error "Docker daemon is not running!"
        exit 1
    fi
    print_success "Docker daemon is running"

    # Check username
    if [ -z "$DOCKER_USERNAME" ]; then
        print_error "Docker username not specified!"
        echo ""
        echo "Please provide username using:"
        echo "  1. Command line: ./build-and-push.sh -u yourusername"
        echo "  2. Environment: export DOCKER_USERNAME=yourusername"
        echo "  3. .env file: DOCKER_USERNAME=yourusername"
        exit 1
    fi
    print_success "Docker username: $DOCKER_USERNAME"

    # Check registry login (if pushing)
    if [ "$PUSH_IMAGES" = true ]; then
        if ! docker info | grep -q "Username"; then
            print_warning "You might not be logged in to Docker registry"
            print_info "Run: docker login $DOCKER_REGISTRY"
            read -p "Continue anyway? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                exit 1
            fi
        fi
    fi

    # Display configuration
    echo ""
    print_info "Build Configuration:"
    echo "  Registry: $DOCKER_REGISTRY"
    echo "  Username: $DOCKER_USERNAME"
    echo "  Version:  $VERSION"
    echo "  Push:     $PUSH_IMAGES"
    echo ""
}

# ========================================
# Build Images
# ========================================

build_images() {
    print_header "Building Docker Images"

    # Define image names
    BACKEND_IMAGE="$DOCKER_REGISTRY/$DOCKER_USERNAME/s2rtool-backend:$VERSION"
    FRONTEND_IMAGE="$DOCKER_REGISTRY/$DOCKER_USERNAME/s2rtool-frontend:$VERSION"

    # Build backend
    print_info "Building backend image..."
    docker build -t "$BACKEND_IMAGE" ./backend
    print_success "Backend image built: $BACKEND_IMAGE"

    # Tag as latest if not already
    if [ "$VERSION" != "latest" ]; then
        docker tag "$BACKEND_IMAGE" "$DOCKER_REGISTRY/$DOCKER_USERNAME/s2rtool-backend:latest"
        print_success "Tagged as latest"
    fi

    # Build frontend
    print_info "Building frontend image..."
    docker build -t "$FRONTEND_IMAGE" ./frontend
    print_success "Frontend image built: $FRONTEND_IMAGE"

    # Tag as latest if not already
    if [ "$VERSION" != "latest" ]; then
        docker tag "$FRONTEND_IMAGE" "$DOCKER_REGISTRY/$DOCKER_USERNAME/s2rtool-frontend:latest"
        print_success "Tagged as latest"
    fi

    # Display image sizes
    echo ""
    print_info "Image sizes:"
    docker images | grep "s2rtool-" | grep "$DOCKER_USERNAME"
}

# ========================================
# Push Images
# ========================================

push_images() {
    if [ "$PUSH_IMAGES" = false ]; then
        print_warning "Skipping push (--no-push flag set)"
        return
    fi

    print_header "Pushing Images to Registry"

    BACKEND_IMAGE="$DOCKER_REGISTRY/$DOCKER_USERNAME/s2rtool-backend:$VERSION"
    FRONTEND_IMAGE="$DOCKER_REGISTRY/$DOCKER_USERNAME/s2rtool-frontend:$VERSION"

    # Push backend
    print_info "Pushing backend image..."
    docker push "$BACKEND_IMAGE"
    print_success "Backend image pushed"

    # Push backend:latest if version is not latest
    if [ "$VERSION" != "latest" ]; then
        docker push "$DOCKER_REGISTRY/$DOCKER_USERNAME/s2rtool-backend:latest"
        print_success "Backend:latest pushed"
    fi

    # Push frontend
    print_info "Pushing frontend image..."
    docker push "$FRONTEND_IMAGE"
    print_success "Frontend image pushed"

    # Push frontend:latest if version is not latest
    if [ "$VERSION" != "latest" ]; then
        docker push "$DOCKER_REGISTRY/$DOCKER_USERNAME/s2rtool-frontend:latest"
        print_success "Frontend:latest pushed"
    fi
}

# ========================================
# Generate Deployment Instructions
# ========================================

generate_instructions() {
    print_header "Deployment Instructions"

    BACKEND_IMAGE="$DOCKER_REGISTRY/$DOCKER_USERNAME/s2rtool-backend:$VERSION"
    FRONTEND_IMAGE="$DOCKER_REGISTRY/$DOCKER_USERNAME/s2rtool-frontend:$VERSION"

    echo ""
    print_success "Images built successfully!"
    echo ""
    print_info "To deploy on target machines:"
    echo ""
    echo "1. Update docker-compose.production.yaml with these image names:"
    echo "   backend:  $BACKEND_IMAGE"
    echo "   frontend: $FRONTEND_IMAGE"
    echo ""
    echo "2. Or set environment variables:"
    echo "   export DOCKER_REGISTRY=$DOCKER_REGISTRY"
    echo "   export DOCKER_USERNAME=$DOCKER_USERNAME"
    echo "   export VERSION=$VERSION"
    echo ""
    echo "3. Run deployment script on target machine:"
    echo "   ./deploy.sh"
    echo ""

    if [ "$PUSH_IMAGES" = true ]; then
        print_info "Images are available at:"
        echo "  $BACKEND_IMAGE"
        echo "  $FRONTEND_IMAGE"
    else
        print_warning "Images were built but not pushed to registry"
        print_info "To push manually:"
        echo "  docker push $BACKEND_IMAGE"
        echo "  docker push $FRONTEND_IMAGE"
    fi
}

# ========================================
# Main Execution
# ========================================

main() {
    print_header "S2RTool Build and Push Script v1.0"

    parse_args "$@"
    load_config
    validate_config
    build_images
    push_images
    generate_instructions

    print_success "All done! 🎉"
}

# Run main function
main "$@"
