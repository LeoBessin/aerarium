# Aerarium

A self-hosted personal finance tracker. Track transactions, define periods, build a custom dashboard, and set monthly budgets — all on your own machine or VPS. No cloud, no accounts, no telemetry. Your data lives in a single JSON file.

---

## Features

- **Transactions** — add income and expenses with labels, amounts, date, and multiple categories. Label autocomplete and category suggestions based on your history.
- **Period calendar** — drag to create named, color-coded time periods (payslip cycles, trips, projects…). Period label autocomplete from past entries.
- **Custom dashboard** — drag-and-resize cards. Available card types:
  - **Total** — sum of income or expenses with trend vs previous month
  - **Top Categories** — biggest categories as a bar or pie chart
  - **Daily Breakdown** — cumulative net flow per day
  - **Avg Daily per Period** — average daily spend per period, merged by name
  - **Budget vs Actual** — compare monthly budgets against real spend
  - **Top Category per Period** — per-day average per category, one tab per period
  - **Category Breakdown** — transaction totals by label within each category, one tab per category
- **Monthly budgets** — set spending caps per category
- **Password protection** — single master password via environment variable, session cookie with 24h TTL
- **Import / Export** — full data backup and restore as JSON from the Settings page

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, Radix UI primitives |
| Charts | Recharts |
| Backend | Express (Node.js), TypeScript |
| Data | Single `data/aerarium.json` file |
| Auth | `HttpOnly` session cookie, in-memory store |

---

## Getting started (local dev)

## Docker (recommended for self-hosting)

### Prerequisites

- Docker
- Docker Compose v2

### Run

```bash
git clone https://github.com/LeoBessin/aerarium.git
cd aerarium
cp .env.example .env   # then set AERARIUM_PASSWORD
docker compose up -d
```

The app is available at [http://localhost:3001](http://localhost:3001).

Data is persisted in a named Docker volume (`aerarium-data`). To back up, use the **Export** button in Settings, or:

```bash
docker run --rm -v aerarium_aerarium-data:/data -v $(pwd):/out alpine \
  cp /data/aerarium.json /out/aerarium-backup.json
```

To update to the latest version:

```bash
git pull
docker compose up -d --build
```

---

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
git clone https://github.com/LeoBessin/aerarium.git
cd aerarium
npm install
```

### Configuration

```bash
cp .env.example .env
```

Edit `.env` and set your password:

```env
AERARIUM_PASSWORD=yourpassword
```

### Run

```bash
npm run dev
```

- Frontend: [http://localhost:5173](http://localhost:5173)
- API: [http://localhost:3001](http://localhost:3001)

---

## Deployment (VPS)

### 1. Build the frontend

```bash
npm run build
```

This outputs static files to `dist/`.

### 2. Serve with Express

The Express server is the API backend. To also serve the built frontend, add this to `server/src/index.ts` (after the API routes):

```ts
import path from 'path'
app.use(express.static(path.resolve('dist')))
app.get('*', (_req, res) => res.sendFile(path.resolve('dist/index.html')))
```

Then start the server:

```bash
AERARIUM_PASSWORD=yourpassword node --loader tsx server/src/index.ts
```

Or compile first:

```bash
npx tsc -p tsconfig.server.json
AERARIUM_PASSWORD=yourpassword node dist-server/index.js
```

### 3. systemd unit

Create `/etc/systemd/system/aerarium.service`:

```ini
[Unit]
Description=Aerarium
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/aerarium
ExecStart=/usr/bin/node dist-server/index.js
Restart=on-failure
Environment=NODE_ENV=production
EnvironmentFile=/opt/aerarium/.env

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now aerarium
```

### 4. Nginx reverse proxy

```nginx
server {
    listen 80;
    server_name aerarium.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name aerarium.yourdomain.com;

    ssl_certificate     /etc/letsencrypt/live/aerarium.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/aerarium.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `AERARIUM_PASSWORD` | Yes | Master password for the lock screen. The server refuses to start without it. |
| `PORT` | No | Port the server listens on. Defaults to `3001`. |
| `CORS_ORIGIN` | No | Allowed CORS origin. Defaults to `http://localhost:5173`. Not needed in production (same-origin). |

---

## Data

All data is stored in `data/aerarium.json`. This file is created automatically on first run and is excluded from version control via `.gitignore`.

**To back up your data**, copy `data/aerarium.json` somewhere safe, or use the **Export** button in Settings.

**To restore**, use the **Import** button in Settings and select a previously exported file. The page reloads automatically after a successful import.

---

## Contributing

Contributions are welcome. To get started:

1. Fork the repository
2. Create a feature branch: `git checkout -b my-feature`
3. Commit your changes: `git commit -m 'add my feature'`
4. Push and open a pull request

For larger changes, open an issue first to discuss what you'd like to change.

There is no CLA. No bureaucracy.

---

## License

[MIT](./LICENSE) — © 2025 Léo Bessin
