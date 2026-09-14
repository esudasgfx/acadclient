# Inventory API

ASP.NET Core API backed by PostgreSQL for shared inventory data.

## Start with Docker

From the `InventoryManager` directory:

```bash
docker compose up --build
```

Test the service at `http://localhost:8080/health` and list materials at `http://localhost:8080/api/inventory`.

## Endpoints

- `GET /api/inventory?search=oak&lowStockOnly=true`
- `POST /api/inventory`
- `PATCH /api/inventory/{id}/stock` with `{ "change": -2, "reason": "Used on RES-104" }`

Authentication and stock-movement audit history should be added before production deployment.
