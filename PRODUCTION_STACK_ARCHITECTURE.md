# Production Stack Architecture & Backend Wiring Roadmap
**Project:** HEMP (Healthcare Engineering Management Platform)  
**Status:** Approved Architectural Target (Wiring phase deferred until all frontend mockups are completed)

---

## 1. Executive Summary

This document serves as the definitive reference for the backend, database, hosting, and offline synchronization architecture for the HEMP platform. 

The client's non-negotiable requirements:
1. **100% Offline and Online Functionality**: Biomedical engineers and technicians must be able to log work orders, parts consumption, equipment audits, and checklists in shielded hospital bunkers or remote clinics without an active internet connection.
2. **Predictable, Ultra-Low Ongoing Costs**: Maximum recurring hosting cost capped at **≤ $5/month** to avoid exorbitant SaaS renewals in foreign currency.
3. **No Storage or Database Paywalls**: Freedom to store hundreds of thousands of parts records, historical transactions, calibration logs, and attachments without artificial row or bandwidth limits.

---

## 2. Final Confirmed Technology Stack

| Layer | Selected Technology | Role & Strategic Justification |
| :--- | :--- | :--- |
| **Client Frontend** | **React 19 + TanStack Router (PWA)** | Ultra-fast, type-safe user interface with zero-latency local state transitions. |
| **Local Storage** | **IndexedDB via Dexie.js** | Persists all application data locally in the browser/tablet; enables instant offline reads, searches, and optimistic writes. |
| **Backend API** | **Laravel 11 / 12 (PHP 8.3+)** | Enterprise-grade REST/Sync API, transaction management, Sanctum authentication, authorization policies, and queued jobs. |
| **Central Database** | **PostgreSQL 16** | Native 16-byte UUID indexing, high-performance `JSONB` delta change logs, MVCC concurrency for bulk sync, and no vendor paywalls. |
| **Host Infrastructure** | **Hetzner Cloud VPS (~€3.79–€4.50/mo)** | Dedicated virtual server (2 vCPUs, 4 GB RAM, 40 GB NVMe SSD, 20 TB traffic). Flat, predictable billing under $5/month. |
| **Offsite Backups** | **Backblaze B2 ($0 Free Tier)** | Daily encrypted PostgreSQL snapshot uploads via `spatie/laravel-backup` (10 GB permanent free storage). |

---

## 3. High-Level System Architecture

```
                    HOSPITAL / FIELD ENVIRONMENT
  ┌─────────────────────────────────────────────────────────────┐
  │  Client Devices (Laptops, Tablets, Mobile Phones)            │
  │  - Progressive Web App (PWA) cached via Service Worker      │
  │  - UI reads & writes 100% against local IndexedDB (Dexie)   │
  │  - Zero network requirement for daily engineering tasks     │
  │  - Local Outbox accumulates changes with client-side UUIDs  │
  └──────────────────────────────┬──────────────────────────────┘
                                 │
                   (When connection is detected)
                                 │
  ═══════════════════════════════╪═══════════════════════════════
                   SECURE HTTPS REST SYNC TUNNEL
  ═══════════════════════════════╪═══════════════════════════════
                                 │
  ┌──────────────────────────────▼──────────────────────────────┐
  │  Hetzner Cloud VPS ($4–$5 / month)                          │
  │                                                             │
  │  ├── Nginx Web Server + Let's Encrypt Free SSL              │
  │  │                                                          │
  │  ├── Laravel 11/12 Engine                                   │
  │  │   ├── Sanctum Token Authentication                       │
  │  │   ├── Sync Controller (`/api/v1/sync/push` & `pull`)     │
  │  │   ├── Idempotency Filter (guards against replay retries) │
  │  │   └── Conflict Resolution & Audit Trail Logger           │
  │  │                                                          │
  │  └── PostgreSQL 16 (Local NVMe Socket)                      │
  │      ├── Native UUID Primary Keys                           │
  │      ├── Soft-Delete Tombstones (`deleted_at`)              │
  │      └── Append-Only Transaction Ledgers                    │
  └──────────────────────────────┬──────────────────────────────┘
                                 │
            (Automated Nightly Encrypted Database Dump)
                                 │
  ┌──────────────────────────────▼──────────────────────────────┐
  │  Backblaze B2 Offsite Cloud Storage (10 GB Free = $0)       │
  └─────────────────────────────────────────────────────────────┘
```

---

## 4. The Offline-First Sync Protocol

