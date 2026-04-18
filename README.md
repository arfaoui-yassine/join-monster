# 🚗 AutoLoc — Car Rental GraphQL API

A full-stack car rental platform with GraphQL API, demonstrating performance optimization
from **Naive N+1** → **DataLoader** → **Join Monster** with real benchmarks.

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v18+)
- **Docker** (for MySQL)

### 1. Start the Database

```bash
cd docker
docker-compose up -d
```

This starts MySQL 9.6 on **port 3307** with root password `1234`.

### 2. Initialize the Database

```bash
# Create schema
docker exec -i mysql-container mysql -u root -p1234 < test-api/car-rental/db/schema.sql

# Load base seed data
docker exec -i mysql-container mysql -u root -p1234 car_rental < test-api/car-rental/db/seed.sql

# Load massive data (200+ cars, 215 customers, 1500 reservations, 550 reviews)
docker exec -i mysql-container mysql -u root -p1234 car_rental < test-api/car-rental/db/seed-massive.sql
```

> **Windows PowerShell?** Prefix with `cmd /c` if the `<` operator fails:
> ```powershell
> cmd /c "docker exec -i mysql-container mysql -u root -p1234 < test-api/car-rental/db/schema.sql"
> ```

### 3. Install Dependencies

```bash
npm install
cd frontend && npm install && cd ..
```

### 4. Start the Backend (port 3000)

```bash
npm start
```

### 5. Start the Frontend (port 5173)

```bash
cd frontend
npm run dev
```

### 6. Open in Browser

- **Dashboard**: http://localhost:5173/
- **Benchmark**: http://localhost:5173/benchmark
- **GraphiQL**: http://localhost:3000/car-rental

## 🔑 Authentication

Mutations require JWT authentication. Use these demo credentials:

| Field | Value |
|-------|-------|
| Client ID | `carrental-app` |
| Client Secret | `cr-secret-2024` |

Login via the UI at `/login` or via GraphQL:

```graphql
mutation {
  login(clientId: "carrental-app", clientSecret: "cr-secret-2024") {
    token
    expiresIn
  }
}
```

## 📊 Performance Benchmark

Navigate to `/benchmark` and click **"Run Performance Comparison"** to see:

| Scenario | Naive Queries | DataLoader | Join Monster |
|----------|--------------|------------|-------------|
| Cars + Relations | ~301 | 4 | 1 |
| Reservations (3 levels deep) | ~401 | 5 | 1 |
| Customer Aggregation | ~151 | 4 | 1 |

## 🏗️ Architecture

```
test-api/
├── car-rental/
│   ├── schema.js        # GraphQL schema + resolvers
│   ├── benchmark.js     # 3 benchmark scenarios (Naive/DL/JM)
│   ├── auth.js          # JWT middleware
│   └── db/
│       ├── schema.sql   # MySQL table definitions
│       ├── seed.sql     # Base seed data
│       ├── seed-massive.sql # Scale-up script
│       └── connection.js    # Knex.js connection
├── server.js            # Express + WebSocket server
frontend/
├── src/
│   ├── App.jsx          # Router + Navbar
│   ├── hooks/useApi.js  # GraphQL client with JWT
│   ├── utils/icons.js   # Category icon mapping
│   └── pages/
│       ├── DashboardPage.jsx
│       ├── CarsPage.jsx
│       ├── ReservationsPage.jsx
│       ├── CustomersPage.jsx
│       ├── ReviewsPage.jsx
│       ├── BenchmarkPage.jsx
│       └── LoginPage.jsx
```

## 🔌 API Endpoints

| Endpoint | Description |
|----------|-------------|
| `POST /car-rental/graphql` | GraphQL API |
| `GET /car-rental` | GraphiQL IDE |
| `GET /car-rental/benchmark` | Single benchmark |
| `GET /car-rental/benchmark/all` | Multi-scenario benchmark |
| `WS /car-rental/subscriptions` | Real-time subscriptions |
