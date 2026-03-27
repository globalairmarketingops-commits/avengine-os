/* =====================================================================
   AvEngineOS — Decision Log
   Auto-entries from status changes + manual entries
   ===================================================================== */

const DecisionLog = (() => {
  const KEY = 'engine_decision_log';

  function getAll() {
    return (Store.get(KEY) || []).sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  function getThisWeek() {
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    return getAll().filter(d => new Date(d.date) >= monday);
  }

  function add(entry) {
    const item = {
      id: entry.id || `DEC-${Date.now().toString(36)}`,
      date: entry.date || new Date().toISOString(),
      domain: entry.domain,
      decision: entry.decision,
      reason: entry.reason,
      owner: entry.owner,
      expected_outcome: entry.expected_outcome || '',
      stop_loss: entry.stop_loss || null,
      outcome: entry.outcome || null,
      is_experiment: entry.is_experiment || false
    };
    Store.appendToArray(KEY, item);
    Events.log('engine_cmd_decision_add', { decision_id: item.id, domain: item.domain, owner: item.owner });
    return item;
  }

  function addAuto(entry) {
    return add({ ...entry, reason: `[Auto] ${entry.reason || ''}` });
  }

  function updateOutcome(id, outcome) {
    Store.updateInArray(KEY, id, { outcome });
  }

  function filter(opts = {}) {
    let items = getAll();
    if (opts.domain) items = items.filter(d => d.domain === opts.domain);
    if (opts.owner) items = items.filter(d => d.owner === opts.owner);
    return items;
  }

  return { getAll, getThisWeek, add, addAuto, updateOutcome, filter };
})();
