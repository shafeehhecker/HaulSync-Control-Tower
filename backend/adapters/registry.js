/**
 * registry.js — register all active source adapters here.
 *
 * Control Tower detects which adapters are active based on which
 * environment variables are set. Add one line per source.
 *
 * To add a new source:
 *  1. Create your adapter in this directory implementing ISourceAdapter
 *  2. Import it below
 *  3. Add it to the registry map with its sourceId as key
 *
 * The ingest route resolves the correct adapter by matching the
 * `source` field on the incoming payload to a registry key.
 * If no match is found, the generic adapter is used as fallback.
 */
import genericAdapter from './genericAdapter.js';

// Import custom adapters here:
// import haulsyncFtlAdapter from './haulsyncFtlAdapter.js';

const registry = new Map();

// Always register the generic adapter
registry.set('generic', genericAdapter);
registry.set('*',       genericAdapter); // fallback

// Register source-specific adapters when env vars are present:
// if (process.env.HAULSYNC_FTL_URL) registry.set('haulsync-ftl', haulsyncFtlAdapter);

/**
 * Resolve the adapter for a given source identifier.
 * Falls back to the generic adapter if no specific adapter is registered.
 * @param {string} source
 * @returns {import('./ISourceAdapter.js').ISourceAdapter}
 */
export function getAdapter(source) {
  return registry.get(source) || registry.get('*');
}

export default registry;
