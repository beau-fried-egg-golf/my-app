#!/bin/bash
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Building main app (Expo web)..."
npx expo export --platform web

echo ""
echo "==> Building admin dashboard..."
cd admin && npm run build && cd "$ROOT"

echo ""
echo "==> Copying admin build into dist/admin/..."
rm -rf dist/admin
cp -r admin/dist dist/admin

echo ""
echo "==> Building events embed widget..."
cd events-embed && npm run build && cd "$ROOT"

echo ""
echo "==> Preparing dist for deploy..."
cp vercel.json dist/vercel.json
mkdir -p dist/.vercel
cp .vercel/project.json dist/.vercel/project.json

echo ""
echo "==> Deploying to Vercel (production)..."
cd dist && vercel --prod

echo ""
echo "==> Done!"
