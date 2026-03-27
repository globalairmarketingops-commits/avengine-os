/* =====================================================================
   AvEngineOS — Page 07: Decision Log
   Chronological audit trail of all decisions
   ===================================================================== */

const DecisionLogPage = (() => {
  let domainFilter = 'all';
  let ownerFilter = 'all';

  function render(container) {
    let decisions = DecisionLog.getAll();
    if (domainFilter !== 'all') decisions = decisions.filter(d => d.domain === domainFilter);
    if (ownerFilter !== 'all') decisions = decisions.filter(d => d.owner === ownerFilter);

    let html = Components.sectionHeader('Decision Log', 'Every decision, change, and experiment — by domain, owner, and outcome');

    // Filters
    html += '<div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap;">';
    html += '<div class="domain-filters">';
    ['all', 'ppc', 'seo', 'listings', 'monetization'].forEach(d => {
      html += `<button class="domain-filter-btn ${d === domainFilter ? 'active' : ''}" onclick="DecisionLogPage.setDomainFilter('${d}')">${d === 'all' ? 'All' : d.toUpperCase()}</button>`;
    });
    html += '</div>';
    html += `<select class="cat-filter" onchange="DecisionLogPage.setOwnerFilter(this.value)">
      <option value="all">All Owners</option>
      ${Opportunity.OWNERS.map(o => `<option value="${o}" ${o === ownerFilter ? 'selected' : ''}>${o}</option>`).join('')}
    </select>`;
    html += `<button class="btn btn-primary btn-sm" onclick="DecisionLogPage.showAdd()">+ Add Decision</button>`;
    html += '</div>';

    // Table
    if (decisions.length === 0) {
      html += Components.emptyState('&#128203;', 'No decisions logged. Add the first decision.', 'Add Decision', 'DecisionLogPage.showAdd()');
    } else {
      const columns = [
        { key: 'date', label: 'Date', render: v => Components.formatDate(v) },
        { key: 'domain', label: 'Domain', render: v => Components.domainBadge(v) },
        { key: 'decision', label: 'Decision' },
        { key: 'reason', label: 'Reason', render: v => `<span style="max-width:200px;display:inline-block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${v}</span>` },
        { key: 'owner', label: 'Owner' },
        { key: 'expected_outcome', label: 'Expected', render: v => v || '—' },
        { key: 'outcome', label: 'Outcome', render: (v, row) => v ? `<span style="color:var(--ga-green-dark);">${v}</span>` : `<button class="btn btn-ghost btn-sm" onclick="DecisionLogPage.addOutcome('${row.id}')">Add</button>` },
        { key: 'is_experiment', label: 'Type', render: v => v ? Components.badge('Experiment', 'amber') : Components.badge('Decision', 'blue') }
      ];
      html += Components.table(columns, decisions, { id: 'decision-log-table', sortable: true });
    }

    container.innerHTML = html;
    Events.log('dec_log_view', { total: decisions.length, domain_filter: domainFilter });
  }

  function setDomainFilter(d) { domainFilter = d; render(document.getElementById('content-area')); }
  function setOwnerFilter(o) { ownerFilter = o; render(document.getElementById('content-area')); }

  function showAdd() {
    // Reuse CommandCenter's add decision modal logic
    if (typeof CommandCenter !== 'undefined') {
      CommandCenter.showAddDecision();
    }
  }

  function addOutcome(id) {
    if (typeof CommandCenter !== 'undefined') {
      CommandCenter.addOutcome(id);
    }
  }

  return { render, setDomainFilter, setOwnerFilter, showAdd, addOutcome };
})();
