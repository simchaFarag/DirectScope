#!/usr/bin/env bash
# Updates everything on the server in one go: code → API (build, DB migrations, restart) → web app.
#   SITE_DIR=/home/<site-user>/htdocs/<domain> ./deploy.sh
# server/.env and server/uploads are never touched.
set -euo pipefail
cd "$(dirname "$0")"

if [ -d .git ]; then
  echo "== git pull"
  git pull --ff-only
fi

echo "== API"
cd server
npm ci
npm run build
npm run db:deploy
pm2 startOrReload deploy/ecosystem.config.cjs --update-env
pm2 save
cd ..

if [ -n "${SITE_DIR:-}" ]; then
  echo "== web app → $SITE_DIR"
  npm ci
  npm run build
  cp -r dist/. "$SITE_DIR"/
else
  echo "== web app skipped (set SITE_DIR to also publish it)"
fi

echo "== health"
sleep 2
curl -fsS localhost:4000/api/health && echo
