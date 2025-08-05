# ========================================
# IMF Test Manager - Development Makefile
# ========================================

.PHONY: help install build test clean dev docker docs setup

# Default target
.DEFAULT_GOAL := help

# Variables
NODE_VERSION := 18
PROJECT_NAME := imf-test-manager
WORKSPACE_DIR := ./workspace

# Colors for output
GREEN := \033[0;32m
YELLOW := \033[1;33m
BLUE := \033[0;34m
NC := \033[0m # No Color

# ========================================
# Help
# ========================================

help: ## Show this help message
	@echo "$(BLUE)========================================$(NC)"
	@echo "$(BLUE)🚀 IMF Test Manager - Development Commands$(NC)"
	@echo "$(BLUE)========================================$(NC)"
	@echo ""
	@echo "$(YELLOW)Available commands:$(NC)"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo ""
	@echo "$(YELLOW)Examples:$(NC)"
	@echo "  make setup                    # Complete project setup"
	@echo "  make dev                      # Start development mode"
	@echo "  make test                     # Run all tests"
	@echo "  make docker-dev               # Start with Docker"

# ========================================
# Setup & Installation
# ========================================

setup: ## Complete project setup (install, build, test, workspace)
	@echo "$(BLUE)🚀 Setting up IMF Test Manager...$(NC)"
	@chmod +x scripts/setup.sh
	@./scripts/setup.sh $(WORKSPACE_DIR)
	@echo "$(GREEN)✅ Setup completed!$(NC)"

install: ## Install dependencies
	@echo "$(BLUE)📦 Installing dependencies...$(NC)"
	@npm ci
	@echo "$(GREEN)✅ Dependencies installed$(NC)"

install-dev: ## Install development dependencies
	@echo "$(BLUE)📦 Installing development dependencies...$(NC)"
	@npm ci --include=dev
	@echo "$(GREEN)✅ Development dependencies installed$(NC)"

# ========================================
# Development
# ========================================

build: ## Build the project
	@echo "$(BLUE)🔨 Building project...$(NC)"
	@npm run build
	@echo "$(GREEN)✅ Build completed$(NC)"

dev: install-dev ## Start development mode
	@echo "$(BLUE)🛠️  Starting development mode...$(NC)"
	@npm run dev

watch: ## Watch for changes and rebuild
	@echo "$(BLUE)👀 Watching for changes...$(NC)"
	@npm run build -- --watch

# ========================================
# Testing
# ========================================

test: ## Run all tests
	@echo "$(BLUE)🧪 Running tests...$(NC)"
	@npm test

test-watch: ## Run tests in watch mode
	@echo "$(BLUE)👀 Running tests in watch mode...$(NC)"
	@npm run test:watch

test-coverage: ## Run tests with coverage
	@echo "$(BLUE)📊 Running tests with coverage...$(NC)"
	@npm run test:coverage

test-integration: ## Run integration tests
	@echo "$(BLUE)🔗 Running integration tests...$(NC)"
	@npm run test:integration

# ========================================
# Code Quality
# ========================================

lint: ## Run linting
	@echo "$(BLUE)🔍 Running linter...$(NC)"
	@npm run lint

lint-fix: ## Fix linting issues
	@echo "$(BLUE)🔧 Fixing linting issues...$(NC)"
	@npm run lint -- --fix

type-check: ## Run TypeScript type checking
	@echo "$(BLUE)📝 Running type check...$(NC)"
	@npm run type-check

format: ## Format code
	@echo "$(BLUE)💅 Formatting code...$(NC)"
	@npx prettier --write "src/**/*.ts" "tests/**/*.ts"

# ========================================
# Docker Commands
# ========================================

docker-build: ## Build Docker image
	@echo "$(BLUE)🐳 Building Docker image...$(NC)"
	@docker build -t $(PROJECT_NAME) .

docker-dev: ## Start development environment with Docker
	@echo "$(BLUE)🐳 Starting development environment...$(NC)"
	@docker-compose --profile development up -d
	@echo "$(GREEN)✅ Development environment started$(NC)"
	@echo "$(YELLOW)Access the application at: http://localhost:3001$(NC)"

docker-test: ## Run tests in Docker
	@echo "$(BLUE)🐳 Running tests in Docker...$(NC)"
	@docker-compose --profile testing up --build --abort-on-container-exit

docker-prod: ## Start production environment
	@echo "$(BLUE)🐳 Starting production environment...$(NC)"
	@docker-compose up -d
	@echo "$(GREEN)✅ Production environment started$(NC)"
	@echo "$(YELLOW)Access the application at: http://localhost:3000$(NC)"

docker-stop: ## Stop all Docker services
	@echo "$(BLUE)🛑 Stopping Docker services...$(NC)"
	@docker-compose down
	@echo "$(GREEN)✅ Services stopped$(NC)"

docker-logs: ## Show Docker logs
	@docker-compose logs -f

docker-clean: ## Clean Docker resources
	@echo "$(BLUE)🧹 Cleaning Docker resources...$(NC)"
	@docker-compose down -v --remove-orphans
	@docker system prune -f
	@echo "$(GREEN)✅ Docker cleanup completed$(NC)"

# ========================================
# CLI Commands
# ========================================

cli-install: build ## Install CLI globally
	@echo "$(BLUE)🔗 Installing CLI globally...$(NC)"
	@npm link
	@echo "$(GREEN)✅ CLI installed as 'imf-test'$(NC)"

cli-test: ## Test CLI functionality
	@echo "$(BLUE)🧪 Testing CLI functionality...$(NC)"
	@imf-test --help
	@imf-test init test-workspace --force
	@cd test-workspace && imf-test status
	@rm -rf test-workspace
	@echo "$(GREEN)✅ CLI test completed$(NC)"

workspace: ## Create development workspace
	@echo "$(BLUE)📁 Creating development workspace...$(NC)"
	@mkdir -p $(WORKSPACE_DIR)
	@imf-test init $(WORKSPACE_DIR) --force 2>/dev/null || true
	@cp examples/*.json $(WORKSPACE_DIR)/profiles/ 2>/dev/null || true
	@echo "$(GREEN)✅ Workspace created at $(WORKSPACE_DIR)$(NC)"

# ========================================
# Documentation
# ========================================

docs: ## Generate documentation
	@echo "$(BLUE)📚 Generating documentation...$(NC)"
	@npx typedoc --out docs-dist src/index.ts
	@echo "$(GREEN)✅ Documentation generated in docs-dist/$(NC)"

docs-serve: docs ## Serve documentation locally
	@echo "$(BLUE)🌐 Serving documentation at http://localhost:8080$(NC)"
	@npx http-server docs-dist -p 8080

# ========================================
# Release
# ========================================

version-patch: ## Bump patch version
	@echo "$(BLUE)📦 Bumping patch version...$(NC)"
	@npm version patch
	@echo "$(GREEN)✅ Version bumped$(NC)"

version-minor: ## Bump minor version
	@echo "$(BLUE)📦 Bumping minor version...$(NC)"
	@npm version minor
	@echo "$(GREEN)✅ Version bumped$(NC)"

version-major: ## Bump major version
	@echo "$(BLUE)📦 Bumping major version...$(NC)"
	@npm version major
	@echo "$(GREEN)✅ Version bumped$(NC)"

publish: test build ## Publish to npm
	@echo "$(BLUE)📤 Publishing to npm...$(NC)"
	@npm publish
	@echo "$(GREEN)✅ Published to npm$(NC)"

# ========================================
# Utilities
# ========================================

clean: ## Clean build artifacts and dependencies
	@echo "$(BLUE)🧹 Cleaning project...$(NC)"
	@rm -rf dist/ coverage/ node_modules/ .tmp/ tmp/
	@rm -rf test-* workspace/
	@echo "$(GREEN)✅ Project cleaned$(NC)"

reset: clean install build ## Reset project (clean + install + build)
	@echo "$(GREEN)✅ Project reset completed$(NC)"

status: ## Show project status
	@echo "$(BLUE)📊 Project Status$(NC)"
	@echo "$(BLUE)=================$(NC)"
	@echo ""
	@echo "$(YELLOW)Node.js version:$(NC) $$(node --version)"
	@echo "$(YELLOW)npm version:$(NC) $$(npm --version)"
	@echo "$(YELLOW)Project version:$(NC) $$(node -p "require('./package.json').version")"
	@echo ""
	@echo "$(YELLOW)Dependencies:$(NC)"
	@[ -d node_modules ] && echo "  ✅ Installed" || echo "  ❌ Not installed"
	@echo ""
	@echo "$(YELLOW)Build:$(NC)"
	@[ -d dist ] && echo "  ✅ Built" || echo "  ❌ Not built"
	@echo ""
	@echo "$(YELLOW)CLI:$(NC)"
	@command -v imf-test >/dev/null 2>&1 && echo "  ✅ Available (version: $$(imf-test --version 2>/dev/null || echo 'unknown'))" || echo "  ❌ Not installed"
	@echo ""
	@echo "$(YELLOW)Workspace:$(NC)"
	@[ -d $(WORKSPACE_DIR) ] && echo "  ✅ $(WORKSPACE_DIR) exists" || echo "  ❌ No workspace"

env: ## Show environment info
	@echo "$(BLUE)🌍 Environment Information$(NC)"
	@echo "$(BLUE)==========================$(NC)"
	@echo ""
	@echo "$(YELLOW)System:$(NC)"
	@echo "  OS: $$(uname -s)"
	@echo "  Architecture: $$(uname -m)"
	@echo "  Shell: $$SHELL"
	@echo ""
	@echo "$(YELLOW)Node.js:$(NC)"
	@echo "  Version: $$(node --version)"
	@echo "  Path: $$(which node)"
	@echo ""
	@echo "$(YELLOW)npm:$(NC)"
	@echo "  Version: $$(npm --version)"
	@echo "  Registry: $$(npm config get registry)"
	@echo ""
	@echo "$(YELLOW)Docker:$(NC)"
	@command -v docker >/dev/null 2>&1 && echo "  Version: $$(docker --version)" || echo "  ❌ Not installed"
	@command -v docker-compose >/dev/null 2>&1 && echo "  Compose: $$(docker-compose --version)" || echo "  ❌ Compose not installed"

# ========================================
# Example Commands
# ========================================

example-profile: cli-install workspace ## Create example test profile
	@echo "$(BLUE)📋 Creating example test profile...$(NC)"
	@cd $(WORKSPACE_DIR) && imf-test create-profile \
		--name "Example Performance Test" \
		--source-dir "." \
		--complexity medium
	@echo "$(GREEN)✅ Example profile created$(NC)"

example-generate: ## Generate test data from example profile
	@echo "$(BLUE)🔬 Generating example test data...$(NC)"
	@cd $(WORKSPACE_DIR) && \
		PROFILE_ID=$$(imf-test list-profiles --format json | jq -r '.[0].id') && \
		imf-test generate $$PROFILE_ID --output ./example-output --dry-run
	@echo "$(GREEN)✅ Example data generation completed$(NC)"

example-full: example-profile example-generate ## Run full example workflow
	@echo "$(GREEN)✅ Full example workflow completed$(NC)"

# ========================================
# CI/CD Support
# ========================================

ci-install: ## Install for CI environment
	@npm ci --include=dev

ci-test: ## Run tests for CI
	@npm run lint
	@npm run type-check
	@npm test -- --coverage --coverageReporters=lcov
	@npm run build

ci-docker: ## Build and test Docker image for CI
	@docker build -t $(PROJECT_NAME):ci .
	@docker run --rm $(PROJECT_NAME):ci node dist/cli.js --help

# ========================================
# Performance Testing
# ========================================

perf-test: cli-install ## Run performance tests
	@echo "$(BLUE)⚡ Running performance tests...$(NC)"
	@mkdir -p perf-results
	@echo "Testing profile creation..."
	@time imf-test create-profile --name "Perf Test" --source-dir "." --complexity medium > perf-results/profile-creation.log 2>&1
	@echo "Testing data generation..."
	@time imf-test generate $$(imf-test list-profiles --format json | jq -r '.[0].id') --dry-run > perf-results/data-generation.log 2>&1
	@echo "$(GREEN)✅ Performance tests completed - results in perf-results/$(NC)"

# ========================================
# Development Shortcuts
# ========================================

quick-start: install build cli-install workspace ## Quick start for new developers
	@echo "$(GREEN)🎉 Quick start completed!$(NC)"
	@echo ""
	@echo "$(YELLOW)Next steps:$(NC)"
	@echo "  1. cd $(WORKSPACE_DIR)"
	@echo "  2. imf-test create-profile --interactive"
	@echo "  3. imf-test generate <profile-id>"

full-setup: setup test docker-build docs ## Complete setup with all components
	@echo "$(GREEN)🎉 Full setup completed!$(NC)"

dev-reset: clean install-dev build cli-install workspace ## Reset for development
	@echo "$(GREEN)🔄 Development environment reset completed!$(NC)"