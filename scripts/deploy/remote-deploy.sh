#!/usr/bin/env bash
# Runs ON the EC2 server and deploys the latest code. Started by `npm run deploy` (from your PC)
# or the "Deploy to EC2" GitHub Actions workflow; you can also run it on the server yourself:
#   bash scripts/deploy/remote-deploy.sh [app_dir] [pm2_app] [branch] [port]
set -Eeuo pipefail

APP_DIR="${1:-$HOME/Hostel-Backend-NodeJS}"
PM2_APP="${2:-hostel-backend}"
BRANCH="${3:-main}"
PORT="${4:-2471}"

step() { printf '\n\033[1;34m==> %s\033[0m\n' "$*"; }
fail() { printf '\n\033[1;31mDEPLOY FAILED: %s\033[0m\n' "$*" >&2; exit 1; }
trap 'fail "\"$BASH_COMMAND\" failed (line $LINENO)"' ERR

# Non-interactive SSH sessions don't read ~/.bashrc, so node/npm/pm2 installed with nvm aren't on PATH yet
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
# shellcheck disable=SC1091
if [ -s "$NVM_DIR/nvm.sh" ]; then . "$NVM_DIR/nvm.sh"; fi
for tool in git node npm npx pm2 curl; do
  command -v "$tool" >/dev/null 2>&1 || fail "'$tool' isn't installed or isn't on PATH for this user"
done

cd "$APP_DIR" 2>/dev/null || fail "app folder $APP_DIR not found"

step "Checking the server's copy has no local edits"
if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
  git status --short --untracked-files=no
  fail "files were edited directly on the server. Commit them, or run 'git stash' in $APP_DIR, then deploy again"
fi
PREVIOUS=$(git rev-parse --short HEAD)

step "Pulling origin/$BRANCH"
git fetch --quiet origin "$BRANCH"
git pull --ff-only origin "$BRANCH"
CURRENT=$(git rev-parse --short HEAD)
if [ "$PREVIOUS" = "$CURRENT" ]; then
  echo "Already up to date at $CURRENT (redeploying anyway)"
else
  echo "$PREVIOUS -> $CURRENT"
  git --no-pager log --oneline "$PREVIOUS..$CURRENT" | head -20
fi

step "Installing packages (npm ci)"
npm ci --no-audit --no-fund

step "Applying database migrations (prisma migrate deploy)"
npx prisma migrate deploy

step "Generating the Prisma client"
npx prisma generate

step "Restarting $PM2_APP"
pm2 restart "$PM2_APP" --update-env

step "Waiting for the app to answer on /health"
for _ in $(seq 1 "${HEALTH_TRIES:-20}"); do
  if HEALTH=$(curl -fsS --max-time 3 "http://127.0.0.1:$PORT/health" 2>/dev/null); then
    echo "$HEALTH"
    printf '\n\033[1;32mDeployed %s successfully.\033[0m\n' "$CURRENT"
    exit 0
  fi
  sleep 2
done
pm2 logs "$PM2_APP" --lines 40 --nostream || true
fail "the app didn't answer on http://127.0.0.1:$PORT/health within $(( ${HEALTH_TRIES:-20} * 2 )) seconds (logs above)"
