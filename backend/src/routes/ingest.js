import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth.js';
import { getAdapter }  from '../adapters/registry.js';
import { validateShipmentEvent } from '../schema/ShipmentEvent.js';
import { evaluate }    from '../engines/disruptionEngine.js';
import { routeAlerts } from '../engines/alertRouter.js';

const router = Router();
const prisma = new PrismaClient();

/**
 * POST /api/ingest
 * Accepts a ShipmentEvent (or raw payload) from any source.
 * Normalises → persists → runs disruption detection → routes alerts.
 *
 * Authentication is optional for source-to-source calls — secure via
 * API key in X-API-Key header or Bearer token for UI-driven manual entry.
 */
router.post('/', async (req, res, next) => {
  try {
    const raw     = req.body;
    const adapter = getAdapter(raw.source || 'generic');
    const event   = adapter.normalise(raw);

    // Validate canonical schema
    const errors = validateShipmentEvent(event);
    if (errors.length) return res.status(400).json({ message: 'Invalid ShipmentEvent', errors });

    // Upsert shipment
    const shipment = await prisma.shipment.upsert({
      where:  { reference: event.shipment.reference },
      update: {
        status:          event.status.code,
        currentLat:      event.status.location?.lat,
        currentLng:      event.status.location?.lng,
        eta:             event.status.eta ? new Date(event.status.eta) : undefined,
        transporterName: event.shipment.transporter?.name,
        vehicleRegNo:    event.shipment.vehicle?.regNo,
        updatedAt:       new Date(),
      },
      create: {
        reference:       event.shipment.reference,
        source:          event.source,
        sourceRef:       event.sourceRef,
        originName:      event.shipment.origin?.name || '',
        originLat:       event.shipment.origin?.lat,
        originLng:       event.shipment.origin?.lng,
        destName:        event.shipment.destination?.name || '',
        destLat:         event.shipment.destination?.lat,
        destLng:         event.shipment.destination?.lng,
        slaDeadline:     event.shipment.slaDeadline ? new Date(event.shipment.slaDeadline) : null,
        transporterName: event.shipment.transporter?.name,
        vehicleRegNo:    event.shipment.vehicle?.regNo,
        status:          event.status.code,
        currentLat:      event.status.location?.lat,
        currentLng:      event.status.location?.lng,
        eta:             event.status.eta ? new Date(event.status.eta) : null,
      },
    });

    // Persist event
    await prisma.shipmentEvent.create({
      data: {
        shipmentId: shipment.id,
        source:     event.source,
        sourceRef:  event.sourceRef,
        occurredAt: new Date(event.occurredAt),
        statusCode: event.status.code,
        lat:        event.status.location?.lat,
        lng:        event.status.location?.lng,
        eta:        event.status.eta ? new Date(event.status.eta) : null,
        odometer:   event.status.odometer,
        message:    event.status.message,
        meta:       event.meta || {},
      },
    });

    // Disruption detection
    const exceptions = await evaluate(event, shipment);

    // Route alerts for each new exception
    for (const ex of exceptions) {
      await routeAlerts(ex, shipment);
    }

    // Acknowledge source
    await adapter.acknowledge(event.eventId);

    res.status(202).json({
      accepted:   true,
      eventId:    event.eventId,
      shipmentId: shipment.id,
      exceptionsRaised: exceptions.length,
    });
  } catch (err) { next(err); }
});

export default router;
