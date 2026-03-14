#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

DATE="$(date -u +%F)"
TS="$(date -u +%Y-%m-%dT%H-%M-%SZ)"
OUT_DIR="$ROOT_DIR/backups/$DATE"
MD_ARCHIVE="$OUT_DIR/md-snapshot-$TS.tar.gz"
REPORT="$ROOT_DIR/reports/backup-report-$TS.md"

mkdir -p "$OUT_DIR" "$ROOT_DIR/reports"

# 1) Existing targeted backup (core agent config files).
if [[ -x "$ROOT_DIR/scripts/daily-backup.sh" ]]; then
  "$ROOT_DIR/scripts/daily-backup.sh" >/dev/null
fi

# 2) Snapshot ALL *.md files in workspace ("Agents important data").
# Exclude common bulky dirs.
EXCLUDES=(
  "./node_modules" "./**/node_modules"
  "./.git" "./**/.git"
  "./backups" "./reports"
  "./apps/**/.next"
)

TMP_LIST="$(mktemp)"
trap 'rm -f "$TMP_LIST"' EXIT

# Find markdown files, excluding backups/reports to keep the archive stable.
find . -type f -name "*.md" \
  ! -path "./backups/*" \
  ! -path "./reports/*" \
  ! -path "./**/node_modules/*" \
  ! -path "./**/.git/*" \
  -print > "$TMP_LIST"

COUNT="$(wc -l < "$TMP_LIST" | tr -d ' ')"

tar -czf "$MD_ARCHIVE" -T "$TMP_LIST"

SIZE_BYTES="$(wc -c < "$MD_ARCHIVE" | tr -d ' ')"

cat > "$REPORT" <<EOF
# Backup Report — $TS (UTC)

Checklist:
- [x] Ran scripts/daily-backup.sh (core agent config snapshot)
- [x] Archived all workspace *.md (excluding backups/, reports/, node_modules/, .git/)

Artifacts:
- Backup folder: backups/$DATE/
- Markdown archive: backups/$DATE/$(basename "$MD_ARCHIVE")
- Markdown file count: $COUNT
- Archive size (bytes): $SIZE_BYTES

Notes:
- This is a safety snapshot for "important Agent data" stored as Markdown.
EOF

echo "$REPORT"
