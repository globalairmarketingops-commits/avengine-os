/* =====================================================================
   AvEngineOS — Global Opportunity Queue Logic
   Scoring, filtering, CRUD, auto-population from threshold violations
   ===================================================================== */

const Opportunity = (() => {
  const DOMAINS = ['ppc', 'seo', 'listings', 'monetization'];
  const STATUSES = ['Open', 'In Progress', 'Blocked', 'Shipped', 'Verified'];
  const OWNERS = ['Casey', 'Ian', 'Jadda', 'Keaton'];

  function getAll() {
    let all = [];
    DOMAINS.forEach(d => {
      const items = Store.get(`engine_opp_${d}`) || [];
      all = all.concat(items);
    });
    return all;
  }

  function getByDomain(domain) {
    return Store.get(`engine_opp_${domain}`) || [];
  }

  function getByOwner(owner) {
    return getAll().filter(o => o.owner === owner);
  }

  function getTop(n = 10) {
    return getAll()
      .filter(o => o.status === 'Open' || o.status === 'In Progress')
      .sort((a, b) => score(b) - score(a))
      .slice(0, n);
  }

  function score(item) {
    const impact = item.impact || 5;
    const urgency = item.urgency || 5;
    const effort = Math.max(item.effort || 5, 1);
    return Math.round((impact * urgency) / effort * 10) / 10;
  }

  function scoreDisplay(item) {
    return score(item).toFixed(1);
  }

  function add(domain, item) {
    const key = `engine_opp_${domain}`;
    item.id = item.id || `OPP-${domain.toUpperCase()}-${Date.now().toString(36)}`;
    item.domain = domain;
    item.status = item.status || 'Open';
    item.created_at = new Date().toISOString();
    Store.appendToArray(key, item);
    return item;
  }

  function updateStatus(id, newStatus, reason) {
    let found = false;
    DOMAINS.forEach(d => {
      const key = `engine_opp_${d}`;
      const items = Store.get(key) || [];
      const item = items.find(o => o.id === id);
      if (item) {
        const oldStatus = item.status;
        item.status = newStatus;
        item.status_updated = new Date().toISOString();
        Store.set(key, items);
        found = true;
        // Auto-log to decision log when shipped
        if (newStatus === 'Shipped') {
          DecisionLog.addAuto({
            domain: d,
            decision: `Shipped: ${item.name}`,
            reason: reason || item.action,
            owner: item.owner,
            expected_outcome: item.success_metric
          });
        }
        Events.log('engine_cmd_opp_status_change', { item_id: id, old_status: oldStatus, new_status: newStatus });
      }
    });
    return found;
  }

  function bulkAssign(ids, owner) {
    ids.forEach(id => {
      DOMAINS.forEach(d => {
        const key = `engine_opp_${d}`;
        Store.updateInArray(key, id, { owner, status: 'In Progress' });
      });
    });
    Events.log('engine_cmd_opp_assign', { item_ids: ids, owner });
  }

  function countByDomain(domain) {
    return (Store.get(`engine_opp_${domain}`) || []).filter(o => o.status === 'Open').length;
  }

  return { getAll, getByDomain, getByOwner, getTop, score, scoreDisplay, add, updateStatus, bulkAssign, countByDomain, DOMAINS, STATUSES, OWNERS };
})();
