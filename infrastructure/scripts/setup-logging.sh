#!/bin/bash

# Bilten Platform - Centralized Logging Setup Script
# This script sets up the centralized logging infrastructure

set -e

echo "🚀 Setting up Bilten Platform Centralized Logging..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
check_docker() {
    print_status "Checking Docker installation..."
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    
    print_success "Docker is running"
}

# Check if Docker Compose is available
check_docker_compose() {
    print_status "Checking Docker Compose installation..."
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_success "Docker Compose is available"
}

# Create necessary directories
create_directories() {
    print_status "Creating log directories..."
    
    # Create log directories for each service
    mkdir -p logs
    mkdir -p apps/bilten-backend/logs
mkdir -p apps/bilten-gateway/logs
mkdir -p apps/bilten-frontend/logs
mkdir -p apps/bilten-scanner/logs
    
    # Create monitoring directories if they don't exist
    mkdir -p infrastructure/monitoring/logstash/pipeline
mkdir -p infrastructure/monitoring/logstash/config
mkdir -p infrastructure/monitoring/logstash/templates
mkdir -p infrastructure/monitoring/filebeat
    
    print_success "Log directories created"
}

# Set up environment files
setup_environment() {
    print_status "Setting up environment configuration..."
    
    # Copy environment templates if they don't exist
    services=("apps/bilten-backend" "apps/bilten-gateway" "apps/bilten-frontend" "apps/bilten-scanner")
    
    for service in "${services[@]}"; do
        if [ -d "$service" ]; then
            env_file="$service/.env.logging"
            if [ ! -f "$env_file" ]; then
                cp infrastructure/monitoring/logging/.env.example "$env_file"
                print_status "Created $env_file"
            else
                print_warning "$env_file already exists, skipping"
            fi
        else
            print_warning "Service directory $service not found, skipping"
        fi
    done
    
    print_success "Environment configuration completed"
}

# Install logging dependencies
install_dependencies() {
    print_status "Installing logging dependencies..."
    
    # Backend dependencies
    if [ -d "apps/bilten-backend" ]; then
    print_status "Installing backend logging dependencies..."
    cd apps/bilten-backend
        if [ -f "package.json" ]; then
            npm install winston express-validator --save
            print_success "Backend dependencies installed"
        else
            print_warning "Backend package.json not found"
        fi
        cd ..
    fi
    
    # Gateway dependencies (should already have winston)
    if [ -d "apps/bilten-gateway" ]; then
    print_status "Checking gateway logging dependencies..."
    cd apps/bilten-gateway
        if [ -f "package.json" ]; then
            # Check if winston is already installed
            if npm list winston &> /dev/null; then
                print_success "Gateway dependencies already installed"
            else
                npm install winston --save
                print_success "Gateway dependencies installed"
            fi
        else
            print_warning "Gateway package.json not found"
        fi
        cd ..
    fi
    
    print_success "Dependencies installation completed"
}

# Start monitoring infrastructure
start_monitoring() {
    print_status "Starting monitoring infrastructure..."
    
    # Check if monitoring compose file exists
    if [ ! -f "docker-compose.monitoring.yml" ]; then
        print_error "docker-compose.monitoring.yml not found"
        exit 1
    fi
    
    # Start monitoring services
    docker-compose -f docker-compose.monitoring.yml up -d elasticsearch
    print_status "Elasticsearch starting..."
    
    # Wait for Elasticsearch to be ready
    print_status "Waiting for Elasticsearch to be ready..."
    timeout=60
    counter=0
    while [ $counter -lt $timeout ]; do
        if curl -s http://localhost:9200/_cluster/health &> /dev/null; then
            break
        fi
        sleep 2
        counter=$((counter + 2))
        echo -n "."
    done
    echo ""
    
    if [ $counter -ge $timeout ]; then
        print_error "Elasticsearch failed to start within $timeout seconds"
        exit 1
    fi
    
    print_success "Elasticsearch is ready"
    
    # Start Logstash
    docker-compose -f docker-compose.monitoring.yml up -d logstash
    print_status "Logstash starting..."
    
    # Wait for Logstash to be ready
    print_status "Waiting for Logstash to be ready..."
    counter=0
    while [ $counter -lt $timeout ]; do
        if curl -s http://localhost:9600 &> /dev/null; then
            break
        fi
        sleep 2
        counter=$((counter + 2))
        echo -n "."
    done
    echo ""
    
    if [ $counter -ge $timeout ]; then
        print_error "Logstash failed to start within $timeout seconds"
        exit 1
    fi
    
    print_success "Logstash is ready"
    
    # Start remaining monitoring services
    docker-compose -f docker-compose.monitoring.yml up -d
    
    print_success "Monitoring infrastructure started"
}

