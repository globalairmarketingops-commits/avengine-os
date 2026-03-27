/* =====================================================================
   AvEngineOS — Page 02: PPC Hub
   Paid Search Command Layer. Per Page_02_PPC_Hub_Spec_v1.0
   Three-part layout: A (Health) → B (Diagnostics) → C (Action Stack)
   ===================================================================== */

const PPCHub = (() => {

  function render(container) {
    const campaigns = Store.get('avengineos_ppc_campaigns')?.campaigns || [];
    const thresholds = Store.get('avengineos_ppc_cpqi_thresholds') || {};
    const governance = Store.get('avengineos_ppc_governance') || {};
    const scalingConfig = Store.get('avengineos_ppc_scaling_config') || {};
    const settings = Store.get('engine_settings') || {};
    const layer2Green = governance.layers && governance.layers[1]?.status === 'green';

    let html = '<div class="domain-page">';

    // ---- PART A: Domain Health ----
    html += '<div class="domain-part">';
    html += Components.partHeader('Part A', 'Domain Health — PPC');

    // Campaign Health Table (FR-PPC-001)
    html += '<h4 style="margin:12px 0 8px;font-size:14px;font-weight:600;color:var(--ga-navy);">Campaign Health Table</h4>';
    html += renderCampaignTable(campaigns, thresholds);

    // Signal Integrity Panel (FR-PPC-002)
    html += '<h4 style="margin:20px 0 8px;font-size:14px;font-weight:600;color:var(--ga-navy);">Signal Integrity</h4>';
    html += renderSignalPanel(settings);

    html += '</div>';

    // ---- PART B: Diagnostics ----
    html += '<div class="domain-part">';
    html += Components.partHeader('Part B', 'Diagnostics');

    // Governance Hierarchy (FR-PPC-003)
    html += '<h4 style="margin:12px 0 8px;font-size:14px;font-weight:600;color:var(--ga-navy);">PPC Governance Hierarchy</h4>';
    html += renderGovernance(governance);

    // Scaling Math (FR-PPC-004) — disabled when Layer 2 not green
    if (layer2Green) {
      html += '<h4 style="margin:20px 0 8px;font-size:14px;font-weight:600;color:var(--ga-navy);">Scaling Math</h4>';
      html += renderScalingMath(campaigns, thresholds, scalingConfig);
    } else {
      html += Components.alertBanner('Scaling Math disabled — Signal Integrity (Layer 2) is not green. <a onclick="Router.navigate(\'ppc\')" style="color:var(--ga-red);text-decoration:underline;">Fix tracking first.</a>', 'error');
    }

    // Auction Insights (FR-PPC-005)
    html += '<h4 style="margin:20px 0 8px;font-size:14px;font-weight:600;color:var(--ga-navy);">Auction Insights — Controller.com</h4>';
    html += renderAuctionInsights();

    html += '</div>';

    // ---- PART C: Action Stack ----
    html += '<div class="domain-part">';
    html += Components.partHeader('Part C', 'Action Stack');

    // PPC Opportunity Engine (FR-PPC-006)
    html += '<h4 style="margin:12px 0 8px;font-size:14px;font-weight:600;color:var(--ga-navy);">PPC Opportunities</h4>';
    html += renderPPCOpportunities();

    // Experiment Tracker (FR-PPC-007)
    html += '<h4 style="margin:20px 0 8px;font-size:14px;font-weight:600;color:var(--ga-navy);">Experiment Tracker</h4>';
    html += renderExperiments();

    // PPC Gaps Panel (FR-PPC-008)
    html += '<h4 style="margin:20px 0 8px;font-size:14px;font-weight:600;color:var(--ga-navy);">PPC Blockers</h4>';
    html += renderPPCGaps();

    html += '</div></div>';
    container.innerHTML = html;

    // Bind governance layer expand/collapse
    container.querySelectorAll('.gov-layer-header').forEach(h => {
      h.addEventListener('click', () => h.parentElement.classList.toggle('expanded'));
      h.addEventListener('keydown', (e) => { if (e.key === 'Enter') h.parentElement.classList.toggle('expanded'); });
    });

    Events.log('ppc_page_load', { campaigns_rendered: campaigns.filter(c => c.status === 'active').length, signal_status: layer2Green ? 'green' : 'red' });
  }

  function renderCampaignTable(campaigns, thresholds) {
    const columns = [
      { key: 'name', label: 'Campaign' },
      { key: 'daily_budget', label: 'Budget/Day', render: v => Components.formatCurrency(v) },
      { key: 'segment', label: 'Segment', render: v => Components.badge(v, 'blue') },
      { key: 'impressions', label: 'Impr.', render: v => v != null ? v.toLocaleString() : '—' },
      { key: 'clicks', label: 'Clicks', render: v => v ?? '—' },
      { key: 'ctr', label: 'CTR', render: v => v != null ? Components.formatPct(v) : '—' },
      { key: 'qis', label: 'QIs', render: v => v ?? '—' },
      { key: 'cpqi', label: 'CPQI', render: (v, row) => {
        if (v == null) return '<span class="confidence-tag confidence-pending">N/A</span>';
        const t = thresholds[row.segment];
        const cls = t ? (v <= t.target ? 'cpqi-green' : v <= t.ceiling ? 'cpqi-amber' : 'cpqi-red') : '';
        return `<span class="${cls}">${Components.formatCurrency(v)}</span>`;
      }},
      { key: 'status', label: 'Status', render: v => {
        if (v === 'on_hold') return Components.badge('ON HOLD', 'amber');
        return Components.badge(v, 'green');
      }}
    ];

    // Read persisted metrics from store (no random generation)
    const rows = campaigns.map(c => ({
      ...c,
      impressions: c.metrics?.impressions ?? null,
      clicks: c.metrics?.clicks ?? null,
      ctr: c.metrics?.ctr ?? null,
      qis: c.metrics?.qis ?? null,
      cpqi: c.metrics?.cpqi ?? null,
      _rowClass: c.status === 'on_hold' ? 'row-on-hold' : ''
    }));

    let html = Components.table(columns, rows, { id: 'ppc-campaign-table', sortable: true, emptyMessage: 'No campaigns configured.' });
    // Source indicator and manual update
    const anyWindsor = campaigns.some(c => c.metrics?.source === 'windsor');
    const sourceLabel = anyWindsor ? 'Windsor.ai' : campaigns.some(c => c.metrics?.source === 'manual') ? 'Manual Input' : 'Seed Data';
    html += `<div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;">
      <span style="font-size:11px;color:var(--ga-muted);">Data source: ${sourceLabel} ${Components.windsorDot('google_ads')}</span>
      <button class="btn btn-ghost btn-sm" onclick="PPCHub.showMetricsInput()">Update Campaign Metrics</button>
    </div>`;
    return html;
  }

  function showMetricsInput() {
    const campaigns = (Store.get('avengineos_ppc_campaigns')?.campaigns || []).filter(c => c.status === 'active');
    const campOpts = campaigns.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    const first = campaigns[0];
    Components.showModal(Components.modal('Update Campaign Metrics', `
      <div class="form-group"><label class="form-label">Campaign *</label><select class="form-select" id="met-campaign" onchange="PPCHub.loadMetricsForCampaign()">${campOpts}</select></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div class="form-group"><label class="form-label">Impressions</label><input class="form-input" id="met-impressions" type="number" value="${first?.metrics?.impressions || ''}"></div>
        <div class="form-group"><label class="form-label">Clicks</label><input class="form-input" id="met-clicks" type="number" value="${first?.metrics?.clicks || ''}"></div>
        <div class="form-group"><label class="form-label">QIs (Qualified Inquiries)</label><input class="form-input" id="met-qis" type="number" value="${first?.metrics?.qis || ''}"></div>
        <div class="form-group"><label class="form-label">Spend ($)</label><input class="form-input" id="met-spend" type="number" step="0.01" value="${first?.metrics?.spend || ''}"></div>
      </div>
      <div style="margin-top:8px;font-size:11px;color:var(--ga-muted);">CTR and CPQI are auto-calculated from these inputs.</div>
      <div class="form-group" style="margin-top:12px;"><label class="form-label">Date Range</label>
        <select class="form-select" id="met-range"><option value="7d">Last 7 Days</option><option value="14d">Last 14 Days</option><option value="30d">Last 30 Days</option></select>
      </div>
    `, { id: 'modal-metrics', actions: [
      { label: 'Cancel', class: 'btn-ghost', onClick: "Components.closeModal('modal-metrics')" },
      { label: 'Save Metrics', class: 'btn-primary', onClick: 'PPCHub.saveMetrics()' }
    ]}));
  }

  function loadMetricsForCampaign() {
    const campId = document.getElementById('met-campaign')?.value;
    const campaigns = Store.get('avengineos_ppc_campaigns')?.campaigns || [];
    const c = campaigns.find(x => x.id === campId);
    if (!c) return;
    document.getElementById('met-impressions').value = c.metrics?.impressions || '';
    document.getElementById('met-clicks').value = c.metrics?.clicks || '';
    document.getElementById('met-qis').value = c.metrics?.qis || '';
    document.getElementById('met-spend').value = c.metrics?.spend || '';
  }

  function saveMetrics() {
    const campId = document.getElementById('met-campaign')?.value;
    const impressions = parseInt(document.getElementById('met-impressions')?.value) || 0;
    const clicks = parseInt(document.getElementById('met-clicks')?.value) || 0;
    const qis = parseInt(document.getElementById('met-qis')?.value) || 0;
    const spend = parseFloat(document.getElementById('met-spend')?.value) || 0;
    const dateRange = document.getElementById('met-range')?.value || '7d';

    const ctr = impressions > 0 ? parseFloat((clicks / impressions * 100).toFixed(1)) : 0;
    const cpqi = qis > 0 ? Math.round(spend / qis) : null;

    const data = Store.get('avengineos_ppc_campaigns');
    if (!data?.campaigns) return;
    const camp = data.campaigns.find(c => c.id === campId);
    if (!camp) return;

    camp.metrics = { impressions, clicks, ctr, qis, cpqi, spend, date_range: dateRange, last_updated: new Date().toISOString(), source: 'manual' };
    Store.set('avengineos_ppc_campaigns', data);

    Components.closeModal('modal-metrics');
    Components.showToast(`${camp.name} metrics updated: ${impressions} impr, ${clicks} clicks, ${qis} QIs, CPQI ${cpqi ? '$' + cpqi : 'N/A'}.`, 'success');
    Events.log('ppc_metrics_manual_update', { campaign: campId, impressions, clicks, qis, cpqi });
    DecisionLog.addAuto({ domain: 'ppc', decision: `Manual metrics update: ${camp.name}`, reason: `${impressions} impr, ${clicks} clicks, ${qis} QIs, $${spend} spend`, owner: 'Casey' });
    render(document.getElementById('content-area'));
  }

  function renderSignalPanel(settings) {
    const actions = [
      { name: 'Form Submission', status: settings.conversion_signal_status?.status || 'UNCONFIRMED', type: 'T1' },
      { name: 'Phone Call (90s+)', status: settings.call_tracking_active?.status || 'NOT_ACTIVE', type: 'T4' },
      { name: 'Spec/OpCost Download', status: 'NOT_CONFIRMED', type: 'T2' },
      { name: 'Call-Click', status: 'BEING_REPLACED', type: 'T0', note: 'Being replaced — do not count as QI' },
      { name: 'BrokerNet Contact Form', status: 'NOT_CONFIRMED', type: 'T1' }
    ];
    let html = '<div class="row-grid row-grid-5">';
    actions.forEach(a => {
      const statusDisplay = a.status.replace(/_/g, ' ');
      html += Components.statusCard(a.name, statusDisplay, {
        owner: a.type,
        cod: a.note || '',
        onClick: `Events.log('ppc_signal_action_click', {action_name:'${a.name}', current_status:'${a.status}'})`
      });
    });
    html += '</div>';
    return html;
  }

  function renderGovernance(governance) {
    const layers = governance.layers || [];
    let html = '';
    layers.forEach((layer, i) => {
      const blocked = i > 0 && layers.slice(0, i).some(l => l.status === 'red');
      const dot = blocked ? 'red' : layer.status;
      html += `<div class="gov-layer" tabindex="0">
        <div class="gov-layer-header" role="button" aria-expanded="false">
          <span class="gov-layer-num">L${layer.id}</span>
          <span class="status-dot status-dot-${dot}"></span>
          <span class="gov-layer-name">${layer.name}</span>
          ${blocked ? '<span class="gov-blocked">Blocked by Layer ' + layers.findIndex(l => l.status === 'red') + 1 + '</span>' : ''}
          <span style="margin-left:auto;font-size:11px;color:var(--ga-muted);">&#9662;</span>
        </div>
        <div class="gov-layer-body">
          ${blocked ? `<p>This layer is blocked because Layer ${layers.findIndex(l => l.status === 'red') + 1} (${layers.find(l => l.status === 'red')?.name}) has not passed. Resolve upstream layers first.</p>` :
            layer.status === 'red' ? `<p style="color:var(--ga-red);font-weight:600;">FAILING — ${getLayerDiagnosis(layer.id)}</p>` :
            layer.status === 'green' ? '<p style="color:var(--ga-green-dark);font-weight:600;">PASSING</p>' :
            `<p style="color:#92600A;font-weight:600;">WARNING — Review required</p>`}
          ${!layer.auto ? `<p style="margin-top:6px;font-size:11px;color:var(--ga-muted);">Manual status — set by Casey ${layer.override ? '(overridden ' + Components.formatDate(layer.override.at) + ': ' + layer.override.reason + ')' : ''}</p><button class="btn btn-ghost btn-sm" style="margin-top:6px;" onclick="event.stopPropagation();PPCHub.toggleGovernanceOverride(${layer.id})">Override Status</button>` : '<p style="margin-top:6px;font-size:11px;color:var(--ga-muted);">Automated from data</p>'}
        </div>
      </div>`;
    });
    return html;
  }

  function getLayerDiagnosis(layerId) {
    const diagnoses = {
      1: 'CPQI not yet confirmed against segment thresholds. Conversion signal unconfirmed.',
      2: 'Conversion actions not confirmed clean. Call-click being replaced. Form submission unverified.',
      3: 'Lead quality scoring not yet established. QI de-dupe rules pending CRM.',
      4: 'Campaign structure review pending. Ad group architecture not audited.',
      5: 'Signal contaminated — scaling math disabled.',
      6: 'Portfolio allocation not defined. Budget mix strategy pending.',
      7: 'No active experiments — available when Layers 1-6 pass.'
    };
    return diagnoses[layerId] || 'Status unknown.';
  }

  function renderScalingMath(campaigns, thresholds, config) {
    const active = campaigns.filter(c => c.status === 'active');
    if (active.length === 0) return Components.emptyState('&#128200;', 'No active campaigns for scaling projections.', '', null);
    let html = '<div class="row-grid row-grid-3">';
    active.forEach(c => {
      const tiers = config.projection_tiers || [2, 5, 10];
      const baseCPQI = c.metrics?.cpqi || 45;
      html += `<div class="ga-card" style="padding:16px;">
        <h5 style="font-size:13px;font-weight:700;color:var(--ga-navy);margin-bottom:12px;">${c.name}</h5>
        <table style="width:100%;font-size:12px;"><thead><tr><th style="text-align:left;padding:4px;">Tier</th><th>Budget</th><th>Proj. CPQI</th><th>Proj. QI/day</th></tr></thead><tbody>`;
      tiers.forEach(t => {
        const projBudget = c.daily_budget * t;
        const degradation = Math.pow(1 + config.degradation_rate, Math.log2(t));
        const projCPQI = Math.round(baseCPQI * degradation);
        const projQI = projBudget > 0 && projCPQI > 0 ? (projBudget / projCPQI).toFixed(1) : '—';
        const ceiling = thresholds[c.segment]?.ceiling || 999;
        const cls = projCPQI > ceiling ? 'cpqi-red' : projCPQI > (thresholds[c.segment]?.target || 45) ? 'cpqi-amber' : 'cpqi-green';
        html += `<tr><td style="padding:4px;">${t}x</td><td>${Components.formatCurrency(projBudget)}</td><td class="${cls}">${Components.formatCurrency(projCPQI)}</td><td>${projQI}</td></tr>`;
      });
      html += '</tbody></table></div>';
    });
    html += '</div>';
    return html;
  }

  function renderAuctionInsights() {
    const auctionData = Store.get('avengineos_ppc_auction_insights') || {};
    const hasData = auctionData.overlap_rate != null;
    return `<div class="ga-card" style="padding:16px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <span style="font-size:13px;font-weight:600;color:var(--ga-navy);">Controller.com Competitive Scorecard</span>
        <button class="btn btn-ghost btn-sm" onclick="PPCHub.showAuctionInput()">Update</button>
      </div>
      <div class="row-grid row-grid-4">
        ${Components.kpiTile('Overlap Rate', hasData ? auctionData.overlap_rate + '%' : '—', { confidence: hasData ? 'CONFIRMED' : 'PENDING', subtitle: hasData ? 'Last: ' + Components.formatDate(auctionData.last_updated) : 'Manual input required' })}
        ${Components.kpiTile('IS Delta', hasData ? (auctionData.is_delta > 0 ? '+' : '') + auctionData.is_delta + '%' : '—', { confidence: hasData ? 'CONFIRMED' : 'PENDING' })}
        ${Components.kpiTile('Position Above Rate', hasData ? auctionData.position_above + '%' : '—', { confidence: hasData ? 'CONFIRMED' : 'PENDING' })}
        ${Components.kpiTile('Outranking Share', hasData ? auctionData.outranking_share + '%' : '—', { confidence: hasData ? 'CONFIRMED' : 'PENDING' })}
      </div>
    </div>`;
  }

  function showAuctionInput() {
    const data = Store.get('avengineos_ppc_auction_insights') || {};
    Components.showModal(Components.modal('Update Auction Insights — Controller.com', `
      <p style="font-size:12px;color:var(--ga-muted);margin-bottom:16px;">Enter from Google Ads > Campaigns > Auction Insights report</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div class="form-group"><label class="form-label">Overlap Rate (%)</label><input class="form-input" id="ai-overlap" type="number" step="0.1" value="${data.overlap_rate || ''}"></div>
        <div class="form-group"><label class="form-label">Impression Share Delta (%)</label><input class="form-input" id="ai-is-delta" type="number" step="0.1" value="${data.is_delta || ''}"></div>
        <div class="form-group"><label class="form-label">Position Above Rate (%)</label><input class="form-input" id="ai-pos-above" type="number" step="0.1" value="${data.position_above || ''}"></div>
        <div class="form-group"><label class="form-label">Outranking Share (%)</label><input class="form-input" id="ai-outranking" type="number" step="0.1" value="${data.outranking_share || ''}"></div>
      </div>
    `, { id: 'modal-auction', actions: [
      { label: 'Cancel', class: 'btn-ghost', onClick: "Components.closeModal('modal-auction')" },
      { label: 'Save', class: 'btn-primary', onClick: 'PPCHub.saveAuctionInput()' }
    ]}));
  }

  function saveAuctionInput() {
    const data = {
      overlap_rate: parseFloat(document.getElementById('ai-overlap')?.value) || null,
      is_delta: parseFloat(document.getElementById('ai-is-delta')?.value) || null,
      position_above: parseFloat(document.getElementById('ai-pos-above')?.value) || null,
      outranking_share: parseFloat(document.getElementById('ai-outranking')?.value) || null,
      last_updated: new Date().toISOString()
    };
    Store.set('avengineos_ppc_auction_insights', data);
    Components.closeModal('modal-auction');
    Components.showToast('Auction insights updated.', 'success');
    Events.log('ppc_auction_insights_update', data);
    render(document.getElementById('content-area'));
  }

  function renderPPCOpportunities() {
    const opps = Opportunity.getByDomain('ppc');
    if (opps.length === 0) return Components.emptyState('&#127919;', 'All PPC metrics within thresholds. No action required.', '', null);
    const columns = [
      { key: 'score', label: 'Score', render: (v, row) => `<strong>${Opportunity.scoreDisplay(row)}</strong>` },
      { key: 'name', label: 'Diagnosis' },
      { key: 'action', label: 'Action' },
      { key: 'owner', label: 'Owner' },
      { key: 'cod', label: 'COD' },
      { key: 'status', label: 'Status', render: v => Components.badge(v, Components.statusColor(v)) },
      { key: 'id', label: 'Action', render: (v, row) => row.status === 'Open' ? `<button class="btn btn-primary btn-sm" onclick="PPCHub.showPathwaySelector('${v}')">Select Pathway</button>` : '—' }
    ];
    return Components.table(columns, opps, { id: 'ppc-opp-table', sortable: true });
  }

  function renderExperiments() {
    const data = Store.get('avengineos_ppc_experiments') || {};
    const experiments = data.experiments || [];
    if (experiments.length === 0) {
      return Components.emptyState('&#128300;', 'No active experiments. Create one from an opportunity.', 'Create Experiment', 'PPCHub.showCreateExperiment()');
    }
    let html = '';
    experiments.forEach(exp => {
      html += `<div class="experiment-card">
        <div class="experiment-name">${exp.name} ${Components.badge(exp.status, exp.status === 'paused' ? 'red' : 'green')}</div>
        <div class="experiment-meta">Campaign: ${exp.campaign} | Stop-loss: ${exp.stop_loss?.metric} ${exp.stop_loss?.threshold} for ${exp.stop_loss?.consecutive_days}d | Running: ${exp.start_date || '—'}</div>
      </div>`;
    });
    return html;
  }

  function renderPPCGaps() {
    const gaps = Gaps.getByDomain('ppc');
    if (gaps.length === 0) return Components.emptyState('&#9989;', 'No PPC blockers. All systems operational.', '', null);
    const columns = [
      { key: 'description', label: 'Gap' },
      { key: 'status', label: 'Status', render: v => Components.badge(v, Components.statusColor(v)) },
      { key: 'cod', label: 'COD' },
      { key: 'owner', label: 'Owner' },
      { key: 'ticket_ref', label: 'Ticket', render: v => v || '—' }
    ];
    return Components.table(columns, gaps, { id: 'ppc-gaps-table' });
  }

  function showCreateExperiment() {
    const campaigns = (Store.get('avengineos_ppc_campaigns')?.campaigns || []).filter(c => c.status === 'active');
    const campOpts = campaigns.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    const metricOpts = ['cpqi', 'cvr', 'ctr'].map(m => `<option value="${m}">${m.toUpperCase()}</option>`).join('');
    Components.showModal(Components.modal('Create PPC Experiment', `
      <div class="form-group"><label class="form-label">Experiment Name *</label><input class="form-input" id="exp-name" placeholder="e.g. Cessna RSA headline test"></div>
      <div class="form-group"><label class="form-label">Campaign *</label><select class="form-select" id="exp-campaign">${campOpts}</select></div>
      <div class="form-group"><label class="form-label">Hypothesis *</label><textarea class="form-textarea" id="exp-hypothesis" placeholder="If we change X, then Y will improve by Z..."></textarea></div>
      <div class="form-group"><label class="form-label">Stop-Loss Metric *</label><select class="form-select" id="exp-metric">${metricOpts}</select></div>
      <div class="form-group"><label class="form-label">Stop-Loss Threshold *</label><input class="form-input" id="exp-threshold" type="number" placeholder="e.g. 135 (3x CPQI target)"></div>
      <div class="form-group"><label class="form-label">Consecutive Days to Trigger *</label><input class="form-input" id="exp-days" type="number" value="7" min="1" max="30"></div>
    `, { id: 'modal-exp', actions: [
      { label: 'Cancel', class: 'btn-ghost', onClick: "Components.closeModal('modal-exp')" },
      { label: 'Create Experiment', class: 'btn-primary', onClick: 'PPCHub.saveExperiment()' }
    ]}));
  }

  function saveExperiment() {
    const name = document.getElementById('exp-name')?.value?.trim();
    const campaign = document.getElementById('exp-campaign')?.value;
    const hypothesis = document.getElementById('exp-hypothesis')?.value?.trim();
    const metric = document.getElementById('exp-metric')?.value;
    const threshold = parseFloat(document.getElementById('exp-threshold')?.value);
    const days = parseInt(document.getElementById('exp-days')?.value) || 7;
    if (!name || !hypothesis || !threshold) { Components.showToast('All fields required.', 'error'); return; }

    // Check max 3 per campaign
    const data = Store.get('avengineos_ppc_experiments') || { experiments: [] };
    const activeForCampaign = data.experiments.filter(e => e.campaign === campaign && e.status === 'active').length;
    if (activeForCampaign >= 3) { Components.showToast('Max 3 concurrent experiments per campaign.', 'error'); return; }

    data.experiments.push({
      id: 'EXP-PPC-' + Date.now().toString(36),
      name, campaign, hypothesis,
      start_date: new Date().toISOString(),
      stop_loss: { metric, threshold, consecutive_days: days },
      status: 'active', outcome: null, paused_reason: null
    });
    data.version = (data.version || 0) + 1;
    Store.set('avengineos_ppc_experiments', data);
    Components.closeModal('modal-exp');
    Components.showToast(`Experiment "${name}" created with stop-loss: ${metric.toUpperCase()} > ${threshold} for ${days}d.`, 'success');
    Events.log('ppc_experiment_create', { experiment_name: name, campaign, stop_loss_threshold: threshold });
    DecisionLog.addAuto({ domain: 'ppc', decision: `Created experiment: ${name}`, reason: hypothesis, owner: 'Casey', expected_outcome: `Validate hypothesis within stop-loss bounds`, stop_loss: `${metric.toUpperCase()} > ${threshold} for ${days} consecutive days` });
    render(document.getElementById('content-area'));
  }

  function showPathwaySelector(oppId) {
    const pathways = [
      { id: 'P1', name: 'Fix conversion tracking', fields: ['Action items', 'Expected resolution date'] },
      { id: 'P2', name: 'Pause and restructure', fields: ['Campaigns affected', 'New structure'] },
      { id: 'P3', name: 'Keyword expansion', fields: ['Target keywords', 'Estimated volume'] },
      { id: 'P4', name: 'Negative keyword build', fields: ['Terms to negate', 'Estimated savings'] },
      { id: 'P5', name: 'Bid strategy adjustment', fields: ['Current strategy', 'Proposed change'] },
      { id: 'P6', name: 'Ad copy test', fields: ['Current copy', 'Test variant'] },
      { id: 'P7', name: 'Landing page alignment', fields: ['Current LP', 'Proposed change'] },
      { id: 'P8', name: 'Audience layering', fields: ['Audience type', 'Expected impact'] },
      { id: 'P9', name: 'Budget reallocation', fields: ['From campaign', 'To campaign', 'Amount'] },
      { id: 'P10', name: 'New campaign build', fields: ['Category', 'Budget', 'Keywords'] }
    ];
    const pathOpts = pathways.map(p => `<option value="${p.id}">${p.id}: ${p.name}</option>`).join('');
    Components.showModal(Components.modal('Select Pathway', `
      <div class="form-group"><label class="form-label">PPC Governance Pathway *</label><select class="form-select" id="pathway-select" onchange="PPCHub.updatePathwayFields()">${pathOpts}</select></div>
      <div id="pathway-fields"></div>
      <div class="form-group"><label class="form-label">Notes</label><textarea class="form-textarea" id="pathway-notes" placeholder="Additional context..."></textarea></div>
    `, { id: 'modal-pathway', actions: [
      { label: 'Cancel', class: 'btn-ghost', onClick: "Components.closeModal('modal-pathway')" },
      { label: 'Apply Pathway', class: 'btn-primary', onClick: `PPCHub.applyPathway('${oppId}')` }
    ]}));
    window._pathways = pathways;
    setTimeout(() => PPCHub.updatePathwayFields(), 50);
  }

  function updatePathwayFields() {
    const selected = document.getElementById('pathway-select')?.value;
    const pathway = (window._pathways || []).find(p => p.id === selected);
    const container = document.getElementById('pathway-fields');
    if (!container || !pathway) return;
    container.innerHTML = pathway.fields.map((f, i) =>
      `<div class="form-group"><label class="form-label">${f} *</label><input class="form-input" id="pf-${i}" placeholder="${f}"></div>`
    ).join('');
  }

  function applyPathway(oppId) {
    const pathway = document.getElementById('pathway-select')?.value;
    const notes = document.getElementById('pathway-notes')?.value?.trim();
    Opportunity.updateStatus(oppId, 'In Progress');
    Components.closeModal('modal-pathway');
    Components.showToast(`Pathway ${pathway} applied. Opportunity moved to In Progress.`, 'success');
    Events.log('ppc_opportunity_action', { item_id: oppId, pathway, action_taken: 'pathway_applied' });
    DecisionLog.addAuto({ domain: 'ppc', decision: `Applied ${pathway} to opportunity ${oppId}`, reason: notes || `Pathway ${pathway} selected`, owner: 'Casey' });
    render(document.getElementById('content-area'));
    updateNavBadges();
  }

  function toggleGovernanceOverride(layerId) {
    const governance = Store.get('avengineos_ppc_governance') || {};
    const layer = governance.layers?.find(l => l.id === layerId);
    if (!layer || layer.auto) { Components.showToast('Automated layers cannot be manually overridden.', 'error'); return; }
    const statusOpts = ['red', 'yellow', 'green'].map(s => `<option value="${s}" ${s === layer.status ? 'selected' : ''}>${s.toUpperCase()}</option>`).join('');
    Components.showModal(Components.modal(`Override Layer ${layerId}: ${layer.name}`, `
      <div class="form-group"><label class="form-label">New Status *</label><select class="form-select" id="gov-status">${statusOpts}</select></div>
      <div class="form-group"><label class="form-label">Reason (required) *</label><textarea class="form-textarea" id="gov-reason" placeholder="Why is this override justified?"></textarea></div>
    `, { id: 'modal-gov-override', actions: [
      { label: 'Cancel', class: 'btn-ghost', onClick: "Components.closeModal('modal-gov-override')" },
      { label: 'Apply Override', class: 'btn-primary', onClick: `PPCHub.doGovernanceOverride(${layerId})` }
    ]}));
  }

  function doGovernanceOverride(layerId) {
    const newStatus = document.getElementById('gov-status')?.value;
    const reason = document.getElementById('gov-reason')?.value?.trim();
    if (!reason) { Components.showToast('Reason is required for governance overrides.', 'error'); return; }
    const governance = Store.get('avengineos_ppc_governance') || {};
    const layer = governance.layers?.find(l => l.id === layerId);
    if (!layer) return;
    const oldStatus = layer.status;
    layer.status = newStatus;
    layer.override = { by: 'Casey', at: new Date().toISOString(), reason };
    governance.last_updated = new Date().toISOString();
    Store.set('avengineos_ppc_governance', governance);
    Components.closeModal('modal-gov-override');
    Components.showToast(`Layer ${layerId} overridden: ${oldStatus} → ${newStatus}.`, 'success');
    Events.log('ppc_governance_override', { layer_number: layerId, previous_status: oldStatus, new_status: newStatus, reason });
    DecisionLog.addAuto({ domain: 'ppc', decision: `Governance Layer ${layerId} (${layer.name}) overridden: ${oldStatus} → ${newStatus}`, reason, owner: 'Casey' });
    render(document.getElementById('content-area'));
  }

  return { render, showCreateExperiment, saveExperiment, showPathwaySelector, updatePathwayFields, applyPathway, toggleGovernanceOverride, doGovernanceOverride, showMetricsInput, loadMetricsForCampaign, saveMetrics, showAuctionInput, saveAuctionInput };
})();
