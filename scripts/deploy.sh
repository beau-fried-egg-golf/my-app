#!/bin/bash
set -e

cd "$(dirname "$0")/.."

echo "==> Building main app (Expo web)..."
npx expo export --platform web

echo ""
echo "==> Building admin dashboard..."
cd admin && npm run build && cd ..

echo ""
echo "==> Copying admin build into dist/admin/..."
rm -rf dist/admin
cp -r admin/dist dist/admin

echo ""
echo "==> Copying vercel.json into dist/..."
cp vercel.json dist/vercel.json

echo ""
echo "==> Deploying to Vercel (production)..."
vercel --prod

echo ""
echo "==> Done!"
