# Daily Development Setup

Quick steps to get your dev environment running each morning.

---

## 1. Open Terminal

Open Terminal (or iTerm) and navigate to the project:

```
cd ~/my-app/my-app
```

## 2. Start Claude Code

From the project directory, launch Claude Code:

```
claude
```

## 3. Start Expo Dev Server

In a separate terminal tab (Cmd+T):

```
cd ~/my-app/my-app
npx expo start
```

This starts Metro bundler. From here you can:
- Press `i` to open iOS Simulator
- Press `w` to open in your web browser
- Scan the QR code with Expo Go on your phone

## 4. Open iOS Simulator

If the simulator doesn't open automatically from Expo:
- Open **Xcode** > Window > Devices and Simulators
- Or just press `i` in the Expo terminal

The app will build and load in the simulator automatically.

## 5. View on Web

Press `w` in the Expo terminal, or open your browser to:

```
http://localhost:8081
```

## 6. Admin Panel (if needed)

In another terminal tab:

```
cd ~/my-app/my-app/admin
npm run dev
```

Opens at `http://localhost:5173`

---

## Common Commands

| Task | Command |
|---|---|
| Build for web (Vercel) | `npx expo export --platform web` |
| Deploy web to Vercel | `cd dist && vercel --prod` |
| Deploy admin to Vercel | `cd admin && vercel --prod` |
| iOS TestFlight build | `npx eas build --platform ios --profile production --auto-submit` |
| Install new package | `npx expo install <package-name>` |
| Check Supabase logs | Visit supabase.com dashboard |
| View EAS builds | `npx eas build:list` |

---

## Troubleshooting

**Metro bundler won't start:**
```
npx expo start --clear
```

**iOS build fails locally:**
Make sure Xcode and Command Line Tools are up to date. Run:
```
sudo xcode-select --switch /Applications/Xcode.app
```

**Stale cache on web:**
Delete `dist/` and re-export:
```
rm -rf dist && npx expo export --platform web
```
