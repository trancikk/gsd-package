#!/usr/bin/env bash
# gsd-resolve.sh — resolve the path to gsd-tools.cjs from the gsd-package
#
# Usage: source gsd-resolve.sh && node $GSD_TOOLS <command>
#
# Searches (in order):
#   1. GSD_CORE_PATH env var (explicit override)
#   2. Alongside this script (bundled in the package)
#   3. ~/.claude/gsd-core/ (classic GSD install)
#   4. The directory this script lives in (package-relative)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ -n "$GSD_CORE_PATH" ] && [ -f "$GSD_CORE_PATH/bin/gsd-tools.cjs" ]; then
  GSD_CORE="$GSD_CORE_PATH"
elif [ -f "$SCRIPT_DIR/../gsd-core/bin/gsd-tools.cjs" ]; then
  GSD_CORE="$(cd "$SCRIPT_DIR/.." && pwd)/gsd-core"
elif [ -f "$HOME/.claude/gsd-core/bin/gsd-tools.cjs" ]; then
  GSD_CORE="$HOME/.claude/gsd-core"
elif [ -f "$SCRIPT_DIR/gsd-core/bin/gsd-tools.cjs" ]; then
  GSD_CORE="$SCRIPT_DIR/gsd-core"
else
  echo "ERROR: gsd-tools.cjs not found. Set GSD_CORE_PATH or install gsd-core." >&2
  exit 1
fi

export GSD_CORE
export GSD_TOOLS="$GSD_CORE/bin/gsd-tools.cjs"
