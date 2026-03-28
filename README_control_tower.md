# 🚦 HaulSync Control Tower — Real-Time Logistics Command Center

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/Docker-ready-blue.svg)](https://www.docker.com/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Part of HaulSync](https://img.shields.io/badge/HaulSync-Control%20Tower-FF6C47)](https://github.com/your-org/haulsync)

> **A self-hostable, source-agnostic Control Tower for logistics operations — monitor every shipment, detect disruptions early, and resolve exceptions before they become escalations.**

HaulSync Control Tower automates the core responsibilities of a Control Tower Manager: live shipment visibility, proactive exception detection, intelligent alert routing, and decision support. It runs fully standalone out of the box and integrates with any HaulSync module through a published adapter contract.

**Control Tower never depends on a specific module. Modules plug into Control Tower.**

---

<!-- Add your dashboard screenshot here -->
<!-- <img width="2552" height="1405" alt="Control Tower Dashboard" src="https://github.com/user-attachments/assets/your-screenshot-id" /> -->

## ✨ Module Overview

| Module | Description |
|--------|-------------|
| 🟢 **Live Operations Dashboard** | Real-time map and timeline view of all active shipments across lanes and sources |
| 🔴 **Disruption Detection Engine** | Automatically flag delays, unplanned halts, route deviations, and SLA breach risks |
| 🟡 **Alerts & Escalations** | Rule-based notification routing to operators, managers, and transporters |
| 🔵 **Decision Support** | Actionable recommendations for every detected exception type |
| 🟣 **Action Logging** | Full audit trail of every action taken, with responsibility assignment and timestamps |
| 📊 **Insights & Analytics** | Identify risky lanes, unreliable transporters, and recurring operational bottlenecks |
| ⚡ **Automation Engine** | Reduce manual monitoring effort and improve SLA compliance at scale |

---

## 🏗️ Architecture

```
haulsync-control-tower/
├── backend/
│   ├── src/
│   │   ├── adapters/
│   │   │   ├── ISourceAdapter.js        # Adapter interface — implement to connect any source
│   │   │   ├── genericAdapter.js        # Standalone: REST/webhook + manual UI entry
│   │   │   └── registry.js              # Register active adapters (one line per source)
│   │   ├── routes/
│   │   │   ├── ingest.js                # Unified ingestion endpoint
│   │   │   ├── shipments.js             # Live shipment feed & status
│   │   │   ├── exceptions.js            # Disruption detection & resolution
│   │   │   ├── alerts.js                # Alert creation, routing & escalation
│   │   │   ├── actions.js               # Action logging & responsibility tracking
│   │   │   ├── analytics.js             # Insights, KPIs & trend reports
│   │   │   ├── rules.js                 # Alert & escalation rule configuration
│   │   │   ├── users.js                 # User management
│   │   │   └── auth.js                  # Login, JWT
│   │   ├── engines/
│   │   │   ├── disruptionEngine.js      # Core detection logic (source-agnostic)
│   │   │   └── alertRouter.js           # Rule-based notification dispatcher
│   │   ├── schema/
│   │   │   └── ShipmentEvent.js         # Canonical event schema — owned by CT
│   │   └── middleware/
│   │       ├── auth.js
│   │       └── errorHandler.js
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js
│   ├── server.js
│   ├── package.json
│   └── Dockerfile
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── Dashboard.jsx
│       │   ├── Login.jsx
│       │   ├── LiveOperations/
│       │   ├── Exceptions/
│       │   ├── Alerts/
│       │   ├── ActionLog/
│       │   └── Analytics/
│       ├── components/
│       │   ├── Layout/
│       │   └── common/
│       ├── api/client.js
│       └── context/AuthContext.jsx
├── docs/
│   ├── API.md
│   ├── ARCHITECTURE.md
│   ├── DEPLOYMENT.md
│   ├── DISRUPTION_ENGINE.md
│   └── ALERT_RULES.md
├── docker-compose.yml
├── .env.example
├── CONTRIBUTING.md
└── LICENSE
```

**Tech Stack** — identical to the HaulSync platform:

| Layer | Technology |
|-------|------------|
| **Backend** | Node.js 18, Express.js, Prisma ORM, PostgreSQL 15, Socket.io |
| **Frontend** | React 18, Vite, Tailwind CSS, React Router v6, Recharts |
| **Auth** | JWT + bcrypt (shared session with HaulSync core if co-deployed) |
| **Realtime** | Socket.io for live shipment events and push alert delivery |
| **Infra** | Docker, Docker Compose, Nginx (reverse proxy) |

---

## 🔌 Integration Contract

Control Tower is **source-agnostic by design**. It owns a single canonical schema — `ShipmentEvent` — and every data source normalises its data into this schema before sending it to Control Tower. The disruption engine, alert router, dashboard, and analytics only ever process `ShipmentEvent` objects — they never see source-specific data models.

This means Control Tower works with any shipment data source: a HaulSync module, a third-party TMS, an ERP, or a manual entry. Adding a new source requires no changes to Control Tower's core codebase.

### ShipmentEvent schema

```json
{
  "eventId":       "uuid",
  "source":        "string — identifies the originating system",
  "sourceRef":     "source-internal shipment or trip ID",
  "occurredAt":    "ISO 8601 timestamp",
  "shipment": {
    "id":          "CT-scoped shipment ID",
    "reference":   "human-readable reference number",
    "origin":      { "name": "string", "lat": 0.0, "lng": 0.0 },
    "destination": { "name": "string", "lat": 0.0, "lng": 0.0 },
    "slaDeadline": "ISO 8601 timestamp",
    "transporter": { "id": "uuid", "name": "string" },
    "vehicle":     { "id": "uuid", "regNo": "string" }
  },
  "status": {
    "code":        "IN_TRANSIT | HALTED | DELAYED | DELIVERED | EXCEPTION",
    "location":    { "lat": 0.0, "lng": 0.0 },
    "eta":         "ISO 8601 timestamp",
    "odometer":    0,
    "message":     "optional human-readable note"
  },
  "meta": {}
}
```

The `meta` field is a free-form object for source-specific data that Control Tower passes through to the action log but never evaluates. Source internals stay in the source.

To integrate any system with Control Tower, implement the `ISourceAdapter` interface in `backend/src/adapters/` and register it in `registry.js`. See [API Reference](docs/API.md) for the full ingest endpoint spec.

---

## 🔄 Control Tower Workflow

```
Shipment data arrives (any source)
      │
      ├── HaulSync module ──► module adapter ──┐
      ├── Third-party TMS ──► custom adapter ──┼──► ShipmentEvent ──► POST /api/ingest
      └── Standalone      ──► generic adapter ──┘
                               (REST API or manual UI)
      │
      ▼
Disruption Detection Engine — continuous, source-agnostic evaluation
      │
      ├── Halt detected        → alert raised → operator notified
      ├── Route deviation      → alert raised → manager escalated
      ├── SLA breach risk      → decision support triggered
      └── Delay threshold      → auto-escalation to transporter
      │
      ▼
Action taken → logged with owner & timestamp
      │
      ▼
Exception resolved → shipment status updated → audit trail closed
      │
      ▼
Insights engine — aggregates exceptions for analytics & scoring
```

---

## 🚀 Quick Start (Docker — Recommended)

### Prerequisites
- Docker 24+
- Docker Compose v2+
- *(Optional)* A running HaulSync module instance for integrated mode

### 1. Clone the repository

```bash
git clone https://github.com/your-org/haulsync-control-tower.git
cd haulsync-control-tower
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env — set DB credentials, JWT secret, and any source integration keys
nano .env
```

Key environment variables:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/haulsync_ct

# Auth (use the same JWT_SECRET as HaulSync core for SSO)
JWT_SECRET=your-secret-key

# Disruption engine defaults (all overridable per-rule in the Rules module)
HALT_THRESHOLD_MINUTES=30
DELAY_THRESHOLD_MINUTES=60
SLA_BREACH_WARNING_MINUTES=120

# Notifications
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USER=alerts@yourdomain.com
SMTP_PASS=your-smtp-password

# Source integrations — add one block per connected source
# HAULSYNC_<SOURCE>_URL=http://...
# HAULSYNC_<SOURCE>_API_KEY=...
```

Control Tower skips adapters whose environment variables are absent — only configure what you are running.

### 3. Launch all services

```bash
docker compose up -d
```

The backend automatically runs migrations and seeds on first boot.

### 4. Access the app

- **Frontend**: http://localhost:3002
- **Backend API**: http://localhost:5002
- **Health check**: http://localhost:5002/health

### Default credentials

| Email | Password | Role |
|-------|----------|------|
| `admin@haulsync.local` | `Admin@1234` | SUPER_ADMIN |
| `ct-manager@haulsync.local` | `CTMgr@1234` | CONTROL_TOWER_MANAGER |
| `operator@haulsync.local` | `Ops@1234` | OPERATOR |
| `viewer@haulsync.local` | `View@1234` | VIEWER |

---

## 🛠️ Manual Setup (Development)

### Backend

```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate dev
node prisma/seed.js
npm run dev
# API runs on http://localhost:5002
```

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
# UI runs on http://localhost:5175
```

---

## 🧠 Disruption Detection Engine

The detection engine continuously evaluates all active shipments against configurable thresholds. All exception types operate purely on `ShipmentEvent` data — fully source-agnostic regardless of where the event originated.

| Exception type | Detection logic |
|----------------|-----------------|
| **Unplanned halt** | No GPS movement beyond `HALT_THRESHOLD_MINUTES` outside a geofenced stop |
| **Route deviation** | Vehicle position deviates beyond tolerance from planned route polyline |
| **Delay risk** | Current ETA exceeds planned delivery time by `DELAY_THRESHOLD_MINUTES` |
| **SLA breach risk** | Delivery ETA within `SLA_BREACH_WARNING_MINUTES` of SLA deadline |
| **Night driving** | Vehicle in motion during restricted hours (configurable per lane/region) |
| **Geofence violation** | Entry/exit from restricted zones or unexpected stoppage locations |

All thresholds are configurable per rule in the Rules module. See [Disruption Engine Guide](docs/DISRUPTION_ENGINE.md) for full reference.

---

## 🔔 Alert Rules & Escalation

Alerts are dispatched via a rule engine. Example rule configuration:

```json
{
  "exceptionType": "UNPLANNED_HALT",
  "source": "*",
  "triggerAfterMinutes": 30,
  "notifyRoles": ["OPERATOR"],
  "escalateAfterMinutes": 60,
  "escalateToRoles": ["CONTROL_TOWER_MANAGER"],
  "channels": ["IN_APP", "EMAIL"],
  "autoResolveOnMovement": true
}
```

The `source` field accepts `"*"` (all sources) or a specific source identifier, allowing different escalation rules per data source if needed.

Supported channels: `IN_APP`, `EMAIL`, `WEBHOOK` *(SMS and other channels via webhook)*.

See [Alert Rules Configuration](docs/ALERT_RULES.md) for full reference.

---

## 🔐 Default Roles

| Role | Permissions |
|------|-------------|
| `SUPER_ADMIN` | Full access to all modules and system configuration |
| `ADMIN` | All operations except user management and rule configuration |
| `CONTROL_TOWER_MANAGER` | Monitor shipments, manage exceptions, configure alert rules, view analytics |
| `OPERATOR` | Acknowledge alerts, take and log actions on assigned shipments |
| `VIEWER` | Read-only access to dashboard and insights |

---

## 🔗 Operating Modes

### Standalone mode
Control Tower runs with no dependency on any external system. Shipments are created via the REST ingest API (`POST /api/ingest`) or entered manually through the UI. The built-in Generic Adapter normalises both into `ShipmentEvent` objects. Suitable for any TMS, ERP, or logistics operation that wants Control Tower capabilities independently.

### Integrated mode
One or more shipment sources are connected via adapters. Each adapter normalises source events into `ShipmentEvent` objects and pushes them to the ingest endpoint. Control Tower detects which adapters are active based on which environment variables are set — no code changes required to add or remove a source.

HaulSync modules integrate natively. Third-party systems can integrate via the generic REST adapter or a custom adapter implementing `ISourceAdapter`.

---

## 📖 Documentation

- [API Reference](docs/API.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Architecture Overview](docs/ARCHITECTURE.md)
- [Disruption Engine Guide](docs/DISRUPTION_ENGINE.md)
- [Alert Rules Configuration](docs/ALERT_RULES.md)
- [Contributing Guide](CONTRIBUTING.md)

---

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

```bash
# Fork the repo, then:
git checkout -b feature/your-feature-name
git commit -m "feat: add your feature"
git push origin feature/your-feature-name
# Open a Pull Request
```

---

## 📜 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgements

Part of the HaulSync open-source logistics ecosystem. Built with ❤️ for the freight community.
