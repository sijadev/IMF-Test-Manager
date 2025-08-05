#!/bin/bash

# ========================================
# IMF Test Manager Setup Script
# ========================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="IMF Test Manager"
NODE_VERSION="18"
WORKSPACE_DIR=${1:-"./imf-test-workspace"}

# Functions
print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}🚀 $PROJECT_NAME Setup${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_step() {
    echo -e "${CYAN}📋 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

check_prerequisites() {
    print_step "Checking prerequisites..."
    
    # Check Node.js version
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js $NODE_VERSION or later."
        echo "Visit: https://nodejs.org/"
        exit 1
    fi
    
    NODE_MAJOR=$(node -v | cut -d'.' -f1 | sed 's/v//')
    if [ "$NODE_MAJOR" -lt "$NODE_VERSION" ]; then
        print_error "Node.js version $NODE_VERSION or later is required. Current: $(node -v)"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not available. Please install npm."
        exit 1
    fi
    
    # Check git (optional)
    if ! command -v git &> /dev/null; then
        print_warning "Git is not installed. Version control features will be limited."
    fi
    
    print_success "Prerequisites check completed"
}

install_dependencies() {
    print_step "Installing dependencies..."
    
    # Install production dependencies
    npm ci --omit=dev
    
    print_success "Dependencies installed"
}

install_dev_dependencies() {
    print_step "Installing development dependencies..."
    
    # Install all dependencies including dev
    npm ci
    
    print_success "Development dependencies installed"
}

build_project() {
    print_step "Building project..."
    
    # Clean previous build
    npm run clean 2>/dev/null || true
    
    # Build TypeScript
    npm run build
    
    print_success "Project built successfully"
}

run_tests() {
    print_step "Running tests..."
    
    # Run test suite
    npm test
    
    print_success "All tests passed"
}

setup_workspace() {
    print_step "Setting up workspace in $WORKSPACE_DIR..."
    
    # Create workspace directory
    mkdir -p "$WORKSPACE_DIR"
    cd "$WORKSPACE_DIR"
    
    # Initialize workspace
    if command -v imf-test &> /dev/null; then
        imf-test init . --force
    else
        # Manual workspace setup
        mkdir -p profiles output results logs
        
        # Create config file
        cat > test-manager.config.json << EOF
{
  "version": "1.0.0",
  "workspace": {
    "name": "$(basename $(pwd))",
    "created": "$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")",
    "profilesDir": "./profiles",
    "outputDir": "./output",
    "resultsDir": "./results"
  },
  "defaults": {
    "complexity": "medium",
    "sampleCount": 1000,
    "timeout": 30000
  },
  "logging": {
    "level": "INFO",
    "enableFile": true,
    "logDir": "./logs"
  }
}
EOF
        
        # Create README
        cat > README.md << EOF
# IMF Test Manager Workspace

This workspace was created on $(date) for managing test profiles and data generation.

## Getting Started

1. Create a test profile:
   \`\`\`bash
   imf-test create-profile --interactive
   \`\`\`

2. Generate test data:
   \`\`\`bash
   imf-test generate <profile-id>
   \`\`\`

3. Execute against IMF:
   \`\`\`bash
   imf-test execute-test <profile-id> --endpoint http://localhost:3000
   \`\`\`

## Directory Structure

- \`profiles/\` - Test profile definitions
- \`output/\` - Generated test data
- \`results/\` - Test execution results
- \`logs/\` - Application logs
EOF
    fi
    
    cd - > /dev/null
    print_success "Workspace setup completed in $WORKSPACE_DIR"
}

copy_examples() {
    print_step "Copying example profiles..."
    
    if [ -d "examples" ] && [ -d "$WORKSPACE_DIR/profiles" ]; then
        cp examples/*.json "$WORKSPACE_DIR/profiles/" 2>/dev/null || true
        print_success "Example profiles copied to workspace"
    else
        print_warning "Example profiles not found or workspace not created"
    fi
}

install_globally() {
    print_step "Installing CLI globally..."
    
    # Link package globally
    npm link
    
    print_success "CLI installed globally as 'imf-test'"
}

verify_installation() {
    print_step "Verifying installation..."
    
    # Check if CLI is available
    if command -v imf-test &> /dev/null; then
        VERSION=$(imf-test --version 2>/dev/null || echo "unknown")
        print_success "CLI is available (version: $VERSION)"
        
        # Test basic functionality
        if imf-test status &> /dev/null; then
            print_success "CLI is functioning correctly"
        else
            print_warning "CLI installed but may not be functioning correctly"
        fi
    else
        print_warning "CLI not available in PATH. You may need to restart your terminal."
    fi
}

cleanup() {
    print_step "Cleaning up temporary files..."
    
    # Remove temporary files
    rm -rf tmp/ .tmp/ 2>/dev/null || true
    
    print_success "Cleanup completed"
}

print_final_message() {
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}🎉 Setup completed successfully!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "${CYAN}Next steps:${NC}"
    echo "1. Navigate to your workspace: cd $WORKSPACE_DIR"
    echo "2. Create your first test profile: imf-test create-profile --interactive"
    echo "3. Generate test data: imf-test generate <profile-id>"
    echo "4. View documentation: https://docs.imf-test-manager.com"
    echo ""
    echo -e "${CYAN}Useful commands:${NC}"
    echo "  imf-test --help                    Show help"
    echo "  imf-test list-profiles              List all profiles"
    echo "  imf-test status                     Show workspace status"
    echo "  imf-test test-connection <url>      Test IMF connection"
    echo ""
    if [ -d "$WORKSPACE_DIR/profiles" ] && [ "$(ls -A $WORKSPACE_DIR/profiles 2>/dev/null)" ]; then
        echo -e "${CYAN}Example profiles available in workspace:${NC}"
        ls -1 "$WORKSPACE_DIR/profiles"/*.json 2>/dev/null | xargs -I {} basename {} .json | sed 's/^/  /'
        echo ""
    fi
}

# Main execution
main() {
    print_header
    
    # Parse command line arguments
    DEVELOPMENT_MODE=false
    SKIP_TESTS=false
    SKIP_GLOBAL_INSTALL=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --dev|--development)
                DEVELOPMENT_MODE=true
                shift
                ;;
            --skip-tests)
                SKIP_TESTS=true
                shift
                ;;
            --skip-global)
                SKIP_GLOBAL_INSTALL=true
                shift
                ;;
            --workspace)
                WORKSPACE_DIR="$2"
                shift 2
                ;;
            -h|--help)
                echo "Usage: $0 [workspace-dir] [options]"
                echo ""
                echo "Options:"
                echo "  --dev, --development    Install development dependencies"
                echo "  --skip-tests           Skip running tests"
                echo "  --skip-global          Skip global CLI installation"
                echo "  --workspace <dir>      Specify workspace directory"
                echo "  -h, --help             Show this help"
                exit 0
                ;;
            *)
                WORKSPACE_DIR="$1"
                shift
                ;;
        esac
    done
    
    # Execute setup steps
    check_prerequisites
    
    if [ "$DEVELOPMENT_MODE" = true ]; then
        install_dev_dependencies
    else
        install_dependencies
    fi
    
    build_project
    
    if [ "$SKIP_TESTS" = false ]; then
        run_tests
    fi
    
    if [ "$SKIP_GLOBAL_INSTALL" = false ]; then
        install_globally
    fi
    
    setup_workspace
    copy_examples
    
    if [ "$SKIP_GLOBAL_INSTALL" = false ]; then
        verify_installation
    fi
    
    cleanup
    print_final_message
}

# Error handling
trap 'echo -e "${RED}❌ Setup failed. Check the error messages above.${NC}"; exit 1' ERR

# Run main function
main "$@"