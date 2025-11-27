#!/bin/bash

# ========================================
# S2RTool Deployment Script
# ========================================
# This script automates the deployment of S2RTool on target machines
#
# Usage:
#   ./deploy.sh
#
# Prerequisites:
#   - Docker Engine 20.10+
#   - Docker Compose 2.0+
# ========================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# ========================================
# Check Prerequisites
# ========================================

check_prerequisites() {
    print_header "Checking Prerequisites"

    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed!"
        echo "Please install Docker: https://docs.docker.com/get-docker/"
        exit 1
    fi
    print_success "Docker is installed ($(docker --version))"

    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not installed!"
        echo "Please install Docker Compose: https://docs.docker.com/compose/install/"
        exit 1
    fi

    if command -v docker-compose &> /dev/null; then
        COMPOSE_CMD="docker-compose"
        print_success "Docker Compose is installed ($(docker-compose --version))"
    else
        COMPOSE_CMD="docker compose"
        print_success "Docker Compose is installed ($(docker compose version))"
    fi

    # Check if Docker daemon is running
    if ! docker info &> /dev/null; then
        print_error "Docker daemon is not running!"
        echo "Please start Docker and try again."
        exit 1
    fi
    print_success "Docker daemon is running"
}

# ========================================
# Setup Environment File
# ========================================

setup_env_file() {
    print_header "Setting Up Environment Configuration"

    if [ -f ".env" ]; then
        print_warning ".env file already exists"
        read -p "Do you want to reconfigure? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_info "Keeping existing .env file"
            return
        fi
    fi

    if [ ! -f ".env.production.template" ]; then
        print_error ".env.production.template not found!"
        exit 1
    fi

    cp .env.production.template .env
    print_success "Created .env file from template"

    # Prompt for Gemini API key
    echo ""
    print_info "You need a Gemini API key to run S2RTool"
    print_info "Get it here: https://makersuite.google.com/app/apikey"
    echo ""
    read -p "Enter your Gemini API Key: " api_key

    if [ -z "$api_key" ]; then
        print_warning "No API key provided. You'll need to edit .env manually."
    else
        # Update .env file with API key
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s/your_gemini_api_key_here/$api_key/" .env
        else
            # Linux
            sed -i "s/your_gemini_api_key_here/$api_key/" .env
        fi
        print_success "API key configured"
    fi

    # Optional: Configure ports
    echo ""
    read -p "Frontend port (default: 3001): " frontend_port
    read -p "Backend port (default: 5001): " backend_port

    if [ ! -z "$frontend_port" ]; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s/FRONTEND_PORT=3001/FRONTEND_PORT=$frontend_port/" .env
        else
            sed -i "s/FRONTEND_PORT=3001/FRONTEND_PORT=$frontend_port/" .env
        fi
        print_success "Frontend port set to $frontend_port"
    fi

    if [ ! -z "$backend_port" ]; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s/BACKEND_PORT=5001/BACKEND_PORT=$backend_port/" .env
        else
            sed -i "s/BACKEND_PORT=5001/BACKEND_PORT=$backend_port/" .env
        fi
        print_success "Backend port set to $backend_port"
    fi
}

# ========================================
# Deploy Application
# ========================================

deploy_application() {
    print_header "Deploying S2RTool"

    # Pull or build images
    print_info "Pulling/building Docker images..."
    $COMPOSE_CMD -f docker-compose.production.yaml pull || true
    $COMPOSE_CMD -f docker-compose.production.yaml build

    # Start services
    print_info "Starting services..."
    $COMPOSE_CMD -f docker-compose.production.yaml up -d

    print_success "Services started successfully"
}

# ========================================
# Verify Deployment
# ========================================

verify_deployment() {
    print_header "Verifying Deployment"

    # Load environment variables
    source .env

    FRONTEND_PORT=${FRONTEND_PORT:-3001}
    BACKEND_PORT=${BACKEND_PORT:-5001}

    echo "Waiting for services to be healthy..."
    sleep 10

    # Check backend health
    if curl -f -s "http://localhost:$BACKEND_PORT/health" > /dev/null 2>&1; then
        print_success "Backend is healthy (http://localhost:$BACKEND_PORT)"
    else
        print_warning "Backend health check failed (might still be starting...)"
    fi

    # Check frontend
    if curl -f -s "http://localhost:$FRONTEND_PORT" > /dev/null 2>&1; then
        print_success "Frontend is accessible (http://localhost:$FRONTEND_PORT)"
    else
        print_warning "Frontend check failed (might still be starting...)"
    fi

    echo ""
    print_info "Check container status:"
    $COMPOSE_CMD -f docker-compose.production.yaml ps
}

# ========================================
# Display Access Information
# ========================================

show_access_info() {
    print_header "Deployment Complete!"

    # Load environment variables
    source .env
    FRONTEND_PORT=${FRONTEND_PORT:-3001}
    BACKEND_PORT=${BACKEND_PORT:-5001}

    echo ""
    print_success "S2RTool has been deployed successfully!"
    echo ""
    echo "Access the application at:"
    echo -e "  ${GREEN}Frontend:${NC} http://localhost:$FRONTEND_PORT"
    echo -e "  ${GREEN}Backend:${NC}  http://localhost:$BACKEND_PORT"
    echo ""
    echo "Useful commands:"
    echo "  View logs:        $COMPOSE_CMD -f docker-compose.production.yaml logs -f"
    echo "  Stop services:    $COMPOSE_CMD -f docker-compose.production.yaml down"
    echo "  Restart services: $COMPOSE_CMD -f docker-compose.production.yaml restart"
    echo "  Update services:  $COMPOSE_CMD -f docker-compose.production.yaml pull && $COMPOSE_CMD -f docker-compose.production.yaml up -d"
    echo ""
}

# ========================================
# Main Execution
# ========================================

main() {
    print_header "S2RTool Deployment Script v1.0"

    check_prerequisites
    setup_env_file
    deploy_application
    verify_deployment
    show_access_info

    print_success "All done! 🎉"
}

# Run main function
main
