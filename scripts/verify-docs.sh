#!/bin/bash

# Documentation Verification Script
# Checks if all documentation files exist and are valid

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║     Documentation Verification Script                    ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

ERRORS=0
WARNINGS=0

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1"
    else
        echo -e "${RED}✗${NC} $1 (MISSING)"
        ((ERRORS++))
    fi
}

# Function to check if directory exists
check_dir() {
    if [ -d "$1" ]; then
        local count=$(find "$1" -name "*.md" | wc -l)
        echo -e "${GREEN}✓${NC} $1 ($count files)"
    else
        echo -e "${RED}✗${NC} $1 (MISSING)"
        ((ERRORS++))
    fi
}

echo "📁 Checking master documentation files..."
check_file "README.md"
check_file "DOCUMENTATION.md"
check_file "DOCUMENTATION_CHEATSHEET.md"
check_file "DOCUMENTATION_SETUP_COMPLETE.md"
check_file "typedoc.json"
check_file "package.json"
echo ""

echo "📁 Checking docs/ directory..."
check_file "docs/README.md"
check_file "docs/SCAN_FLOW.md"
check_file "docs/QUICK_START_DOCS.md"
check_file "docs/DOCUMENTATION_ROADMAP.md"
echo ""

echo "📁 Checking TypeDoc generated docs..."
check_dir "docs/api"
check_file "docs/api/README.md"
check_file "docs/api/modules.md"
check_file "docs/api/hierarchy.md"
echo ""

echo "📁 Checking API documentation..."
check_dir "docs/api/app/api"
check_dir "docs/api/worker"
check_dir "docs/api/lib"
echo ""

echo "📁 Checking analyzer documentation..."
check_dir "docs/api/worker/analyzers"
echo ""

echo "📁 Checking NPM scripts in package.json..."
if grep -q '"docs":' package.json; then
    echo -e "${GREEN}✓${NC} npm run docs script found"
else
    echo -e "${RED}✗${NC} npm run docs script missing"
    ((ERRORS++))
fi

if grep -q '"docs:watch":' package.json; then
    echo -e "${GREEN}✓${NC} npm run docs:watch script found"
else
    echo -e "${YELLOW}⚠${NC} npm run docs:watch script missing (optional)"
    ((WARNINGS++))
fi

if grep -q '"docs:serve":' package.json; then
    echo -e "${GREEN}✓${NC} npm run docs:serve script found"
else
    echo -e "${YELLOW}⚠${NC} npm run docs:serve script missing (optional)"
    ((WARNINGS++))
fi
echo ""

echo "📦 Checking TypeDoc installation..."
if [ -d "node_modules/typedoc" ]; then
    echo -e "${GREEN}✓${NC} typedoc installed"
else
    echo -e "${RED}✗${NC} typedoc not installed"
    ((ERRORS++))
fi

if [ -d "node_modules/typedoc-plugin-markdown" ]; then
    echo -e "${GREEN}✓${NC} typedoc-plugin-markdown installed"
else
    echo -e "${RED}✗${NC} typedoc-plugin-markdown not installed"
    ((ERRORS++))
fi
echo ""

echo "📊 Counting documentation files..."
MANUAL_DOCS=$(find . -maxdepth 1 -name "*.md" | wc -l | tr -d ' ')
DOCS_DIR=$(find docs -name "*.md" -not -path "docs/api/*" | wc -l | tr -d ' ')
TYPEDOC=$(find docs/api -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
TOTAL=$((MANUAL_DOCS + DOCS_DIR + TYPEDOC))

echo "  • Root documentation files: $MANUAL_DOCS"
echo "  • docs/ manual files: $DOCS_DIR"
echo "  • TypeDoc generated files: $TYPEDOC"
echo "  • Total: $TOTAL files"
echo ""

echo "🔍 Checking documentation links..."
if grep -q "DOCUMENTATION.md" README.md; then
    echo -e "${GREEN}✓${NC} README.md links to DOCUMENTATION.md"
else
    echo -e "${YELLOW}⚠${NC} README.md doesn't link to DOCUMENTATION.md"
    ((WARNINGS++))
fi

if grep -q "QUICK_START_DOCS.md" docs/README.md; then
    echo -e "${GREEN}✓${NC} docs/README.md links to QUICK_START_DOCS.md"
else
    echo -e "${YELLOW}⚠${NC} docs/README.md doesn't link to QUICK_START_DOCS.md"
    ((WARNINGS++))
fi
echo ""

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                    VERIFICATION RESULTS                   ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed!${NC}"
    echo ""
    echo "Documentation is complete and ready to use."
    echo ""
    echo "Quick commands:"
    echo "  • Generate docs:  npm run docs"
    echo "  • Watch mode:     npm run docs:watch"
    echo "  • Serve locally:  npm run docs:serve"
    echo ""
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ $WARNINGS warning(s) found${NC}"
    echo ""
    echo "Documentation is functional but has some optional improvements."
    exit 0
else
    echo -e "${RED}❌ $ERRORS error(s) found${NC}"
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}⚠ $WARNINGS warning(s) found${NC}"
    fi
    echo ""
    echo "Please fix the errors above before proceeding."
    echo ""
    echo "Common fixes:"
    echo "  • Missing files: Create them or regenerate docs with 'npm run docs'"
    echo "  • Missing TypeDoc: Run 'npm install'"
    echo "  • Missing scripts: Check package.json"
    echo ""
    exit 1
fi
