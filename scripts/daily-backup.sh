#!/usr/bin/env bash
set -euo pipefail

DATE=${1:-$(date -I)}
TARGET_DIR="backups/$DATE"
mkdir -p "$TARGET_DIR"
FILES=(AGENTS.md SOUL.md IDENTITY.md USER.md TOOLS.md HEARTBEAT.md)
for file in "${FILES[@]}"; do
  if [[ -f "$file" ]]; then
    cp "$file" "$TARGET_DIR/$file"
  fi
done

cat <<EOF
Backed up ${#FILES[@]} files to $TARGET_DIR
EOF
