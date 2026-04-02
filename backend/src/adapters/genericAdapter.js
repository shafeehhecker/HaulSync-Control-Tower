import { v4 as uuidv4 } from 'uuid';
import { ISourceAdapter } from './ISourceAdapter.js';

/**
 * GenericAdapter — the built-in adapter for standalone mode.
 *
 * Accepts ShipmentEvent objects that are already in canonical form
 * (posted directly to POST /api/ingest) or near-canonical objects
 * that need minor normalisation. Also handles manual UI entry payloads.
 *
 * Any third-party TMS that can POST JSON can use this adapter without
 * writing a custom one — just map to the ShipmentEvent shape.
 */
export class GenericAdapter extends ISourceAdapter {
  get sourceId() {
    return this.config.sourceId || 'generic';
  }

  normalise(raw) {
    // If payload is already a valid ShipmentEvent, pass it through
    // with a generated eventId if absent.
    return {
      eventId:    raw.eventId    || uuidv4(),
      source:     raw.source     || this.sourceId,
      sourceRef:  raw.sourceRef  || null,
      occurredAt: raw.occurredAt || new Date().toISOString(),
      shipment: {
        id:          raw.shipment?.id          || null,
        reference:   raw.shipment?.reference   || raw.reference || null,
        origin:      raw.shipment?.origin      || { name: raw.origin      || '', lat: null, lng: null },
        destination: raw.shipment?.destination || { name: raw.destination || '', lat: null, lng: null },
        slaDeadline: raw.shipment?.slaDeadline || raw.slaDeadline || null,
        transporter: raw.shipment?.transporter || { id: null, name: raw.transporterName || null },
        vehicle:     raw.shipment?.vehicle     || { id: null, regNo: raw.vehicleRegNo   || null },
      },
      status: {
        code:     raw.status?.code     || raw.statusCode || 'IN_TRANSIT',
        location: raw.status?.location || { lat: raw.lat || null, lng: raw.lng || null },
        eta:      raw.status?.eta      || raw.eta        || null,
        odometer: raw.status?.odometer || raw.odometer   || null,
        message:  raw.status?.message  || raw.message    || null,
      },
      meta: raw.meta || {},
    };
  }
}

export default new GenericAdapter();
