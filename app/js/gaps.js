/* =====================================================================
   AvEngineOS — Gaps & Blockers Shared Data Model
   ===================================================================== */

const Gaps = (() => {
  const KEY = 'engine_gaps';

  function getAll() {
    return Store.get(KEY) || [];
  }

  function getByDomain(domain) {
    return getAll().filter(g => g.domain === domain);
  }

  function getBlocksScaling() {
    return getAll().filter(g => g.blocks_scaling && g.status !== 'Resolved');
  }

  function getActive() {
    return getAll().filter(g => g.status !== 'Resolved');
  }

  function getResolved() {
    return getAll().filter(g => g.status === 'Resolved');
  }

  function hasBlockingGaps() {
    return getBlocksScaling().length > 0;
  }

  function updateStatus(id, newStatus, resolution) {
    const items = getAll();
    const item = items.find(g => g.id === id);
    if (!item) return false;
    const oldStatus = item.status;
    item.status = newStatus;
    item.last_updated = new Date().toISOString();
    if (newStatus === 'Resolved') {
      item.resolved_date = new Date().toISOString();
      item.resolution_method = resolution || '';
    }
    Store.set(KEY, items);
    Events.log('gap_status_change', { gap_id: id, old_status: oldStatus, new_status: newStatus });
    return true;
  }

  function totalCOD() {
    let total = 0;
    getActive().forEach(g => {
      const match = (g.cod || '').match(/\$(\d+)/);
      if (match) total += parseInt(match[1]);
    });
    return total;
  }

  return { getAll, getByDomain, getBlocksScaling, getActive, getResolved, hasBlockingGaps, updateStatus, totalCOD };
})();
