# Δ TALOS

Gym tracking app with AI coaching, built for self-hosting over Tailscale.

## Features

- **Multi-user profiles** — PIN-protected accounts with Face ID support on iOS via Safari Keychain
- **Custom programs** — Build any workout program from a 100+ exercise library, share between users
- **Live workout tracking** — Set/rep/weight/RPE logging, rest timer, exercise reordering, quick substitutions
- **Progress charts** — Weight progression per exercise, body weight trends over time (powered by Recharts)
- **PR tracking** — Automatic detection with estimated 1RM, big lift dashboard
- **Streak tracking** — Current streak, best streak, weekly frequency
- **AI Coach** — Claude analyzes your full training history and gives specific programming advice
- **Exercise library** — 100+ built-in exercises categorized by muscle/equipment/type, plus custom exercises
- **Rest timer** — Configurable per compound vs isolation, auto-starts on set completion, vibrates when done
- **Data export** — Full CSV export of all workout data
- **PWA support** — Add to home screen on iPhone for a native app experience

## Quick Start

```bash
cd talos
cp .env.example .env        # Edit and add your Anthropic API key
npm install
npm run build
npm start
```

App runs at `http://localhost:3000`.

## Access Over Tailscale

1. Install Tailscale on your server and phone
2. Find hostname: `tailscale status`
3. Open `http://<hostname>:3000` on any device on your tailnet
4. **iPhone**: Safari → Share → Add to Home Screen

## Face ID / Biometric Auth

When creating a profile with a PIN:
1. Set a PIN during profile creation
2. Safari will offer to save the credential to Keychain
3. Next login, Safari auto-offers Face ID / Touch ID to fill the PIN

For best results, enable HTTPS with Tailscale certs:
```bash
tailscale cert <hostname>.<tailnet>.ts.net
```

## Development

```bash
npm run dev    # Runs Vite (5173) + Express (3000) concurrently
```

## Run on Startup (systemd)

```bash
sudo nano /etc/systemd/system/talos.service
```

```ini
[Unit]
Description=TALOS Gym Tracker
After=network.target

[Service]
Type=simple
User=YOUR_USERNAME
WorkingDirectory=/path/to/talos
ExecStart=/usr/bin/node server.js
Environment=NODE_ENV=production
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable talos && sudo systemctl start talos
```

## Project Structure

```
talos/
├── server.js          # Express API + SQLite + AI proxy
├── ai-provider.js     # Multi-provider AI abstraction
├── src/
│   ├── main.jsx       # React entry
│   ├── App.jsx        # Full UI (auth, pages, charts, timer)
│   └── exercises.js   # Exercise library (100+ exercises)
├── index.html
├── public/manifest.json
├── vite.config.js
├── package.json
├── .env               # API key (not committed)
└── talos.db           # SQLite (created on first run)
```

## Data

Everything lives in `talos.db`. Back up by copying this file. Delete to reset.

## AI Coach Setup

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Settings → API Keys → Create Key
3. Add credits ($5 lasts months)
4. Paste in `.env`

Works without an API key — you just won't have the coach feature.
