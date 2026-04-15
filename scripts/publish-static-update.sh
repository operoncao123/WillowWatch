#!/bin/bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

node scripts/build-static-data.js

if [ ! -d .git ]; then
  echo "No git repository found. Static data refreshed locally only."
  exit 0
fi

if git diff --quiet -- data/overview.json; then
  echo "No static data changes to commit."
  exit 0
fi

if git remote get-url origin >/dev/null 2>&1; then
  git stash --quiet || true
  git pull --rebase origin HEAD || true
  git stash pop --quiet || true
fi

git add data/overview.json
git -c user.name="Liuxu Auto Update" -c user.email="liuxu-auto-update@local.invalid" commit -m "chore: refresh liuxu static data"

if git remote get-url origin >/dev/null 2>&1; then
  git push origin HEAD
else
  echo "No git remote configured. Changes committed locally only."
fi
