/* =====================================================================
   AvEngineOS — Page 01: Command Center
   Default landing. Gates + KPIs + Top 10 Queue + This Week's Decisions.
   Per Page_01_Command_Center_Spec_v1.0 (US-CMD-001 through 010)
   ===================================================================== */

const CommandCenter = (() => {

  function render(container) {
    const settings = Store.get('engine_settings') || {};
    const hasCriticalRed = isCriticalRed(settings);

    let html = '';

    // Critical gate banner (US-CMD-001 AC4)
    if (hasCriticalRed) {
      html += Components.alertBanner('Critical gate failure — see Gates row. Scaling controls disabled across all domain pages.', 'error');
    }

    // Row 1 — Gates (US-CMD-001)
    html += Components.sectionHeader('System Gates', 'Revenue engine health — cannot be collapsed or dismissed');
    html += '<div class="row-grid row-grid-5" id="gates-row">';
    html += renderGate('Conversion Signal', settings.conversion_signal_status);
    html += renderGate('Call Tracking', settings.call_tracking_active);
    html += renderGate('gclid/UTM Capture', settings.gclid_capture_status);
    html += renderGate('Enhanced Conversions', settings.enhanced_conversions_status);
    html += renderGate('AI Crawler Access', settings.ai_crawler_status);
    html += '</div>';

    // Row 2 — Prime Directive KPIs (US-CMD-002)
    html += Components.sectionHeader('Prime Directive KPIs', 'Revenue engine performance — 3 metrics that matter');
    html += '<div class="row-grid row-grid-3">';
    html += renderQICPQITile(settings);
    html += renderAtRiskTile();
    html += renderFeaturedLeakageTile();
    html += '</div>';

    // Row 3 — Top 10 Opportunity Queue (US-CMD-003)
    html += Components.sectionHeader('Top 10 Opportunities', 'Highest-scoring actions across all domains');
    html += renderOpportunityQueue();

    // Row 4 — This Week's Decisions (US-CMD-004)
    html += Components.sectionHeader("This Week's Decisions", 'Audit trail of what changed and why');
    html += renderDecisions();

    container.innerHTML = html;

    // Bind select-all checkbox
    const selectAll = container.querySelector('.select-all');
    if (selectAll) {
      selectAll.addEventListener('change', (e) => {
        container.querySelectorAll('.row-checkbox').forEach(cb => cb.checked = e.target.checked);
      });
    }

    Events.log('engine_cmd_page_load', { gates_red: countRedGates(settings), opportunities: Opportunity.getTop(10).length });
  }

  function isCriticalRed(settings) {
    const criticals = [settings.conversion_signal_status, settings.call_tracking_active];
    const greenStatuses = ['clean', 'confirmed', 'active', 'live'];
    return criticals.some(g => g && !greenStatuses.includes((g.status || '').toLowerCase()));
  }

  function countRedGates(settings) {
    const gates = [settings.conversion_signal_status, settings.call_tracking_active, settings.gclid_capture_status, settings.enhanced_conversions_status, settings.ai_crawler_status];
    const greenStatuses = ['clean', 'confirmed', 'active', 'live', 'unblocked'];
    return gates.filter(g => g && !greenStatuses.includes((g.status || '').toLowerCase())).length;
  }

  function renderGate(name, gate) {
    if (!gate) return Components.statusCard(name, 'UNKNOWN', { owner: '—', cod: '—' });
    const settingsKey = Object.entries(Store.get('engine_settings') || {}).find(([k, v]) => v === gate)?.[0] || '';
    return Components.statusCard(name, gate.status, {
      owner: gate.owner,
      cod: gate.cod_per_day,
      ticket: gate.ticket_ref,
      lastUpdated: gate.last_updated,
      onClick: `CommandCenter.showGateEdit('${settingsKey}', '${name}')`
    });
  }

  function showGateEdit(settingsKey, gateName) {
    Events.log('engine_cmd_gate_click', { gate_name: gateName, gate_status: 'viewing' });
    const settings = Store.get('engine_settings') || {};
    const gate = settings[settingsKey];
    if (!gate) return;
    const statusOpts = ['CLEAN', 'CONFIRMED', 'ACTIVE', 'UNCONFIRMED', 'NOT_ACTIVE', 'BLOCKED', 'CONTAMINATED'].map(s =>
      `<option value="${s}" ${s === gate.status ? 'selected' : ''}>${s}</option>`
    ).join('');
    const ownerOpts = ['Casey', 'Thomas Galla', 'Dev Team', 'Clay Martin'].map(o =>
      `<option value="${o}" ${o === gate.owner ? 'selected' : ''}>${o}</option>`
    ).join('');
    // Show version history
    const history = gate._version_history || [];
    const historyHtml = history.length > 0 ? `<div style="margin-top:12px;border-top:1px solid var(--ga-border);padding-top:12px;">
      <div style="font-size:12px;font-weight:600;color:var(--ga-navy);margin-bottom:6px;">Version History</div>
      ${history.slice(-5).reverse().map(h => `<div style="font-size:11px;color:var(--ga-muted);padding:2px 0;">${Components.formatDate(h.date)} — ${h.updater}: ${JSON.stringify(h.new_value?.status || h.new_value).replace(/"/g, '')}</div>`).join('')}
    </div>` : '';

    Components.showModal(Components.modal(`Edit Gate: ${gateName}`, `
      <div class="form-group"><label class="form-label">Status *</label><select class="form-select" id="gate-status">${statusOpts}</select></div>
      <div class="form-group"><label class="form-label">Owner</label><select class="form-select" id="gate-owner">${ownerOpts}</select></div>
      <div class="form-group"><label class="form-label">COD per Day</label><input class="form-input" id="gate-cod" value="${gate.cod_per_day || ''}"></div>
      <div class="form-group"><label class="form-label">Ticket Reference</label><input class="form-input" id="gate-ticket" value="${gate.ticket_ref || ''}"></div>
      ${historyHtml}
    `, { id: 'modal-gate', actions: [
      { label: 'Cancel', class: 'btn-ghost', onClick: "Components.closeModal('modal-gate')" },
      { label: 'Save Gate Status', class: 'btn-primary', onClick: `CommandCenter.saveGateEdit('${settingsKey}', '${gateName}')` }
    ]}));
  }

  function saveGateEdit(settingsKey, gateName) {
    const settings = Store.get('engine_settings') || {};
    const gate = settings[settingsKey];
    if (!gate) return;
    const oldStatus = gate.status;
    const newStatus = document.getElementById('gate-status')?.value;
    gate.status = newStatus;
    gate.owner = document.getElementById('gate-owner')?.value || gate.owner;
    gate.cod_per_day = document.getElementById('gate-cod')?.value || gate.cod_per_day;
    gate.ticket_ref = document.getElementById('gate-ticket')?.value || null;
    gate.last_updated = new Date().toISOString();
    gate.updated_by = 'Casey';
    gate._version_history = gate._version_history || [];
    gate._version_history.push({ date: new Date().toISOString(), updater: 'Casey', previous_value: { status: oldStatus }, new_value: { status: newStatus } });
    settings[settingsKey] = gate;
    Store.set('engine_settings', settings);
    Components.closeModal('modal-gate');
    Components.showToast(`${gateName} updated: ${oldStatus} → ${newStatus}.`, 'success');
    Events.log('engine_cmd_gate_click', { gate_name: gateName, gate_status: newStatus });
    if (oldStatus !== newStatus) {
      DecisionLog.addAuto({ domain: 'ops', decision: `Gate "${gateName}" status changed: ${oldStatus} → ${newStatus}`, reason: 'Manual gate update', owner: 'Casey' });
    }
    // Refresh topbar and page
    renderTopbar();
    render(document.getElementById('content-area'));
    updateNavBadges();
  }

  function renderQICPQITile(settings) {
    const signalClean = settings.conversion_signal_status;
    const isUnconfirmed = signalClean && signalClean.status !== 'CONFIRMED' && signalClean.status !== 'CLEAN';
    // Calculate from actual campaign metrics
    const campaigns = Store.get('avengineos_ppc_campaigns')?.campaigns || [];
    const active = campaigns.filter(c => c.status === 'active' && c.metrics);
    const totalQIs = active.reduce((sum, c) => sum + (c.metrics?.qis || 0), 0);
    const totalSpend = active.reduce((sum, c) => sum + (c.metrics?.spend || 0), 0);
    const blendedCPQI = totalQIs > 0 ? Math.round(totalSpend / totalQIs) : null;
    const hasMetrics = active.some(c => c.metrics?.qis != null);
    const dataSource = active.some(c => c.metrics?.source === 'windsor') ? 'windsor' : active.some(c => c.metrics?.source === 'manual') ? 'manual' : 'seed';

    return Components.kpiTile('QI + CPQI', hasMetrics ? `${totalQIs} QIs` : '—', {
      subtitle: hasMetrics ? `CPQI: ${blendedCPQI ? '$' + blendedCPQI : '—'} | Spend: ${Components.formatCurrency(totalSpend)} | Source: ${dataSource}` : 'Awaiting campaign metrics',
      confidence: !hasMetrics ? 'PENDING' : isUnconfirmed ? 'ESTIMATE' : 'CONFIRMED',
      delta: null,
      trend: null,
      topDriverLabel: 'Top Driver →',
      topDriverRoute: 'ppc'
    });
  }

  function renderAtRiskTile() {
    const mvs = Store.get('engine_mvs') || [];
    const now = new Date();
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const atRisk = mvs.filter(a => {
      if (!a.renewal_date) return false;
      const renewal = new Date(a.renewal_date);
      return renewal <= thirtyDays && (a.account_status === 'At Risk' || a.flag_priority === 1);
    });
    const hasMVS = mvs.length > 0;
    return Components.kpiTile('At-Risk Accounts (30d)', hasMVS ? atRisk.length.toString() : '0', {
      confidence: hasMVS ? 'CONFIRMED' : 'PENDING',
      subtitle: hasMVS ? (atRisk.length > 0 ? atRisk.map(a => a.broker_name).join(', ') : 'All accounts healthy') : 'MVS not populated',
      topDriverLabel: 'Top Driver →',
      topDriverRoute: 'monetization'
    });
  }

  function renderFeaturedLeakageTile() {
    const config = Store.get('avengineos_mon_featured_config');
    if (!config || !config.avg_featured_price_monthly) {
      return Components.kpiTile('Featured Fill Leakage', 'N/A', {
        confidence: 'PENDING',
        subtitle: 'Featured price not configured',
        topDriverLabel: 'Top Driver →',
        topDriverRoute: 'monetization'
      });
    }
    const unfilled = config.total_slots - config.filled_slots;
    const weeklyLeakage = Math.round(unfilled * config.avg_featured_price_monthly / 4.33);
    return Components.kpiTile('Featured Fill Leakage', Components.formatCurrency(weeklyLeakage) + '/wk', {
      confidence: 'ESTIMATE',
      subtitle: `${unfilled} unfilled of ${config.total_slots} slots`,
      topDriverLabel: 'Top Driver →',
      topDriverRoute: 'monetization'
    });
  }

  function renderOpportunityQueue() {
    const top10 = Opportunity.getTop(10);
    if (top10.length === 0) {
      return Components.emptyState('&#127919;', 'No opportunities scored. Upload listing CSV and confirm Windsor.ai connection to populate.', '', null);
    }

    const columns = [
      { key: 'score', label: 'Score', render: (v, row) => `<strong>${Opportunity.scoreDisplay(row)}</strong>` },
      { key: 'domain', label: 'Domain', render: (v) => Components.domainBadge(v) },
      { key: 'name', label: 'Diagnosis', render: (v) => `<span style="max-width:250px;display:inline-block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${v}</span>` },
      { key: 'action', label: 'Action', render: (v) => `<span style="max-width:200px;display:inline-block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${v}</span>` },
      { key: 'owner', label: 'Owner' },
      { key: 'cod', label: 'COD' },
      { key: 'status', label: 'Status', render: (v) => Components.badge(v, Components.statusColor(v)) }
    ];

    let html = Components.table(columns, top10, { id: 'cmd-opp-table', sortable: true, checkboxes: true });
    html += `<div style="display:flex;gap:10px;margin-top:12px;">
      <button class="btn btn-primary btn-sm" onclick="CommandCenter.bulkAssign()">Assign Selected</button>
      <a class="btn btn-ghost btn-sm" onclick="Router.navigate('opportunities')">View all opportunities →</a>
    </div>`;
    return html;
  }

  function renderDecisions() {
    const thisWeek = DecisionLog.getThisWeek();
    if (thisWeek.length === 0) {
      return Components.emptyState('&#128203;', "No decisions logged this week. Add the first decision or review the Decision Log for previous weeks.", 'Add Decision', 'CommandCenter.showAddDecision()');
    }
    const show = thisWeek.slice(0, 5);
    let html = '<div style="display:flex;flex-direction:column;gap:12px;">';
    show.forEach(d => {
      html += `<div class="decision-card">
        <div class="decision-card-header">${Components.domainBadge(d.domain)} <span class="decision-text">${d.decision}</span></div>
        <div class="decision-reason">${d.reason}</div>
        <div class="decision-meta">
          <span>Owner: ${d.owner}</span>
          <span>Expected: ${d.expected_outcome || '—'}</span>
          <span>${Components.formatDate(d.date)}</span>
        </div>
        ${d.outcome ? `<div style="margin-top:6px;font-size:12px;color:var(--ga-green-dark);">Outcome: ${d.outcome}</div>` : `<button class="btn btn-ghost btn-sm" style="margin-top:6px;" onclick="CommandCenter.addOutcome('${d.id}')">Add Outcome</button>`}
      </div>`;
    });
    html += '</div>';
    if (thisWeek.length > 5) {
      html += `<a class="btn btn-ghost btn-sm" style="margin-top:12px;" onclick="Router.navigate('decisions')">View all ${thisWeek.length} decisions →</a>`;
    }
    html += `<button class="btn btn-primary btn-sm" style="margin-top:12px;" onclick="CommandCenter.showAddDecision()">+ Add Decision</button>`;
    return html;
  }

  function bulkAssign() {
    const checked = document.querySelectorAll('#cmd-opp-table .row-checkbox:checked');
    if (checked.length === 0) { Components.showToast('Select items to assign.', 'error'); return; }
    const ids = Array.from(checked).map(cb => cb.value);
    const ownerHtml = Opportunity.OWNERS.map(o => `<option value="${o}">${o}</option>`).join('');
    Components.showModal(Components.modal('Assign Opportunities', `
      <div class="form-group">
        <label class="form-label">Assign ${ids.length} item(s) to:</label>
        <select class="form-select" id="bulk-owner">${ownerHtml}</select>
      </div>
    `, { id: 'modal-bulk-assign', actions: [
      { label: 'Cancel', class: 'btn-ghost', onClick: "Components.closeModal('modal-bulk-assign')" },
      { label: 'Assign', class: 'btn-primary', onClick: `CommandCenter.doBulkAssign()` }
    ]}));
    window._bulkIds = ids;
  }

  function doBulkAssign() {
    const owner = document.getElementById('bulk-owner')?.value;
    if (owner && window._bulkIds) {
      Opportunity.bulkAssign(window._bulkIds, owner);
      Components.closeModal('modal-bulk-assign');
      Components.showToast(`${window._bulkIds.length} items assigned to ${owner}.`, 'success');
      render(document.getElementById('content-area'));
      updateNavBadges();
    }
  }

  function showAddDecision() {
    const domainOpts = ['ppc', 'seo', 'listings', 'monetization'].map(d => `<option value="${d}">${d.toUpperCase()}</option>`).join('');
    const ownerOpts = Opportunity.OWNERS.map(o => `<option value="${o}">${o}</option>`).join('');
    Components.showModal(Components.modal('Add Decision', `
      <div class="form-group"><label class="form-label">Domain *</label><select class="form-select" id="dec-domain">${domainOpts}</select></div>
      <div class="form-group"><label class="form-label">Decision *</label><textarea class="form-textarea" id="dec-text" placeholder="What changed?"></textarea></div>
      <div class="form-group"><label class="form-label">Reason *</label><textarea class="form-textarea" id="dec-reason" placeholder="Why was this decision made?"></textarea></div>
      <div class="form-group"><label class="form-label">Owner *</label><select class="form-select" id="dec-owner">${ownerOpts}</select></div>
      <div class="form-group"><label class="form-label">Expected Outcome</label><input class="form-input" id="dec-outcome" placeholder="What metric should move?"></div>
      <div class="form-group"><label class="form-label"><input type="checkbox" id="dec-experiment"> This is an experiment</label></div>
      <div class="form-group" id="dec-stoploss-group" style="display:none"><label class="form-label">Stop-Loss (required for experiments) *</label><input class="form-input" id="dec-stoploss" placeholder="At what point does this get reversed?"></div>
    `, { id: 'modal-add-decision', actions: [
      { label: 'Cancel', class: 'btn-ghost', onClick: "Components.closeModal('modal-add-decision')" },
      { label: 'Save Decision', class: 'btn-primary', onClick: 'CommandCenter.saveDecision()' }
    ]}));
    // Toggle stop-loss field visibility
    setTimeout(() => {
      const cb = document.getElementById('dec-experiment');
      if (cb) cb.addEventListener('change', () => {
        document.getElementById('dec-stoploss-group').style.display = cb.checked ? '' : 'none';
      });
    }, 100);
  }

  function saveDecision() {
    const domain = document.getElementById('dec-domain')?.value;
    const text = document.getElementById('dec-text')?.value?.trim();
    const reason = document.getElementById('dec-reason')?.value?.trim();
    const owner = document.getElementById('dec-owner')?.value;
    const outcome = document.getElementById('dec-outcome')?.value?.trim();
    const isExp = document.getElementById('dec-experiment')?.checked;
    const stopLoss = document.getElementById('dec-stoploss')?.value?.trim();
    if (!text || !reason) { Components.showToast('Decision and Reason are required.', 'error'); return; }
    if (isExp && !stopLoss) { Components.showToast('Stop-loss is required for experiments.', 'error'); return; }
    DecisionLog.add({ domain, decision: text, reason, owner, expected_outcome: outcome, is_experiment: isExp, stop_loss: isExp ? stopLoss : null });
    Components.closeModal('modal-add-decision');
    Components.showToast('Decision logged.', 'success');
    render(document.getElementById('content-area'));
  }

  function addOutcome(id) {
    Components.showModal(Components.modal('Add Outcome', `
      <div class="form-group"><label class="form-label">What was the actual result?</label><textarea class="form-textarea" id="outcome-text" placeholder="Describe the outcome..."></textarea></div>
    `, { id: 'modal-outcome', actions: [
      { label: 'Cancel', class: 'btn-ghost', onClick: "Components.closeModal('modal-outcome')" },
      { label: 'Save', class: 'btn-primary', onClick: `CommandCenter.saveOutcome('${id}')` }
    ]}));
  }

  function saveOutcome(id) {
    const text = document.getElementById('outcome-text')?.value?.trim();
    if (!text) return;
    DecisionLog.updateOutcome(id, text);
    Components.closeModal('modal-outcome');
    Components.showToast('Outcome recorded.', 'success');
    render(document.getElementById('content-area'));
  }

  return { render, bulkAssign, doBulkAssign, showAddDecision, saveDecision, addOutcome, saveOutcome, showGateEdit, saveGateEdit };
})();
