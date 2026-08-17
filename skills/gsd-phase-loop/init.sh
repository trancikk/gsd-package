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

# Resolve template directory relative to this script so it works regardless of cwd
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TEMPLATES_DIR="${SCRIPT_DIR}/templates"

echo "Initializing GSD Phase Loop for: ${PROJECT_NAME}"

# Create directory structure
mkdir -p ".planning/phases"

# Create PROJECT.md from template
sed -e "s/<TIMESTAMP>/${TIMESTAMP}/g" \
    -e "s/<DATE>/${DATE}/g" \
    "${TEMPLATES_DIR}/project.md" >.planning/PROJECT.md

# Create ROADMAP.md from template
sed -e "s/<TIMESTAMP>/${TIMESTAMP}/g" \
    -e "s/<DATE>/${DATE}/g" \
    "${TEMPLATES_DIR}/roadmap.md" >.planning/ROADMAP.md

# Create REQUIREMENTS.md from template
sed -e "s/<TIMESTAMP>/${TIMESTAMP}/g" \
    -e "s/<DATE>/${DATE}/g" \
    "${TEMPLATES_DIR}/requirements.md" >.planning/REQUIREMENTS.md

# Create STATE.md from template
sed -e "s/<TIMESTAMP>/${TIMESTAMP}/g" \
    -e "s/<DATE>/${DATE}/g" \
    "${TEMPLATES_DIR}/state.md" >.planning/STATE.md

# Create CONVENTIONS.md from template
sed -e "s/<TIMESTAMP>/${TIMESTAMP}/g" \
    -e "s/<DATE>/${DATE}/g" \
    "${TEMPLATES_DIR}/conventions.md" >.planning/CONVENTIONS.md

# Create BACKLOG.md from template
cp "${TEMPLATES_DIR}/backlog.md" .planning/BACKLOG.md

# Create WORKSTREAMS.md from template
cp "${TEMPLATES_DIR}/workstreams.md" .planning/WORKSTREAMS.md

# Create config.json
cp "${TEMPLATES_DIR}/config.json" .planning/config.json

echo ""
echo "✓ .planning/ directory created"
echo "✓ PROJECT.md, ROADMAP.md, REQUIREMENTS.md, STATE.md, CONVENTIONS.md, BACKLOG.md, WORKSTREAMS.md, config.json initialized"
echo ""
echo "Next steps:"
echo "  1. Edit .planning/PROJECT.md with your project details"
echo "  2. Edit .planning/REQUIREMENTS.md with numbered REQ-IDs"
echo "  3. Edit .planning/ROADMAP.md with milestones and phases"
echo "  4. Review and customize .planning/CONVENTIONS.md for this team"
echo "  5. Edit .planning/STATE.md to set the first phase as active"
echo "  6. Use .planning/BACKLOG.md to capture deferred ideas and todo items"
echo "  7. Use .planning/WORKSTREAMS.md to manage parallel feature branches"
echo "  8. Start the phase loop with: discuss-phase for Phase 1"
