# Soberemsya Web

Static web/admin panel for the Soberemsya ecosystem.

## Repositories

- [Soberemsya](https://github.com/vadimkulishov/Soberemsya) — iOS + watchOS app
- [Soberemsya-backend](https://github.com/vadimkulishov/Soberemsya-backend) — FastAPI backend
- [Soberemsya-web](https://github.com/vadimkulishov/Soberemsya-web) — this web/admin panel

## Stack

- HTML
- CSS
- Vanilla JavaScript

## Quick start

Serve the directory with any static file server, for example:

```bash
python3 -m http.server 3000
```

Then open `http://localhost:3000`.

## API

The admin panel expects the backend admin API on `http://localhost:8001/api`.
If you deploy the frontend separately, update `API_BASE_URL` in `app.js`.
