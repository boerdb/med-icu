#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/var/www/med-icu"
REPO="git@github.com:boerdb/med-icu.git"
BRANCH="main"

echo "==> PM2 apps (huidige poorten):"
pm2 jlist 2>/dev/null | grep -oE '"PORT":"[0-9]+"' || pm2 list
echo ""
echo "==> Luisterende poorten 3000-3020:"
ss -tlnH | awk '{print $4}' | grep -oE '[0-9]+$' | sort -n | uniq | grep -E '^30(1[0-9]|20)$' || true

if [[ ! -d "$APP_DIR/.git" ]]; then
  echo "==> Clone naar $APP_DIR"
  git clone --branch "$BRANCH" "$REPO" "$APP_DIR"
fi

cd "$APP_DIR"
git fetch origin
git checkout "$BRANCH"
# Na tarball-deploy kunnen lokale wijzigingen pull blokkeren — reset naar origin.
git reset --hard "origin/$BRANCH"
git clean -fd

if [[ ! -f "$APP_DIR/.env.local" ]]; then
  echo "==> Maak .env.local"
  cat > "$APP_DIR/.env.local" << 'EOF'
NEXT_PUBLIC_APP_NAME=IV Medicatie Verdeler
NODE_ENV=production
EOF
fi

npm ci
npm run build

if ss -tlnH | grep -q ':3013 '; then
  echo "Waarschuwing: poort 3013 is al bezet. Pas PORT in ecosystem.config.cjs aan."
fi

pm2 startOrReload ecosystem.config.cjs
pm2 save

echo ""
echo "Klaar. Test: curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3013/"
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://127.0.0.1:3013/ || true
pm2 show med-icu | grep -E 'status|PORT|url' || pm2 show med-icu
