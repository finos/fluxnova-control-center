#!/bin/bash

# Remove tarball URLs from pnpm-lock.yaml to prevent committing sensitive artifact repository URLs

LOCK_FILE="pnpm-lock.yaml"

if [ ! -f "$LOCK_FILE" ]; then
  exit 0
fi

# Check if file contains tarball URLs
if ! grep -q "tarball: " "$LOCK_FILE"; then
  exit 0
fi

# Create a temporary file
TEMP_FILE=$(mktemp)

# Remove tarball URLs by replacing lines with resolution containing tarball with just the integrity
sed 's/, tarball: [^}]*//g' "$LOCK_FILE" > "$TEMP_FILE"

# Replace original file
mv "$TEMP_FILE" "$LOCK_FILE"

# Stage the file if it was modified
if git status "$LOCK_FILE" | grep -q "modified\|new file"; then
  git add "$LOCK_FILE"
fi

exit 0