Standard REST CRUD (`POST /parts`, `PUT /parts/{id}`) fails offline because it requires server-assigned IDs and overwrites concurrent edits. 

Instead, the system relies on an **Atomic Push/Pull Delta Sync** protocol:

### 4.1 Client Outbox Pattern
1. Every write in the app (e.g. keying in a physical audit count, adding a spare part, logging a stock movement) generates a **client-side UUIDv4**.
2. The record is instantly saved in local IndexedDB (UI updates immediately).
3. A mutation object is appended to the local `outbox_mutations` table:
   ```json
   {
     "mutation_id": "9a12c4b1-88f1-4322-9011-abcdef123456",
     "table": "stock_movements",
     "action": "create",
     "data": { "part_id": "...", "quantity": -2, "type": "issued" },
     "client_timestamp": "2026-09-10T14:30:00Z",
     "status": "pending"
   }
   ```

### 4.2 Push: `POST /api/v1/sync/push`
* When online, the background worker drains the outbox to Laravel.
* Laravel checks the `sync_mutations` table to ensure the `mutation_id` has never been processed before (idempotency guarantee).
* All operations run inside an atomic PostgreSQL transaction.

### 4.3 Pull: `POST /api/v1/sync/pull`
* Client sends its `last_synced_at` timestamp and hospital `facility_id`.
* Laravel queries all records where `updated_at > last_synced_at` or `deleted_at > last_synced_at`.
* Client receives the delta and updates its local IndexedDB.

---

## 5. Domain Conflict Handling Matrix

| Data Entity | Nature | Conflict Strategy |
| :--- | :--- | :--- |
| **Stock Movements** | Immutable Transaction | **Additive (No Conflict)**. Every logged movement is saved. Balance is computed from chronological sequence. |
| **Physical Audit Counts** | Verification Log | **Partitioned Counts**. Tied to the user badge ID. Shrinkage discrepancies require Admin Sign-Off. |
| **Part Specifications** | Descriptive Metadata | **Last-Write-Wins (LWW)** with server audit log preservation. |
| **Policy/SOP Training** | Compliance Document | **Append-Only Read Receipt**. Completely conflict-free. |

---

## 6. VPS Cost & Specifications Breakdown

* **Provider**: [Hetzner Cloud](https://www.hetzner.com/cloud) (Server Location: Germany / Finland for optimal European/African routing).
* **Recommended Plan**: **CX22** or **CPX11**
  * **Price**: ~€3.79 to €4.50 per month (approx. $4.10–$4.90 USD).
  * **vCPU**: 2 Intel/AMD Cores.
  * **RAM**: 4 GB (plenty for PHP-FPM, PostgreSQL, and Redis caching).
  * **Disk**: 40 GB NVMe SSD (capable of storing millions of database rows).
  * **Bandwidth**: 20 TB monthly transfer included.
* **Domain & SSL**:
  * Free SSL via Let's Encrypt (managed automatically via Nginx Certbot or Caddy).

---

## 7. Post-Mockup Implementation Checklist

When all frontend modules and mockups have been signed off, follow this step-by-step wiring order:

- [ ] **Step 1: VPS Provisioning & Hardening**
  - Launch Hetzner CX22 server (Ubuntu 24.04 LTS).
  - Configure UFW firewall (allow only ports 22, 80, 443).
  - Install PHP 8.3, PostgreSQL 16, Nginx, and Composer.
- [ ] **Step 2: Laravel App Scaffolding**
  - Install Laravel 11/12 with PostgreSQL driver.
  - Setup Laravel Sanctum for API token authentication.
  - Run database migrations using UUID primary keys and soft deletes.
- [ ] **Step 3: Sync Engine Endpoints**
  - Implement `SyncController@push` (transactional mutation processor).
  - Implement `SyncController@pull` (timestamped delta generator).
  - Implement `sync_mutations` idempotency table.
- [ ] **Step 4: Automated Backups**
  - Install `spatie/laravel-backup`.
  - Connect free Backblaze B2 S3-compatible bucket credentials.
  - Configure daily cron job: `php artisan backup:run --only-db`.
- [ ] **Step 5: Frontend Dexie.js Integration**
  - Swap mock in-memory service calls with Dexie.js IndexedDB repository.
  - Add Outbox synchronization background worker with visual sync indicator badge in topbar.
- [ ] **Step 6: PWA Service Worker**
  - Configure `vite-plugin-pwa` with Workbox for zero-network app shell caching.
