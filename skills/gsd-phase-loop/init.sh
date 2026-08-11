#!/bin/bash
# GSD Phase Loop - Project Init Helper
# Usage: bash init.sh [project_name]
#
# Creates the .planning/ directory structure and template files.
# Run this from the project root (where you want .planning/ created).

set -euo pipefail

PROJECT_NAME="${1:-$(basename "$(pwd)")}"
TIMESTAMP="$(date -u +%Y-%m-%dT%H:%M:%S.000Z)"
DATE="$(date +%Y-%m-%d)"

echo "Initializing GSD Phase Loop for: ${PROJECT_NAME}"

# Create directory structure
mkdir -p ".planning/phases"

# Create PROJECT.md from template
sed -e "s/<TIMESTAMP>/${TIMESTAMP}/g" \
    -e "s/<DATE>/${DATE}/g" \
    templates/project.md > .planning/PROJECT.md

# Create ROADMAP.md from template
sed -e "s/<TIMESTAMP>/${TIMESTAMP}/g" \
    -e "s/<DATE>/${DATE}/g" \
    templates/roadmap.md > .planning/ROADMAP.md

# Create REQUIREMENTS.md from template
sed -e "s/<TIMESTAMP>/${TIMESTAMP}/g" \
    -e "s/<DATE>/${DATE}/g" \
    templates/requirements.md > .planning/REQUIREMENTS.md

# Create STATE.md from template
sed -e "s/<TIMESTAMP>/${TIMESTAMP}/g" \
    -e "s/<DATE>/${DATE}/g" \
    templates/state.md > .planning/STATE.md

# Create config.json
cp templates/config.json .planning/config.json

echo ""
echo "✓ .planning/ directory created"
echo "✓ PROJECT.md, ROADMAP.md, REQUIREMENTS.md, STATE.md, config.json initialized"
echo ""
echo "Next steps:"
echo "  1. Edit .planning/PROJECT.md with your project details"
echo "  2. Edit .planning/REQUIREMENTS.md with numbered REQ-IDs"
echo "  3. Edit .planning/ROADMAP.md with milestones and phases"
echo "  4. Edit .planning/STATE.md to set the first phase as active"
echo "  5. Start the phase loop with: discuss-phase for Phase 1"
