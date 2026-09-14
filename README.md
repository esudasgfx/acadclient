# Interior Inventory Management System

Inventory management starter for interior design and implementation teams. The repository contains an offline Android client, a Docker-friendly .NET MAUI client, and an ASP.NET Core API backed by PostgreSQL.

## Architecture

```text
Android Xamarin.Forms / .NET MAUI client
							|
							v
			ASP.NET Core Inventory API
							|
							v
					 PostgreSQL
```

- `InventoryManager/`: mobile application projects and shared SQLite inventory logic
- `InventoryManager/InventoryApi/`: ASP.NET Core API and Entity Framework Core data layer
- `InventoryManager/docker-compose.yml`: PostgreSQL and API development stack
- `InventoryManager/Dockerfile.maui`: Docker build for the current MAUI Android client

## Quick Start: API and PostgreSQL

Requirements: Docker Desktop or Docker Engine with Compose.

From the repository root:

```bash
cd InventoryManager
docker compose up --build
```

The API is available at `http://localhost:8080` and PostgreSQL at `localhost:5432`.

Check the service:

```bash
curl http://localhost:8080/health
curl http://localhost:8080/api/inventory
```

Stop the stack:

```bash
docker compose down
```

To remove the development database volume as well:

```bash
docker compose down -v
```

The Compose credentials are development-only values. Replace them with secrets before deploying anywhere shared or public.

## API Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Service health check |
| `GET` | `/api/inventory` | List all materials |
| `GET` | `/api/inventory?search=oak` | Search materials, suppliers, and projects |
| `GET` | `/api/inventory?lowStockOnly=true` | List materials at or below reorder level |
| `POST` | `/api/inventory` | Add a material |
| `PATCH` | `/api/inventory/{id}/stock` | Adjust stock quantity |

Example stock adjustment:

```bash
curl -X PATCH http://localhost:8080/api/inventory/1/stock \
	-H "Content-Type: application/json" \
	-d '{"change":-2,"reason":"Used on RES-104"}'
```

## Mobile Apps

### Xamarin.Forms Android

Open `InventoryManager/InteriorInventory.sln` in Visual Studio 2022 on Windows with the **Mobile development with .NET** workload. Select `InteriorInventory.Android` as the startup project and run it on an Android emulator or connected device.

Xamarin is retired by Microsoft. This project is retained because it was the requested framework, but new production work should use the MAUI project.

### .NET MAUI Android

Build the MAUI Android project in Docker from `InventoryManager/`:

```bash
docker build -f Dockerfile.maui .
```

The mobile clients currently use SQLite for offline-first local data. The API is the shared source of truth for multi-user synchronization; API synchronization/authentication should be added before production rollout.

## Local Development

Build the API directly with the .NET SDK:

```bash
cd InventoryManager
dotnet restore InventoryApi/InventoryApi.csproj
dotnet build InventoryApi/InventoryApi.csproj
```

Build the shared Xamarin project:

```bash
dotnet build InventoryManager.csproj
```

## Production Follow-up

- Add authentication and role-based authorization.
- Add an inventory stock-movement audit table.
- Add API synchronization to the mobile clients.
- Move database credentials to a secret manager.
- Replace `EnsureCreatedAsync()` with reviewed EF Core migrations.
- Add automated API and mobile tests.
