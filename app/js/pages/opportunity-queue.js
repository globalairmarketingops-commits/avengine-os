/* =====================================================================
   AvEngineOS — Page 06: Opportunity Queue
   Global cross-domain ranked action queue
   ===================================================================== */

const OpportunityQueuePage = (() => {
  let domainFilter = 'all';
  let ownerFilter = 'all';

  function render(container) {
    let all = Opportunity.getAll();
    if (domainFilter !== 'all') all = all.filter(o => o.domain === domainFilter);
    if (ownerFilter !== 'all') all = all.filter(o => o.owner === ownerFilter);
    all.sort((a, b) => Opportunity.score(b) - Opportunity.score(a));

    let html = Components.sectionHeader('Opportunity Queue', 'Cross-domain ranked action queue — Score = (Impact × Urgency) / Effort');

    // Filters
    html += '<div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap;">';
    html += '<div class="domain-filters">';
    ['all', 'ppc', 'seo', 'listings', 'monetization'].forEach(d => {
      const count = d === 'all' ? Opportunity.getAll().filter(o => o.status === 'Open').length : Opportunity.countByDomain(d);
      html += `<button class="domain-filter-btn ${d === domainFilter ? 'active' : ''}" onclick="OpportunityQueuePage.setDomainFilter('${d}')">${d === 'all' ? 'All' : d.toUpperCase()} (${count})</button>`;
    });
    html += '</div>';
    html += `<select class="cat-filter" onchange="OpportunityQueuePage.setOwnerFilter(this.value)" style="min-width:120px;">
      <option value="all" ${ownerFilter === 'all' ? 'selected' : ''}>All Owners</option>
      ${Opportunity.OWNERS.map(o => `<option value="${o}" ${o === ownerFilter ? 'selected' : ''}>${o}</option>`).join('')}
    </select>`;
    html += '</div>';

    // Table
    const columns = [
      { key: 'score', label: 'Score', render: (v, row) => `<strong>${Opportunity.scoreDisplay(row)}</strong>` },
      { key: 'domain', label: 'Domain', render: v => Components.domainBadge(v) },
      { key: 'name', label: 'Opportunity' },
      { key: 'action', label: 'Action' },
      { key: 'owner', label: 'Owner' },
      { key: 'eta', label: 'ETA', render: v => Components.formatDate(v) },
      { key: 'cod', label: 'COD' },
      { key: 'sprint', label: 'Sprint' },
      { key: 'status', label: 'Status', render: (v, row) => `
        <select class="form-select" style="font-size:11px;padding:2px 6px;min-height:24px;width:auto;" onchange="OpportunityQueuePage.changeStatus('${row.id}', this.value)">
          ${Opportunity.STATUSES.map(s => `<option value="${s}" ${s === v ? 'selected' : ''}>${s}</option>`).join('')}
        </select>` },
      { key: 'id', label: '', render: (v) => `<button class="btn btn-ghost btn-sm" onclick="OpportunityQueuePage.showDetail('${v}')">Detail</button>` }
    ];

    html += Components.table(columns, all, { id: 'opp-global-table', sortable: true, checkboxes: true, emptyMessage: 'No opportunities in queue.' });

    // Bulk actions
    html += `<div style="display:flex;gap:10px;margin-top:12px;">
      <button class="btn btn-primary btn-sm" onclick="OpportunityQueuePage.bulkAssign()">Assign Selected</button>
      <button class="btn btn-ghost btn-sm" onclick="OpportunityQueuePage.showAddOpportunity()">+ Add Opportunity</button>
    </div>`;

    container.innerHTML = html;

    // Select-all checkbox
    const selectAll = container.querySelector('.select-all');
    if (selectAll) selectAll.addEventListener('change', (e) => container.querySelectorAll('.row-checkbox').forEach(cb => cb.checked = e.target.checked));

    Events.log('opp_queue_view', { items_count: all.length, domain_filter: domainFilter, owner_filter: ownerFilter });
  }

  function setDomainFilter(d) { domainFilter = d; render(document.getElementById('content-area')); }
  function setOwnerFilter(o) { ownerFilter = o; render(document.getElementById('content-area')); }

  function changeStatus(id, newStatus) {
    Opportunity.updateStatus(id, newStatus);
    if (newStatus === 'Shipped') Components.showToast('Opportunity shipped — logged to Decision Log.', 'success');
    updateNavBadges();
  }

  function bulkAssign() {
    const checked = document.querySelectorAll('#opp-global-table .row-checkbox:checked');
    if (checked.length === 0) { Components.showToast('Select items first.', 'error'); return; }
    const ids = Array.from(checked).map(cb => cb.value);
    const ownerHtml = Opportunity.OWNERS.map(o => `<option value="${o}">${o}</option>`).join('');
    Components.showModal(Components.modal('Bulk Assign', `
      <div class="form-group"><label class="form-label">Assign ${ids.length} items to:</label><select class="form-select" id="opp-bulk-owner">${ownerHtml}</select></div>
    `, { id: 'modal-opp-bulk', actions: [
      { label: 'Cancel', class: 'btn-ghost', onClick: "Components.closeModal('modal-opp-bulk')" },
      { label: 'Assign', class: 'btn-primary', onClick: 'OpportunityQueuePage.doBulkAssign()' }
    ]}));
    window._oppBulkIds = ids;
  }

  function doBulkAssign() {
    const owner = document.getElementById('opp-bulk-owner')?.value;
    if (owner && window._oppBulkIds) {
      Opportunity.bulkAssign(window._oppBulkIds, owner);
      Components.closeModal('modal-opp-bulk');
      Components.showToast(`${window._oppBulkIds.length} items assigned to ${owner}.`, 'success');
      render(document.getElementById('content-area'));
      updateNavBadges();
    }
  }

  function showAddOpportunity() {
    const domainOpts = ['ppc', 'seo', 'listings', 'monetization'].map(d => `<option value="${d}">${d.toUpperCase()}</option>`).join('');
    const ownerOpts = Opportunity.OWNERS.map(o => `<option value="${o}">${o}</option>`).join('');
    Components.showModal(Components.modal('Add Opportunity', `
      <div class="form-group"><label class="form-label">Domain *</label><select class="form-select" id="opp-domain">${domainOpts}</select></div>
      <div class="form-group"><label class="form-label">Name/Diagnosis *</label><input class="form-input" id="opp-name" placeholder="What was detected?"></div>
      <div class="form-group"><label class="form-label">Action *</label><input class="form-input" id="opp-action" placeholder="What should be done?"></div>
      <div class="form-group"><label class="form-label">Owner *</label><select class="form-select" id="opp-owner">${ownerOpts}</select></div>
      <div class="form-group"><label class="form-label">COD</label><input class="form-input" id="opp-cod" placeholder="$/day or QI/day"></div>
      <div class="form-group"><label class="form-label">Impact (1-10)</label><input class="form-input" id="opp-impact" type="number" min="1" max="10" value="5"></div>
      <div class="form-group"><label class="form-label">Urgency (1-10)</label><input class="form-input" id="opp-urgency" type="number" min="1" max="10" value="5"></div>
      <div class="form-group"><label class="form-label">Effort (1-10)</label><input class="form-input" id="opp-effort" type="number" min="1" max="10" value="5"></div>
    `, { id: 'modal-add-opp', actions: [
      { label: 'Cancel', class: 'btn-ghost', onClick: "Components.closeModal('modal-add-opp')" },
      { label: 'Add', class: 'btn-primary', onClick: 'OpportunityQueuePage.saveOpportunity()' }
    ]}));
  }

  function saveOpportunity() {
    const domain = document.getElementById('opp-domain')?.value;
    const name = document.getElementById('opp-name')?.value?.trim();
    const action = document.getElementById('opp-action')?.value?.trim();
    if (!name || !action) { Components.showToast('Name and Action required.', 'error'); return; }
    Opportunity.add(domain, {
      name, action,
      owner: document.getElementById('opp-owner')?.value,
      cod: document.getElementById('opp-cod')?.value?.trim() || '',
      impact: parseInt(document.getElementById('opp-impact')?.value) || 5,
      urgency: parseInt(document.getElementById('opp-urgency')?.value) || 5,
      effort: parseInt(document.getElementById('opp-effort')?.value) || 5,
      sprint: 'S1'
    });
    Components.closeModal('modal-add-opp');
    Components.showToast('Opportunity added.', 'success');
    render(document.getElementById('content-area'));
    updateNavBadges();
  }

  function showDetail(id) {
    const all = Opportunity.getAll();
    const item = all.find(o => o.id === id);
    if (!item) return;
    const score = Opportunity.scoreDisplay(item);
    const scoreColor = parseFloat(score) >= 6.5 ? 'cpqi-green' : parseFloat(score) >= 4.5 ? 'cpqi-amber' : 'cpqi-red';
    Components.showModal(Components.modal(item.name || 'Opportunity Detail', `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div><span class="form-label">Domain</span><div>${Components.domainBadge(item.domain)}</div></div>
        <div><span class="form-label">Score</span><div class="${scoreColor}" style="font-size:20px;font-weight:700;">${score}/10</div></div>
        <div><span class="form-label">Status</span><div>${Components.badge(item.status, Components.statusColor(item.status))}</div></div>
        <div><span class="form-label">Owner</span><div>${item.owner || '—'}</div></div>
        <div><span class="form-label">Sprint</span><div>${item.sprint || '—'}</div></div>
        <div><span class="form-label">ETA</span><div>${Components.formatDate(item.eta)}</div></div>
        <div style="grid-column:1/-1"><span class="form-label">Diagnosis</span><div style="font-size:13px;">${item.diagnosis || item.name || '—'}</div></div>
        <div style="grid-column:1/-1"><span class="form-label">Recommended Action</span><div style="font-size:13px;">${item.action || '—'}</div></div>
        <div><span class="form-label">Cost of Delay</span><div style="font-weight:600;color:var(--ga-red);">${item.cod || '—'}</div></div>
        <div><span class="form-label">Stop-Loss</span><div>${item.stop_loss || '—'}</div></div>
        <div><span class="form-label">Success Metric</span><div>${item.success_metric || '—'}</div></div>
        <div><span class="form-label">Category</span><div>${item.category || '—'}</div></div>
        <div><span class="form-label">Impact</span><div>${item.impact || '—'}/10</div></div>
        <div><span class="form-label">Urgency</span><div>${item.urgency || '—'}/10</div></div>
        <div><span class="form-label">Effort</span><div>${item.effort || '—'}/10</div></div>
        <div><span class="form-label">Created</span><div>${Components.formatDate(item.created_at)}</div></div>
      </div>
    `, { id: 'modal-opp-detail', wide: true, actions: [
      { label: 'Close', class: 'btn-ghost', onClick: "Components.closeModal('modal-opp-detail')" }
    ]}));
  }

  return { render, setDomainFilter, setOwnerFilter, changeStatus, bulkAssign, doBulkAssign, showAddOpportunity, saveOpportunity, showDetail };
})();
