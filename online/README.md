# Karen Auto Spares online version

This folder is separate from the offline app in the parent folder. It uses Supabase Auth and Postgres so an administrator and sales agents can sign in from different laptops and work with shared data.

## Setup

1. Create a Supabase project.
2. Open the Supabase SQL Editor and run `supabase.sql`.
3. Create the admin and sales-agent users under Authentication > Users.
4. Change the administrator profile role to `admin` using the SQL comment at the bottom of `supabase.sql`.
5. Replace `YOUR_SUPABASE_URL` and `YOUR_SUPABASE_ANON_KEY` in `app.js` with the project values from Supabase Settings > API.
6. Serve this folder over HTTP. From the project root, run `python -m http.server 4173`, then open `http://localhost:4173/online/`.

The browser must use the Supabase anon key only. Never put a service-role key in frontend code.

## Role behavior

- `admin`: overview, shared inventory, purchasing, customers, reports, and all sales.
- `sales_agent`: sales and receipts for that agent.

The database policies in `supabase.sql` enforce the role boundary; the frontend navigation is not the security boundary.

The existing offline version remains in the parent folder and continues to use local browser storage independently.
