#!/bin/bash

# Bilten Platform Monitoring Health Check Script

echo "🏥 Checking Bilten Platform Monitoring Health..."
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check service health
check_service() {
    local service_name=$1
    local url=$2
    local expected_status=${3:-200}
    
    echo -n "Checking $service_name... "
    
    if response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null); then
        if [ "$response" -eq "$expected_status" ]; then
            echo -e "${GREEN}✅ Healthy (HTTP $response)${NC}"
            return 0
        else
            echo -e "${YELLOW}⚠️  Unexpected status (HTTP $response)${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ Unreachable${NC}"
        return 1
    fi
}

# Function to check if port is open
check_port() {
    local service_name=$1
    local port=$2
    
    echo -n "Checking $service_name port $port... "
    
    if nc -z localhost "$port" 2>/dev/null; then
        echo -e "${GREEN}✅ Open${NC}"
        return 0
    else
        echo -e "${RED}❌ Closed${NC}"
        return 1
    fi
}

# Check core monitoring services
echo "Core Monitoring Services:"
echo "------------------------"
check_service "Prometheus" "http://localhost:9090/-/healthy"
check_service "Grafana" "http://localhost:3003/api/health"
check_service "Alertmanager" "http://localhost:9093/-/healthy"

echo ""
echo "Exporters:"
echo "----------"
check_port "Node Exporter" 9100
check_port "cAdvisor" 8080
check_port "PostgreSQL Exporter" 9187
check_port "Redis Exporter" 9121
check_port "Elasticsearch Exporter" 9114
check_port "ClickHouse Exporter" 9116

echo ""
echo "Log Management:"
echo "---------------"
check_port "Logstash" 5044
check_port "Filebeat" 5066

echo ""
echo "Data Sources:"
echo "-------------"
check_service "Elasticsearch" "http://localhost:9200/_cluster/health"

# Check Prometheus targets
echo ""
echo "Prometheus Targets:"
echo "-------------------"
if targets=$(curl -s "http://localhost:9090/api/v1/targets" 2>/dev/null); then
    if echo "$targets" | jq -e '.data.activeTargets' > /dev/null 2>&1; then
        active_targets=$(echo "$targets" | jq '.data.activeTargets | length')
        up_targets=$(echo "$targets" | jq '[.data.activeTargets[] | select(.health == "up")] | length')
        echo -e "Active targets: $active_targets, Up: ${GREEN}$up_targets${NC}"
        
        # Show any down targets
        down_targets=$(echo "$targets" | jq -r '.data.activeTargets[] | select(.health != "up") | .discoveredLabels.job + " (" + .health + ")"' 2>/dev/null)
        if [ -n "$down_targets" ]; then
            echo -e "${RED}Down targets:${NC}"
            echo "$down_targets" | sed 's/^/  /'
        fi
    else
        echo -e "${YELLOW}⚠️  Could not parse targets response${NC}"
    fi
else
    echo -e "${RED}❌ Could not fetch targets${NC}"
fi

# Check Grafana datasources
echo ""
echo "Grafana Datasources:"
echo "--------------------"
if datasources=$(curl -s -u admin:bilten_admin_password "http://localhost:3003/api/datasources" 2>/dev/null); then
    if echo "$datasources" | jq -e '.' > /dev/null 2>&1; then
        ds_count=$(echo "$datasources" | jq 'length')
        echo "Configured datasources: $ds_count"
        echo "$datasources" | jq -r '.[] | "  - " + .name + " (" + .type + ")"' 2>/dev/null
    else
        echo -e "${YELLOW}⚠️  Could not parse datasources response${NC}"
    fi
else
    echo -e "${RED}❌ Could not fetch datasources${NC}"
fi

echo ""
echo "================================================"
echo "Health check complete!"
echo ""
echo "📊 Quick Access URLs:"
echo "  - Grafana: http://localhost:3003"
echo "  - Prometheus: http://localhost:9090"
echo "  - Alertmanager: http://localhost:9093"