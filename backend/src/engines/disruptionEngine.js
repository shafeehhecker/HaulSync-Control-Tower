import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * disruptionEngine.js — source-agnostic exception detection.
 *
 * Evaluates every incoming ShipmentEvent against configurable thresholds
 * and raises Exception records when conditions are met.
 * All logic operates purely on ShipmentEvent data — it never inspects
 * source-specific fields.
 */

const defaults = {
  HALT_THRESHOLD_MINUTES:        parseInt(process.env.HALT_THRESHOLD_MINUTES        || '30'),
  DELAY_THRESHOLD_MINUTES:       parseInt(process.env.DELAY_THRESHOLD_MINUTES       || '60'),
  SLA_BREACH_WARNING_MINUTES:    parseInt(process.env.SLA_BREACH_WARNING_MINUTES    || '120'),
  ROUTE_DEVIATION_KM:            parseFloat(process.env.ROUTE_DEVIATION_KM          || '5'),
  NIGHT_DRIVING_START_HOUR:      parseInt(process.env.NIGHT_DRIVING_START_HOUR      || '22'),
  NIGHT_DRIVING_END_HOUR:        parseInt(process.env.NIGHT_DRIVING_END_HOUR        || '5'),
};

/**
 * Evaluate a ShipmentEvent and raise exceptions as needed.
 * Called by the ingest route after persisting the event.
 *
 * @param {Object} event   - Normalised ShipmentEvent
 * @param {Object} shipment - Persisted Shipment record from DB
 * @returns {Promise<Exception[]>} newly raised exceptions
 */
export async function evaluate(event, shipment) {
  const raised = [];

  // ── 1. Unplanned halt ──────────────────────────────────────────────────────
  if (event.status.code === 'HALTED') {
    const existing = await prisma.exception.findFirst({
      where: { shipmentId: shipment.id, type: 'UNPLANNED_HALT', status: { not: 'RESOLVED' } },
    });
    if (!existing) {
      const ex = await prisma.exception.create({
        data: {
          shipmentId:  shipment.id,
          type:        'UNPLANNED_HALT',
          severity:    'HIGH',
          description: `Vehicle stationary — halt threshold reached`,
        },
      });
      raised.push(ex);
    }
  }

  // ── 2. Auto-resolve halt if vehicle resumes ────────────────────────────────
  if (event.status.code === 'IN_TRANSIT') {
    await prisma.exception.updateMany({
      where: { shipmentId: shipment.id, type: 'UNPLANNED_HALT', status: { not: 'RESOLVED' } },
      data:  { status: 'RESOLVED', resolvedAt: new Date() },
    });
  }

  // ── 3. Delay risk ──────────────────────────────────────────────────────────
  if (event.status.eta && shipment.eta) {
    const etaMs      = new Date(event.status.eta).getTime();
    const originalMs = new Date(shipment.eta).getTime();
    const slipMins   = (etaMs - originalMs) / 60000;

    if (slipMins >= defaults.DELAY_THRESHOLD_MINUTES) {
      const existing = await prisma.exception.findFirst({
        where: { shipmentId: shipment.id, type: 'DELAY_RISK', status: { not: 'RESOLVED' } },
      });
      if (!existing) {
        const ex = await prisma.exception.create({
          data: {
            shipmentId:  shipment.id,
            type:        'DELAY_RISK',
            severity:    'MEDIUM',
            description: `ETA slipped by ${Math.round(slipMins)} min beyond threshold`,
          },
        });
        raised.push(ex);
      }
    }
  }

  // ── 4. SLA breach risk ─────────────────────────────────────────────────────
  if (shipment.slaDeadline && event.status.eta) {
    const etaMs      = new Date(event.status.eta).getTime();
    const slaMs      = new Date(shipment.slaDeadline).getTime();
    const minsToSla  = (slaMs - etaMs) / 60000;

    if (minsToSla <= defaults.SLA_BREACH_WARNING_MINUTES && minsToSla > 0) {
      const existing = await prisma.exception.findFirst({
        where: { shipmentId: shipment.id, type: 'SLA_BREACH_RISK', status: { not: 'RESOLVED' } },
      });
      if (!existing) {
        const ex = await prisma.exception.create({
          data: {
            shipmentId:  shipment.id,
            type:        'SLA_BREACH_RISK',
            severity:    'HIGH',
            description: `ETA within ${Math.round(minsToSla)} min of SLA deadline`,
          },
        });
        raised.push(ex);
      }
    }
  }

  // ── 5. Night driving ───────────────────────────────────────────────────────
  if (event.status.code === 'IN_TRANSIT') {
    const hour = new Date(event.occurredAt).getUTCHours();
    const start = defaults.NIGHT_DRIVING_START_HOUR;
    const end   = defaults.NIGHT_DRIVING_END_HOUR;
    const isNight = start > end
      ? (hour >= start || hour < end)
      : (hour >= start && hour < end);

    if (isNight) {
      const existing = await prisma.exception.findFirst({
        where: {
          shipmentId: shipment.id,
          type:       'NIGHT_DRIVING',
          raisedAt:   { gte: new Date(Date.now() - 8 * 3600 * 1000) },
        },
      });
      if (!existing) {
        const ex = await prisma.exception.create({
          data: {
            shipmentId:  shipment.id,
            type:        'NIGHT_DRIVING',
            severity:    'LOW',
            description: `Vehicle in motion during restricted hours`,
          },
        });
        raised.push(ex);
      }
    }
  }

  // ── 6. Delivered → resolve all open exceptions ─────────────────────────────
  if (event.status.code === 'DELIVERED') {
    await prisma.exception.updateMany({
      where: { shipmentId: shipment.id, status: { not: 'RESOLVED' } },
      data:  { status: 'RESOLVED', resolvedAt: new Date() },
    });
  }

  return raised;
}
