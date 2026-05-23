# Logistics Last-Mile Marketplace Blueprint (MVP -> V2)

## Scope

Build a controlled dispatch marketplace where:
- Sellers get fulfillment access.
- Riders/fleets get nearby jobs.
- Platform controls trust, value exposure, and payout risk.

## 1) Data Model

### `LogisticsPartner` (extended)
- `trust.trustTier`: `0 | 1 | 2 | 3`
- `trust.guarantorFormStatus`: `not_submitted | submitted | approved | rejected`
- `trust.guarantorForm`: guarantor identity payload + admin review metadata
- `assignment.maxOrderValueKobo`: hard assignment value cap
- `assignment.maxRadiusKm`: delivery radius cap
- `assignment.maxConcurrentJobs`: active jobs cap

### New collection (next phase): `DeliveryJob`
- Core fields:
  - `orderId`, `sellerId`, `pickupAddress`, `dropoffAddress`
  - `status`: `open | reserved | picked_up | delivered | cancelled | disputed`
  - `broadcast`: `radiusKm`, `expiresAt`, `invitedRiderIds[]`
  - `assignedRiderId`, `acceptedAt`, `pickupAt`, `deliveredAt`
  - `valueKobo`, `distanceKmEstimate`, `deliveryFeeKobo`
  - `otp`: `pickupHash`, `deliveryHash`, `pickupVerifiedAt`, `deliveryVerifiedAt`
  - `proof`: pickup/delivery photos with geo + timestamp
  - `telemetry`: ping samples / deviation events

### New collection (next phase): `DeliveryEvent`
- Immutable audit trail for custody and dispute forensics:
  - `jobId`, `actorId`, `eventType`, `payload`, `createdAt`

### `DeliveryEvent` (implemented)
- Captures chain-of-custody and operations events:
  - broadcast creation
  - rider claim
  - admin reassignment
  - pickup/delivery OTP verification
  - pickup/delivery proof uploads
  - cron timeout requeue/cancel outcomes

## 2) API Surface

### Implemented now
- `POST /api/logistics/guarantor`
  - Rider submits guarantor form after admin approval + KYC verification.

### Updated now
- `GET /api/logistics/me`
  - Returns `requiresGuarantorForm`, `eligibleForAssignment` with stricter gating.
- `PUT /api/logistics/me`
  - Blocks online toggle unless guarantor is approved.
- `PATCH /api/admin/logistics/:id`
  - Admin can review guarantor status, set trust tier, and update assignment caps.

### Phase B APIs (implemented)
- `POST /api/admin/logistics/jobs/broadcast` (admin creates nearby job queue item)
- `GET /api/logistics/jobs/nearby` (eligible riders fetch nearby open jobs)
- `GET /api/logistics/jobs/mine` (assigned active jobs)
- `POST /api/logistics/jobs/:id/claim` (first-to-accept lock)
- `POST /api/logistics/jobs/:id/otp/verify` (`stage: pickup|delivery`)
- `POST /api/logistics/jobs/:id/proof` (pickup/delivery photo URL)
- `POST /api/logistics/jobs/:id/telemetry` (location ping)
- `GET|POST /api/cron/logistics-dispatch` (auto-requeue expired claims / close stale open jobs)
- `GET /api/admin/logistics/jobs/:id/events` (admin custody timeline)

### Next phase APIs
- `POST /api/logistics/jobs/broadcast` (admin/seller)
- `GET /api/logistics/jobs/nearby` (riders)
- `POST /api/logistics/jobs/:id/claim` (first-to-accept with lock)
- `POST /api/logistics/jobs/:id/pickup-otp/verify`
- `POST /api/logistics/jobs/:id/delivery-otp/verify`
- `POST /api/logistics/jobs/:id/proof`
- `POST /api/logistics/jobs/:id/telemetry`
- `POST /api/admin/logistics/jobs/:id/reassign`
- `POST /api/admin/logistics/jobs/:id/dispute/resolve`

## 3) Rider Flow

1. Apply (`/logistics/apply`)
2. Admin approves + verifies KYC
3. Rider enters dashboard
4. Guarantor form card appears until submitted and approved
5. Admin approves guarantor form
6. Rider can go online and receive jobs under tier caps

## 4) Admin Console

### Implemented now
- Approve/reject guarantor form
- Promote rider to Tier 1 preset caps
- Tier 0 default safety limits at approval:
  - value cap: `₦2,000`
  - radius cap: `10km`
  - concurrent jobs: `1`

### Next phase
- Dispatch board with open/reserved jobs
- Rider map + telemetry deviations
- Dispute workbench and payout hold controls

## 5) Assignment Engine v1

For each open job:
1. Build candidate set by city + online + active + not blacklisted.
2. Filter by:
   - `distance <= rider.maxRadiusKm`
   - `job.value <= rider.maxOrderValueKobo`
   - `activeJobs < rider.maxConcurrentJobs`
3. Sort by:
   - nearest distance
   - higher completion ratio
   - lower cancellation ratio
4. Broadcast to top N nearby riders for short claim window (e.g. 20s).
5. First valid claim reserves job.
6. If timeout/cancel, fallback to next wave.

## 6) Risk Controls (Day 1)

- Pickup OTP + Delivery OTP (mandatory)
- Proof of pickup and delivery (photo + timestamp + geo)
- Payout hold windows for new tiers
- Hard value caps by tier (server-enforced)
- Auto-flag abnormal patterns:
  - repeated OTP failures
  - large route deviations
  - suspicious completion anomalies

## 7) Rollout Plan

### Phase A (done/active)
- Trust-tier fields
- Guarantor workflow
- Online gating enforcement
- Admin trust controls

### Phase B (implemented)
- `DeliveryJob` model + broadcast queue
- first-to-accept locking
- OTP/proof/telemetry lifecycle
- admin dispatch board controls (create/reassign)
- admin event timeline panel per job
- rider active-job panel (claim, OTP verify, proof upload)
- cron fallback for timeout + reassignment loop

### Phase C
- Telemetry scoring + anomaly actions
- insurance/deposit hooks for higher tiers
- partner fleet API integration
