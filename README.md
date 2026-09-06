# Karen Auto Spares sales app

A browser-based sales and stock control MVP for:

- revenue, gross profit, units sold, and stock alerts
- inventory availability, costs, sell prices, and reorder status
- barcode and acronym search for parts during stock intake and sales
- product images for faster part identification
- low-stock purchase list with recommended quantities to buy
- timestamped sales receipts
- upcoming market price watch
- administrator and sales-agent access

## Run locally

Open `index.html` directly, or run:

```powershell
python -m http.server 4173
```

Then visit `http://localhost:4173`.

## Demo accounts

- Administrator: `admin@ledgerly.test` / `admin123`
- Sales agent: `agent@ledgerly.test` / `agent123`

Data is stored in the browser's `localStorage`, so this version is a functional front-end prototype. To share one live dataset across laptops, connect the data functions in `app.js` to a hosted database and replace the demo login with server-side authentication before deploying to a host such as Vercel, Netlify, or Render.

The separate Supabase-ready shared version is in the `online` folder. See `online/README.md` for database setup and role policies.
