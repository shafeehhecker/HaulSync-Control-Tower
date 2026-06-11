# 🚦 HaulSync Control Tower — Real-Time Logistics Command Center

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/Docker-ready-blue.svg)](https://www.docker.com/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Part of HaulSync](https://img.shields.io/badge/HaulSync-Control%20Tower-F59E0B)](https://github.com/your-org/haulsync)

> **A self-hostable, source-agnostic Control Tower for logistics operations — monitor every shipment, detect disruptions early, and resolve exceptions before they become escalations.**

Part of the HaulSync open-source logistics ecosystem. Consistent design system with HaulSync TOS · FTL.

---

## ✨ Modules

| Module | Route | Description |
|--------|-------|-------------|
| 🟢 **Command Center** | `/` | KPI overview, live exception feed, activity timeline |
| 🔵 **Live Operations** | `/live` | Real-time filterable shipment table across all sources |
| 🔴 **Exceptions** | `/exceptions` | Disruption detection, severity triage, action modal with live notes thread |
| 🟡 **Alerts** | `/alerts` | Notification routing, escalation tracking, acknowledge |
| 🟣 **Action Log** | `/action-log` | Full audit trail — actions and notes merged into a chronological timeline per exception |
| 📊 **Analytics** | `/analytics` | Exception trends, type breakdown, transporter scoring |
| ⚙️ **Alert Rules** | `/rules` | Rule-based notification configuration per exception type |
| 👥 **Users** | `/users` | Role-based access management |

---

## 🏗️ Architecture

```
haulsync-control-tower/
├── frontend/                        # React 18 + Vite + Tailwind (port 3002)
│   └── src/
│       ├── components/
│       │   ├── Layout/Layout.jsx    # CT sidebar — consistent with HaulSync family
│       │   └── common/index.jsx     # Shared component library (StatCard, Table, Btn…)
│       ├── pages/
│       │   ├── Exceptions/          # Action modal with two-column action + notes layout
│       │   ├── ActionLog/           # Real-time log with full timeline drawer per exception
│       │   └── …                   # One folder per route
│       ├── context/AuthContext.jsx
│       └── api/client.js            # Axios + JWT interceptor
├── backend/                         # Node.js 18 + Express + Prisma (port 5002)
│   ├── prisma/
│   │   ├── schema.prisma            # Full data model — includes ActionNote
│   │   ├── seed.js                  # Default users + alert rules
│   │   └── migrations/              # SQL migration history
│   └── src/
│       ├── adapters/                # Source adapter pattern
│       │   ├── ISourceAdapter.js    # Interface — implement to add any source
│       │   ├── genericAdapter.js    # Built-in REST/webhook/manual adapter
│       │   └── registry.js          # Register active adapters here
│       ├── schema/ShipmentEvent.js  # Canonical event schema + validator
│       ├── engines/
│       │   ├── disruptionEngine.js  # Source-agnostic exception detection
│       │   └── alertRouter.js       # Rule-based notification dispatcher
│       ├── routes/                  # One file per resource
│       └── middleware/
├── docker-compose.yml
└── .env.example
```

**Tech Stack** — identical to the HaulSync platform:

| Layer | Technology |
|-------|------------|
| **Backend** | Node.js 18, Express.js, Prisma ORM, PostgreSQL 15, Socket.io |
| **Frontend** | React 18, Vite, Tailwind CSS, React Router v6, Recharts |
| **Auth** | JWT + bcrypt (shared `JWT_SECRET` with HaulSync core for SSO) |
| **Realtime** | Socket.io — live alerts pushed to role-based rooms |
| **Infra** | Docker, Docker Compose, Nginx |

---

## 🚀 Quick Start (Docker)

```bash
git clone https://github.com/your-org/haulsync-control-tower.git
cd haulsync-control-tower

cp .env.example .env
# Edit .env — set JWT_SECRET at minimum

docker compose up -d
```

- **Frontend** → http://localhost:3002  
- **API** → http://localhost:5002  
- **Health** → http://localhost:5002/health

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
cp .env.example .env          # fill DATABASE_URL and JWT_SECRET
npm install
npx prisma migrate dev
node prisma/seed.js
npm run dev                   # http://localhost:5002
```

### Frontend
```bash
cd frontend
npm install
npm run dev                   # http://localhost:3002
```

---

## 📝 Operator Notes & Detailed Log

### Notes on exceptions

Operators can attach freeform notes to any open exception directly from the Exceptions page — no action type required. Notes are designed for quick in-context comms: driver callbacks, status updates, coordination between shifts, or anything that needs to be visible to the next person picking up the exception.

Open an exception → **Take Action** → the right-hand panel shows the live notes thread. Hit Enter to post (Shift+Enter for a new line). Notes are timestamped, attributed by name and role, and visible to everyone with access to that exception.

### Full exception log

Every exception carries a complete merged timeline of all formal actions and freeform notes, sorted chronologically. Access it from the Action Log page via the **Full log →** button on any row. The drawer shows:

- Who took what action, when, and any note attached to it
- All freeform notes in sequence between actions
- Author role badges so shift handovers are immediately clear
- Whether an action marked the exception as resolved

### API endpoints

| Method | Endpoint | Description | Min. role |
|--------|----------|-------------|-----------|
| `GET` | `/api/actions` | Paginated audit log with shipment reference | Any |
| `POST` | `/api/actions` | Log a formal action on an exception | OPERATOR |
| `GET` | `/api/actions/notes?exceptionId=` | Fetch notes thread for an exception | Any |
| `POST` | `/api/actions/notes` | Add a freeform note to an exception | OPERATOR |
| `GET` | `/api/actions/log/:exceptionId` | Full merged timeline (actions + notes) | Any |

### Data model

```prisma
model ActionNote {
  id          String   @id @default(uuid())
  exceptionId String
  authorId    String
  body        String
  createdAt   DateTime @default(now())

  exception   Exception @relation(fields:[exceptionId], references:[id])
  author      User      @relation(fields:[authorId], references:[id])
}
```

### Migration

If upgrading an existing deployment, apply the `ActionNote` migration before restarting:

```bash
# Production
npx prisma migrate deploy

# Development
npx prisma migrate dev --name add_action_notes
```

---

## 🔌 Integration Contract

Control Tower is **source-agnostic**. It owns one canonical schema — `ShipmentEvent` — and every source normalises into it before calling `POST /api/ingest`.

### Adding a new source

1. Create `backend/src/adapters/mySourceAdapter.js` extending `ISourceAdapter`
2. Implement `get sourceId()` and `normalise(rawPayload)`
3. Set source env vars in `.env`
4. Register in `registry.js`: `registry.set('my-source', myAdapter)`

No changes to Control Tower core are needed.

### ShipmentEvent schema

```json
{
  "eventId":    "uuid",
  "source":     "string — originating system identifier",
  "sourceRef":  "source-internal ID",
  "occurredAt": "ISO 8601",
  "shipment": {
    "reference":   "human-readable ref",
    "origin":      { "name": "", "lat": 0.0, "lng": 0.0 },
    "destination": { "name": "", "lat": 0.0, "lng": 0.0 },
    "slaDeadline": "ISO 8601",
    "transporter": { "id": null, "name": "" },
    "vehicle":     { "id": null, "regNo": "" }
  },
  "status": {
    "code":     "IN_TRANSIT | HALTED | DELAYED | DELIVERED | EXCEPTION",
    "location": { "lat": 0.0, "lng": 0.0 },
    "eta":      "ISO 8601",
    "odometer": 0,
    "message":  null
  },
  "meta": {}
}
```

---

## 🧠 Disruption Detection Engine

Evaluates every `ShipmentEvent` against configurable thresholds:

| Exception | Detection logic |
|-----------|-----------------|
| **Unplanned halt** | `status.code === HALTED` |
| **Delay risk** | ETA slip ≥ `DELAY_THRESHOLD_MINUTES` |
| **SLA breach risk** | ETA within `SLA_BREACH_WARNING_MINUTES` of deadline |
| **Night driving** | `IN_TRANSIT` during restricted hours |
| **Auto-resolve** | Halt auto-resolves when vehicle resumes (`IN_TRANSIT`) |
| **Delivered** | All open exceptions resolved on delivery |

All thresholds are configurable via env vars or per-rule in the Rules module.

---

## 🔔 Alert Rules & Escalation

```json
{
  "exceptionType":          "UNPLANNED_HALT",
  "source":                 "*",
  "triggerAfterMinutes":    30,
  "notifyRoles":            ["OPERATOR"],
  "escalateAfterMinutes":   60,
  "escalateToRoles":        ["CONTROL_TOWER_MANAGER"],
  "channels":               ["IN_APP", "EMAIL"],
  "autoResolveOnMovement":  true
}
```

Supported channels: `IN_APP` (Socket.io), `EMAIL` (SMTP), `WEBHOOK` (HTTP POST).

---

## 🔐 Roles

| Role | Permissions |
|------|-------------|
| `SUPER_ADMIN` | Full access including user deletion and system config |
| `ADMIN` | All operations except user deletion |
| `CONTROL_TOWER_MANAGER` | Monitor, manage exceptions, configure rules |
| `OPERATOR` | Acknowledge alerts, log actions, add notes |
| `VIEWER` | Read-only dashboard |

---

## 📜 License

MIT — see [LICENSE](LICENSE).

---

Part of the **HaulSync** open-source logistics ecosystem. Built with ❤️ for the freight community.
