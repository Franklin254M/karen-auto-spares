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

The offline version asks for a local name, email, and role when entering the workspace. It does not provide secure authentication; data is stored in the browser's `localStorage`. Use the online Supabase version for secure accounts and shared access across laptops.

The separate Supabase-ready shared version is in the `online` folder. See `online/README.md` for database setup and role policies.