# Verify setup
verify_setup() {
    print_status "Verifying logging setup..."
    
    # Check Elasticsearch
    if curl -s http://localhost:9200/_cluster/health | grep -q "green\|yellow"; then
        print_success "Elasticsearch is healthy"
    else
        print_error "Elasticsearch health check failed"
        return 1
    fi
    
    # Check Logstash
    if curl -s http://localhost:9600 &> /dev/null; then
        print_success "Logstash is responding"
    else
        print_error "Logstash health check failed"
        return 1
    fi
    
    # Check Grafana
    if curl -s http://localhost:3003 &> /dev/null; then
        print_success "Grafana is responding"
    else
        print_warning "Grafana may still be starting up"
    fi
    
    print_success "Setup verification completed"
}

# Create test log entry
test_logging() {
    print_status "Testing log ingestion..."
    
    # Wait a moment for services to be fully ready
    sleep 5
    
    # Create a test log entry
    test_log='{
        "logs": [{
            "@timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'",
            "level": "INFO",
            "service": "setup-script",
            "component": "test",
            "message": "Centralized logging setup completed successfully",
            "environment": "development",
            "version": "1.0.0",
            "hostname": "'$(hostname)'",
            "setupTest": true
        }]
    }'
    
    # Try to send test log via HTTP (if backend is running)
    if curl -s http://localhost:3001/health &> /dev/null; then
        if curl -s -X POST http://localhost:3001/api/v1/logs \
           -H "Content-Type: application/json" \
           -d "$test_log" | grep -q "success"; then
            print_success "Log ingestion via backend API working"
        else
            print_warning "Backend API log ingestion test failed"
        fi
    else
        print_warning "Backend not running, skipping API test"
    fi
    
    # Try to send test log directly to Logstash HTTP endpoint
    if curl -s -X POST http://localhost:8080 \
       -H "Content-Type: application/json" \
       -d "${test_log}" &> /dev/null; then
        print_success "Direct Logstash ingestion working"
    else
        print_warning "Direct Logstash ingestion test failed"
    fi
    
    print_success "Logging test completed"
}

# Display access information
show_access_info() {
    echo ""
    echo "🎉 Centralized Logging Setup Complete!"
    echo ""
    echo "Access URLs:"
    echo "  📊 Grafana:      http://localhost:3003 (admin/bilten_admin_password)"
    echo "  🔍 Elasticsearch: http://localhost:9200"
    echo "  ⚙️  Logstash:     http://localhost:9600"
    echo "  📈 Prometheus:   http://localhost:9090"
    echo ""
    echo "Log Ingestion Endpoints:"
    echo "  🌐 HTTP API:     http://localhost:3001/api/v1/logs"
    echo "  🔌 TCP JSON:     localhost:5000"
    echo "  📡 HTTP Direct:  http://localhost:8080"
    echo "  📄 Filebeat:     localhost:5044"
    echo ""
    echo "Next Steps:"
    echo "  1. Start your application services"
    echo "  2. Check logs in Grafana dashboards"
    echo "  3. Configure log levels in service .env files"
    echo "  4. Set up alerting rules as needed"
    echo ""
    echo "Documentation:"
    echo "  📚 Logging Guide: infrastructure/monitoring/logging/README.md"
echo "  🔧 Monitoring:    infrastructure/monitoring/README.md"
    echo ""
}

# Main execution
main() {
    echo "🔧 Bilten Platform - Centralized Logging Setup"
    echo "=============================================="
    echo ""
    
    check_docker
    check_docker_compose
    create_directories
    setup_environment
    install_dependencies
    start_monitoring
    verify_setup
    test_logging
    show_access_info
    
    print_success "Centralized logging setup completed successfully! 🎉"
}

# Run main function
main "$@"