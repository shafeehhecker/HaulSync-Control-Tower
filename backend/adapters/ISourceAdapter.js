/**
 * ISourceAdapter — interface contract for all Control Tower source adapters.
 *
 * To connect any shipment data source to Control Tower:
 *  1. Create a new file in backend/src/adapters/ (e.g. myTmsAdapter.js)
 *  2. Export a class that extends ISourceAdapter
 *  3. Implement normalise() to map your source schema → ShipmentEvent
 *  4. Register your adapter in registry.js
 *
 * Control Tower's disruption engine and alert router never see source-specific
 * models — they only ever process ShipmentEvent objects.
 */
export class ISourceAdapter {
  constructor(config = {}) {
    this.config = config;
  }

  /**
   * Returns the unique identifier for this source.
   * Used as the `source` field on ShipmentEvent objects.
   * @returns {string}
   */
  get sourceId() {
    throw new Error('ISourceAdapter.sourceId must be implemented');
  }

  /**
   * Normalises a source-specific payload into a ShipmentEvent object.
   * @param {Object} rawPayload - Raw data from the originating system
   * @returns {import('../schema/ShipmentEvent.js').ShipmentEvent}
   */
  normalise(rawPayload) {
    throw new Error('ISourceAdapter.normalise() must be implemented');
  }

  /**
   * Optional: called by the ingest route after a ShipmentEvent is persisted.
   * Use to acknowledge receipt back to the source system if needed.
   * @param {string} eventId
   */
  async acknowledge(eventId) {
    // no-op by default
  }
}
