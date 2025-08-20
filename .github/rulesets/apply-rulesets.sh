#!/bin/bash

# 🛡️ Bilten GitHub Rulesets Application Script
# This script applies all rulesets to the Bilten repository

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO_OWNER="iDorgham"
REPO_NAME="Bilten"
RULESETS_DIR=".github/rulesets"

echo -e "${BLUE}🛡️  Applying GitHub Rulesets for Bilten${NC}"
echo "=================================================="

# Function to check if GitHub CLI is installed
check_gh_cli() {
    if ! command -v gh &> /dev/null; then
        echo -e "${RED}❌ GitHub CLI (gh) is not installed.${NC}"
        echo "Please install it from: https://cli.github.com/"
        exit 1
    fi
}

# Function to check authentication
check_auth() {
    if ! gh auth status &> /dev/null; then
        echo -e "${RED}❌ Not authenticated with GitHub CLI.${NC}"
        echo "Please run: gh auth login"
        exit 1
    fi
}

# Function to apply a ruleset
apply_ruleset() {
    local ruleset_file=$1
    local ruleset_name=$(basename "$ruleset_file" .json)
    
    echo -e "${YELLOW}📋 Applying $ruleset_name...${NC}"
    
    if [ ! -f "$ruleset_file" ]; then
        echo -e "${RED}❌ Ruleset file not found: $ruleset_file${NC}"
        return 1
    fi
    
    # Read the ruleset JSON
    local ruleset_content=$(cat "$ruleset_file")
    
    # Apply the ruleset using GitHub CLI
    local response=$(gh api repos/$REPO_OWNER/$REPO_NAME/rulesets \
        --method POST \
        --input "$ruleset_file" \
        --silent 2>&1 || true)
    
    if echo "$response" | grep -q "already exists"; then
        echo -e "${YELLOW}⚠️  Ruleset already exists, updating...${NC}"
        
        # Get the ruleset ID
        local ruleset_id=$(gh api repos/$REPO_OWNER/$REPO_NAME/rulesets \
            --jq ".[] | select(.name == \"$(echo "$ruleset_content" | jq -r '.name')\") | .id" \
            --silent)
        
        if [ -n "$ruleset_id" ]; then
            # Update existing ruleset
            gh api repos/$REPO_OWNER/$REPO_NAME/rulesets/$ruleset_id \
                --method PUT \
                --input "$ruleset_file" \
                --silent
            echo -e "${GREEN}✅ Updated $ruleset_name${NC}"
        else
            echo -e "${RED}❌ Could not find ruleset ID for $ruleset_name${NC}"
            return 1
        fi
    elif echo "$response" | grep -q "error"; then
        echo -e "${RED}❌ Failed to apply $ruleset_name:${NC}"
        echo "$response"
        return 1
    else
        echo -e "${GREEN}✅ Applied $ruleset_name${NC}"
    fi
}

# Function to list existing rulesets
list_rulesets() {
    echo -e "${BLUE}📋 Existing Rulesets:${NC}"
    gh api repos/$REPO_OWNER/$REPO_NAME/rulesets \
        --jq '.[] | "  - \(.name) (ID: \(.id), Enforcement: \(.enforcement))"' \
        --silent || echo "  No rulesets found"
    echo ""
}

# Function to validate ruleset files
validate_rulesets() {
    echo -e "${BLUE}🔍 Validating ruleset files...${NC}"
    
    local valid=true
    
    for ruleset_file in "$RULESETS_DIR"/*.json; do
        if [ -f "$ruleset_file" ]; then
            if jq empty "$ruleset_file" 2>/dev/null; then
                echo -e "${GREEN}✅ Valid JSON: $(basename "$ruleset_file")${NC}"
            else
                echo -e "${RED}❌ Invalid JSON: $(basename "$ruleset_file")${NC}"
                valid=false
            fi
        fi
    done
    
    if [ "$valid" = false ]; then
        echo -e "${RED}❌ Some ruleset files have invalid JSON${NC}"
        exit 1
    fi
}

# Function to show ruleset summary
show_summary() {
    echo -e "${BLUE}📊 Ruleset Summary:${NC}"
    echo "  - Security Ruleset: Enforces security policies"
    echo "  - Quality Ruleset: Ensures code quality"
    echo "  - Production Ruleset: Strict production controls"
    echo "  - Development Ruleset: Streamlined development workflow"
    echo ""
}

# Main execution
main() {
    # Check prerequisites
    check_gh_cli
    check_auth
    
    echo -e "${GREEN}✅ GitHub CLI is installed and authenticated${NC}"
    echo ""
    
    # Show summary
    show_summary
    
    # Validate ruleset files
    validate_rulesets
    echo ""
    
    # List existing rulesets
    list_rulesets
    
    # Apply each ruleset
    echo -e "${BLUE}🚀 Applying rulesets...${NC}"
    echo ""
    
    local success_count=0
    local total_count=0
    
    for ruleset_file in "$RULESETS_DIR"/*.json; do
        if [ -f "$ruleset_file" ] && [ "$(basename "$ruleset_file")" != "README.md" ]; then
            total_count=$((total_count + 1))
            if apply_ruleset "$ruleset_file"; then
                success_count=$((success_count + 1))
            fi
            echo ""
        fi
    done
    
    # Final summary
    echo "=================================================="
    if [ $success_count -eq $total_count ]; then
        echo -e "${GREEN}🎉 Successfully applied $success_count/$total_count rulesets${NC}"
    else
        echo -e "${YELLOW}⚠️  Applied $success_count/$total_count rulesets (some failed)${NC}"
    fi
    
    echo ""
    echo -e "${BLUE}📋 Next steps:${NC}"
    echo "  1. Review the applied rulesets in GitHub"
    echo "  2. Configure branch protection rules"
    echo "  3. Set up required workflows"
    echo "  4. Test the rulesets with a sample PR"
    echo ""
    echo -e "${BLUE}📚 Documentation:${NC}"
    echo "  - Ruleset docs: .github/rulesets/README.md"
    echo "  - GitHub docs: https://docs.github.com/en/rest/repos/rules"
}

# Run main function
main "$@"

