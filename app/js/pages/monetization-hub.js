/* =====================================================================
   AvEngineOS — Page 05: Monetization Hub
   Revenue Accountability & Advertiser Retention
   Per Page_05_Monetization_Hub_Spec_v1.0
   ===================================================================== */

const MonetizationHub = (() => {

  function render(container) {
    const mvs = Store.get('engine_mvs') || [];
    const featuredConfig = Store.get('avengineos_mon_featured_config') || {};
    const mvsStale = Store.isStale('engine_mvs_last_updated', 7);

    let html = '<div class="domain-page">';

    if (mvsStale && mvs.length > 0) {
      html += Components.alertBanner('MVS data unverified — last updated more than 7 days ago. Update accounts before making decisions.', 'warning');
    }

    // ---- PART A: Domain Health ----
    html += '<div class="domain-part">';
    html += Components.partHeader('Part A', 'Domain Health — Monetization');

    // Revenue KPIs
    html += '<div class="row-grid row-grid-4">';
    const totalMRR = mvs.reduce((sum, a) => sum + (a.listings_mrr || 0) + (a.featured_mrr || 0) + (a.display_mrr || 0) + (a.brokernet_mrr || 0) + (a.sponsorship_mrr || 0) + (a.fbo_mrr || 0) + (a.event_mrr || 0), 0);
    const activeCount = mvs.filter(a => a.account_status === 'Active').length;
    const arpa = activeCount > 0 ? Math.round(totalMRR / activeCount) : 0;
    const atRisk = mvs.filter(a => a.account_status === 'At Risk' || a.flag_priority === 1);

    html += Components.kpiTile('Total MRR', Components.formatCurrency(totalMRR), { confidence: mvs.length > 0 ? 'CONFIRMED' : 'PENDING', subtitle: `${mvs.length} accounts` });
    html += Components.kpiTile('ARPA', Components.formatCurrency(arpa), { confidence: mvs.length > 0 ? 'ESTIMATE' : 'PENDING', subtitle: `${activeCount} active accounts` });
    html += Components.kpiTile('At-Risk Accounts', atRisk.length.toString(), { confidence: 'CONFIRMED', subtitle: atRisk.map(a => a.broker_name).join(', ') || 'None' });

    // Featured Fill Rate Gauge
    const fillPct = featuredConfig.total_slots > 0 ? Math.round(featuredConfig.filled_slots / featuredConfig.total_slots * 100) : 0;
    const unfilled = (featuredConfig.total_slots || 0) - (featuredConfig.filled_slots || 0);
    const leakage = Math.round(unfilled * (featuredConfig.avg_featured_price_monthly || 0) / 4.33);
    html += `<div class="ga-card" style="padding:16px;display:flex;align-items:center;gap:20px;">
      ${Components.gauge(fillPct, 100, { label: 'Fill Rate', thresholds: { red: 60, amber: 80 } })}
      <div>
        <div style="font-size:13px;font-weight:600;color:var(--ga-navy);">Featured Fill Rate</div>
        <div style="font-size:12px;color:var(--ga-charcoal);">${featuredConfig.filled_slots || 0} / ${featuredConfig.total_slots || 0} slots</div>
        <div style="font-size:12px;color:var(--ga-red);font-weight:600;">Leakage: ${Components.formatCurrency(leakage)}/week</div>
      </div>
    </div>`;
    html += '</div>';

    // Revenue by Stream
    html += '<h4 style="margin:20px 0 8px;font-size:14px;font-weight:600;color:var(--ga-navy);">Revenue by Stream</h4>';
    html += renderRevenueByStream(mvs);

    html += '</div>';

    // ---- PART B: Diagnostics ----
    html += '<div class="domain-part">';
    html += Components.partHeader('Part B', 'Diagnostics');

    // Churn Risk Monitor (US-MON-002)
    html += '<h4 style="margin:12px 0 8px;font-size:14px;font-weight:600;color:var(--ga-navy);">Churn Risk Monitor</h4>';
    html += renderChurnMonitor(mvs);

    // Renewal Calendar (US-MON-005)
    html += '<h4 style="margin:20px 0 8px;font-size:14px;font-weight:600;color:var(--ga-navy);">Renewal Pipeline — 30/60/90 Day View</h4>';
    html += renderRenewalPipeline(mvs);

    // ARPA Growth Levers (US-MON-006)
    html += '<h4 style="margin:20px 0 8px;font-size:14px;font-weight:600;color:var(--ga-navy);">ARPA Growth Levers</h4>';
    html += renderGrowthLevers(mvs);

    html += '</div>';

    // ---- PART C: Action Stack ----
    html += '<div class="domain-part">';
    html += Components.partHeader('Part C', 'Action Stack');

    // MVS Input (US-MON-009)
    html += '<h4 style="margin:12px 0 8px;font-size:14px;font-weight:600;color:var(--ga-navy);">Advertiser Accounts (MVS)</h4>';
    html += renderMVSTable(mvs);

    // Monetization Opportunities
    html += '<h4 style="margin:20px 0 8px;font-size:14px;font-weight:600;color:var(--ga-navy);">Monetization Opportunities</h4>';
    const monOpps = Opportunity.getByDomain('monetization');
    if (monOpps.length === 0) {
      html += Components.emptyState('&#127919;', 'No monetization opportunities.', '', null);
    } else {
      const cols = [
        { key: 'score', label: 'Score', render: (v, row) => `<strong>${Opportunity.scoreDisplay(row)}</strong>` },
        { key: 'name', label: 'Opportunity' },
        { key: 'owner', label: 'Owner' },
        { key: 'cod', label: 'COD' },
        { key: 'status', label: 'Status', render: v => Components.badge(v, Components.statusColor(v)) }
      ];
      html += Components.table(cols, monOpps, { id: 'mon-opp-table', sortable: true });
    }

    // Monetization Gaps
    html += '<h4 style="margin:20px 0 8px;font-size:14px;font-weight:600;color:var(--ga-navy);">Monetization Gaps</h4>';
    const monGaps = Gaps.getByDomain('monetization');
    if (monGaps.length > 0) {
      const gapCols = [
        { key: 'description', label: 'Gap' },
        { key: 'status', label: 'Status', render: v => Components.badge(v, Components.statusColor(v)) },
        { key: 'cod', label: 'COD' },
        { key: 'owner', label: 'Owner' }
      ];
      html += Components.table(gapCols, monGaps, { id: 'mon-gaps-table' });
    } else {
      html += Components.emptyState('&#9989;', 'No monetization gaps.', '', null);
    }

    html += '</div></div>';
    container.innerHTML = html;
    Events.log('mon_dashboard_view', { account_count: mvs.length, total_mrr: totalMRR });
  }

  function renderRevenueByStream(mvs) {
    const streams = { listings: 0, featured: 0, display: 0, brokernet: 0, sponsorship: 0, fbo: 0, event: 0 };
    mvs.forEach(a => {
      streams.listings += a.listings_mrr || 0;
      streams.featured += a.featured_mrr || 0;
      streams.display += a.display_mrr || 0;
      streams.brokernet += a.brokernet_mrr || 0;
      streams.sponsorship += a.sponsorship_mrr || 0;
      streams.fbo += a.fbo_mrr || 0;
      streams.event += a.event_mrr || 0;
    });
    const total = Object.values(streams).reduce((s, v) => s + v, 0);
    const columns = [
      { key: 'stream', label: 'Revenue Stream' },
      { key: 'mrr', label: 'MRR', render: v => Components.formatCurrency(v) },
      { key: 'pct', label: '% of Total', render: v => Components.formatPct(v) },
      { key: 'bar', label: 'Distribution', render: v => `<div style="background:var(--ga-off-white);border-radius:4px;height:12px;width:100%;"><div style="background:var(--ga-blue);border-radius:4px;height:100%;width:${v}%;"></div></div>` }
    ];
    const rows = Object.entries(streams).map(([stream, mrr]) => ({
      stream: stream.charAt(0).toUpperCase() + stream.slice(1),
      mrr,
      pct: total > 0 ? (mrr / total * 100) : 0,
      bar: total > 0 ? (mrr / total * 100) : 0
    })).sort((a, b) => b.mrr - a.mrr);
    return Components.table(columns, rows, { id: 'mon-revenue-table', sortable: true });
  }

  function renderChurnMonitor(mvs) {
    const atRisk = mvs.filter(a => a.account_status === 'At Risk' || a.flag_priority === 1);
    if (atRisk.length === 0) return Components.emptyState('&#9989;', 'All accounts healthy. No at-risk flags.', '', null);
    const columns = [
      { key: 'broker_name', label: 'Account' },
      { key: 'mrr_total', label: 'Revenue at Risk', render: v => Components.formatCurrency(v) },
      { key: 'signal', label: 'Primary Signal' },
      { key: 'renewal_date', label: 'Renewal Date', render: v => Components.formatDate(v) },
      { key: 'flag_priority', label: 'Priority', render: v => v === 1 ? `<span class="ga-badge ga-badge-red">IMMEDIATE ATTENTION</span>` : Components.badge('At Risk', 'amber') },
      { key: 'owner', label: 'Owner', render: () => 'Ian' }
    ];
    const rows = atRisk.map(a => ({
      ...a,
      mrr_total: (a.listings_mrr || 0) + (a.featured_mrr || 0) + (a.display_mrr || 0) + (a.brokernet_mrr || 0),
      signal: a.flag_priority === 1 ? 'At-risk broker — Prime Directive #2' : 'Declining activity',
      owner: 'Ian'
    }));
    return Components.table(columns, rows, { id: 'mon-churn-table', sortable: true });
  }

  function renderRenewalPipeline(mvs) {
    const now = new Date();
    const groups = { '30d': [], '60d': [], '90d': [] };
    mvs.forEach(a => {
      if (!a.renewal_date) return;
      const days = Math.ceil((new Date(a.renewal_date) - now) / (1000 * 60 * 60 * 24));
      if (days <= 30 && days > 0) groups['30d'].push({ ...a, days });
      else if (days <= 60 && days > 0) groups['60d'].push({ ...a, days });
      else if (days <= 90 && days > 0) groups['90d'].push({ ...a, days });
    });

    let html = '<div class="row-grid row-grid-3">';
    Object.entries(groups).forEach(([window, accounts]) => {
      const color = window === '30d' ? 'red' : window === '60d' ? 'amber' : 'blue';
      html += `<div class="ga-card" style="padding:16px;border-top:3px solid var(--ga-${color});">
        <div style="font-size:14px;font-weight:700;color:var(--ga-navy);margin-bottom:8px;">Renews in ${window} (${accounts.length})</div>`;
      if (accounts.length === 0) {
        html += '<div style="font-size:12px;color:var(--ga-muted);">No renewals in this window.</div>';
      } else {
        accounts.forEach(a => {
          const mrr = (a.listings_mrr || 0) + (a.featured_mrr || 0) + (a.display_mrr || 0) + (a.brokernet_mrr || 0);
          const urgent = a.days <= 14 && (!a.last_contact_date || (now - new Date(a.last_contact_date)) / (1000*60*60*24) > 7);
          html += `<div style="font-size:12px;padding:6px 0;border-bottom:1px solid var(--ga-border-light);">
            <strong>${a.broker_name}</strong> — ${Components.formatCurrency(mrr)}/mo — ${a.days} days
            ${urgent ? ' <span class="ga-badge ga-badge-red">URGENT</span>' : ''}
          </div>`;
        });
      }
      html += '</div>';
    });
    html += '</div>';
    return html;
  }

  function renderGrowthLevers(mvs) {
    const standard = mvs.filter(a => a.featured_tier === 'Standard' && a.account_status === 'Active');
    const singleCat = mvs.filter(a => a.customer_segment && !a.customer_segment.includes(',') && a.account_status === 'Active');
    return `<div class="row-grid row-grid-3">
      <div class="ga-card" style="padding:16px;">
        <div style="font-size:13px;font-weight:600;color:var(--ga-navy);">Featured Upgrade</div>
        <div style="font-size:24px;font-weight:700;color:var(--ga-navy);margin:8px 0;">${standard.length} candidates</div>
        <div style="font-size:12px;color:var(--ga-charcoal);">Standard accounts eligible for featured upgrade</div>
        <div style="font-size:12px;color:var(--ga-green-dark);margin-top:4px;">Est. +$500/mo per upgrade</div>
      </div>
      <div class="ga-card" style="padding:16px;">
        <div style="font-size:13px;font-weight:600;color:var(--ga-navy);">Multi-Category Expansion</div>
        <div style="font-size:24px;font-weight:700;color:var(--ga-navy);margin:8px 0;">${singleCat.length} candidates</div>
        <div style="font-size:12px;color:var(--ga-charcoal);">Single-category accounts with expansion potential</div>
      </div>
      <div class="ga-card" style="padding:16px;">
        <div style="font-size:13px;font-weight:600;color:var(--ga-navy);">BrokerNet Bundle</div>
        <div style="font-size:24px;font-weight:700;color:var(--ga-navy);margin:8px 0;">${mvs.filter(a => !a.brokernet_mrr && a.account_status === 'Active').length} candidates</div>
        <div style="font-size:12px;color:var(--ga-charcoal);">Active accounts without BrokerNet subscription</div>
        <div style="font-size:12px;color:var(--ga-green-dark);margin-top:4px;">Est. +$200/mo per bundle</div>
      </div>
    </div>`;
  }

  function renderMVSTable(mvs) {
    if (mvs.length === 0) return Components.emptyState('&#128203;', 'No advertiser accounts in MVS. Add the first account.', 'Add Account', 'MonetizationHub.showAddAccount()');
    const columns = [
      { key: 'broker_name', label: 'Account' },
      { key: 'customer_segment', label: 'Segment', render: v => Components.badge(v || '—', 'blue') },
      { key: 'mrr_total', label: 'MRR', render: v => Components.formatCurrency(v) },
      { key: 'featured_tier', label: 'Tier', render: v => Components.badge(v || 'Standard', v === 'Featured' ? 'green' : 'blue') },
      { key: 'renewal_date', label: 'Renewal', render: v => Components.formatDate(v) },
      { key: 'account_status', label: 'Status', render: v => Components.badge(v, v === 'Active' ? 'green' : v === 'At Risk' ? 'red' : 'amber') },
      { key: 'account_id', label: '', render: v => `<button class="btn btn-ghost btn-sm" onclick="MonetizationHub.showEditAccount('${v}')">Edit</button>` }
    ];
    const rows = mvs.map(a => ({
      ...a,
      mrr_total: (a.listings_mrr || 0) + (a.featured_mrr || 0) + (a.display_mrr || 0) + (a.brokernet_mrr || 0) + (a.sponsorship_mrr || 0) + (a.fbo_mrr || 0) + (a.event_mrr || 0)
    }));
    let html = Components.table(columns, rows, { id: 'mon-mvs-table', sortable: true });
    html += `<button class="btn btn-primary btn-sm" style="margin-top:12px;" onclick="MonetizationHub.showAddAccount()">+ Add Account</button>`;
    return html;
  }

  function showAddAccount() {
    const segOpts = ['jet', 'piston', 'helicopter', 'turboprop', 'fbo'].map(s => `<option value="${s}">${s.charAt(0).toUpperCase() + s.slice(1)}</option>`).join('');
    const statusOpts = ['Active', 'At Risk', 'Churned'].map(s => `<option value="${s}">${s}</option>`).join('');
    Components.showModal(Components.modal('Add Advertiser Account (MVS)', `
      <div class="form-group"><label class="form-label">Account ID *</label><input class="form-input" id="mvs-id" placeholder="BRK-XXX"></div>
      <div class="form-group"><label class="form-label">Broker Name *</label><input class="form-input" id="mvs-name" placeholder="Company name"></div>
      <div class="form-group"><label class="form-label">Contact Name *</label><input class="form-input" id="mvs-contact"></div>
      <div class="form-group"><label class="form-label">Contact Email *</label><input class="form-input" id="mvs-email" type="email"></div>
      <div class="form-group"><label class="form-label">Segment</label><select class="form-select" id="mvs-segment">${segOpts}</select></div>
      <div class="form-group"><label class="form-label">Listings MRR ($)</label><input class="form-input" id="mvs-listings-mrr" type="number" value="0"></div>
      <div class="form-group"><label class="form-label">Featured MRR ($)</label><input class="form-input" id="mvs-featured-mrr" type="number" value="0"></div>
      <div class="form-group"><label class="form-label">BrokerNet MRR ($)</label><input class="form-input" id="mvs-brokernet-mrr" type="number" value="0"></div>
      <div class="form-group"><label class="form-label">Renewal Date *</label><input class="form-input" id="mvs-renewal" type="date"></div>
      <div class="form-group"><label class="form-label">Status *</label><select class="form-select" id="mvs-status">${statusOpts}</select></div>
    `, { id: 'modal-mvs', wide: true, actions: [
      { label: 'Cancel', class: 'btn-ghost', onClick: "Components.closeModal('modal-mvs')" },
      { label: 'Save Account', class: 'btn-primary', onClick: 'MonetizationHub.saveAccount()' }
    ]}));
  }

  function saveAccount() {
    const id = document.getElementById('mvs-id')?.value?.trim();
    const name = document.getElementById('mvs-name')?.value?.trim();
    const contact = document.getElementById('mvs-contact')?.value?.trim();
    const email = document.getElementById('mvs-email')?.value?.trim();
    if (!id || !name || !contact || !email) { Components.showToast('All required fields must be filled.', 'error'); return; }

    const account = {
      account_id: id, broker_name: name, contact_name: contact, contact_email: email,
      listings_mrr: parseFloat(document.getElementById('mvs-listings-mrr')?.value) || 0,
      featured_mrr: parseFloat(document.getElementById('mvs-featured-mrr')?.value) || 0,
      display_mrr: 0, brokernet_mrr: parseFloat(document.getElementById('mvs-brokernet-mrr')?.value) || 0,
      sponsorship_mrr: 0, fbo_mrr: 0, event_mrr: 0,
      renewal_date: document.getElementById('mvs-renewal')?.value || null,
      last_contact_date: null,
      account_status: document.getElementById('mvs-status')?.value || 'Active',
      flag_priority: null,
      customer_segment: document.getElementById('mvs-segment')?.value || null,
      featured_tier: 'Standard'
    };

    const mvs = Store.get('engine_mvs') || [];
    mvs.push(account);
    Store.set('engine_mvs', mvs);
    Store.set('engine_mvs_last_updated', new Date().toISOString());
    Components.closeModal('modal-mvs');
    Components.showToast(`${name} added to MVS.`, 'success');
    Events.log('mon_mvs_account_saved', { account_id: id, fields_changed_count: 10 });
    render(document.getElementById('content-area'));
  }

  function showEditAccount(accountId) {
    const mvs = Store.get('engine_mvs') || [];
    const account = mvs.find(a => a.account_id === accountId);
    if (!account) return;
    const segOpts = ['jet', 'piston', 'helicopter', 'turboprop', 'fbo'].map(s => `<option value="${s}" ${s === account.customer_segment ? 'selected' : ''}>${s.charAt(0).toUpperCase() + s.slice(1)}</option>`).join('');
    const statusOpts = ['Active', 'At Risk', 'Churned'].map(s => `<option value="${s}" ${s === account.account_status ? 'selected' : ''}>${s}</option>`).join('');
    const tierOpts = ['Standard', 'Featured', 'Premium'].map(t => `<option value="${t}" ${t === account.featured_tier ? 'selected' : ''}>${t}</option>`).join('');
    Components.showModal(Components.modal(`Edit: ${account.broker_name}`, `
      <div class="form-group"><label class="form-label">Broker Name</label><input class="form-input" id="edit-name" value="${account.broker_name}"></div>
      <div class="form-group"><label class="form-label">Contact</label><input class="form-input" id="edit-contact" value="${account.contact_name || ''}"></div>
      <div class="form-group"><label class="form-label">Email</label><input class="form-input" id="edit-email" value="${account.contact_email || ''}"></div>
      <div class="form-group"><label class="form-label">Segment</label><select class="form-select" id="edit-segment">${segOpts}</select></div>
      <div class="form-group"><label class="form-label">Tier</label><select class="form-select" id="edit-tier">${tierOpts}</select></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div class="form-group"><label class="form-label">Listings MRR ($)</label><input class="form-input" id="edit-l-mrr" type="number" value="${account.listings_mrr || 0}"></div>
        <div class="form-group"><label class="form-label">Featured MRR ($)</label><input class="form-input" id="edit-f-mrr" type="number" value="${account.featured_mrr || 0}"></div>
        <div class="form-group"><label class="form-label">Display MRR ($)</label><input class="form-input" id="edit-d-mrr" type="number" value="${account.display_mrr || 0}"></div>
        <div class="form-group"><label class="form-label">BrokerNet MRR ($)</label><input class="form-input" id="edit-b-mrr" type="number" value="${account.brokernet_mrr || 0}"></div>
        <div class="form-group"><label class="form-label">Sponsorship MRR ($)</label><input class="form-input" id="edit-sp-mrr" type="number" value="${account.sponsorship_mrr || 0}"></div>
        <div class="form-group"><label class="form-label">FBO MRR ($)</label><input class="form-input" id="edit-fbo-mrr" type="number" value="${account.fbo_mrr || 0}"></div>
      </div>
      <div class="form-group"><label class="form-label">Renewal Date</label><input class="form-input" id="edit-renewal" type="date" value="${account.renewal_date || ''}"></div>
      <div class="form-group"><label class="form-label">Status</label><select class="form-select" id="edit-status">${statusOpts}</select></div>
      <div class="form-group"><label class="form-label">Notes</label><textarea class="form-textarea" id="edit-notes">${account.outreach_notes || ''}</textarea></div>
    `, { id: 'modal-edit-mvs', wide: true, actions: [
      { label: 'Cancel', class: 'btn-ghost', onClick: "Components.closeModal('modal-edit-mvs')" },
      { label: 'Log Outreach', class: 'btn-secondary', onClick: `MonetizationHub.showLogOutreach('${accountId}')` },
      { label: 'Save Changes', class: 'btn-primary', onClick: `MonetizationHub.saveEditAccount('${accountId}')` }
    ]}));
  }

  function saveEditAccount(accountId) {
    const mvs = Store.get('engine_mvs') || [];
    const idx = mvs.findIndex(a => a.account_id === accountId);
    if (idx === -1) return;
    const prev = { ...mvs[idx] };
    mvs[idx].broker_name = document.getElementById('edit-name')?.value || mvs[idx].broker_name;
    mvs[idx].contact_name = document.getElementById('edit-contact')?.value || mvs[idx].contact_name;
    mvs[idx].contact_email = document.getElementById('edit-email')?.value || mvs[idx].contact_email;
    mvs[idx].customer_segment = document.getElementById('edit-segment')?.value;
    mvs[idx].featured_tier = document.getElementById('edit-tier')?.value;
    mvs[idx].listings_mrr = parseFloat(document.getElementById('edit-l-mrr')?.value) || 0;
    mvs[idx].featured_mrr = parseFloat(document.getElementById('edit-f-mrr')?.value) || 0;
    mvs[idx].display_mrr = parseFloat(document.getElementById('edit-d-mrr')?.value) || 0;
    mvs[idx].brokernet_mrr = parseFloat(document.getElementById('edit-b-mrr')?.value) || 0;
    mvs[idx].sponsorship_mrr = parseFloat(document.getElementById('edit-sp-mrr')?.value) || 0;
    mvs[idx].fbo_mrr = parseFloat(document.getElementById('edit-fbo-mrr')?.value) || 0;
    mvs[idx].renewal_date = document.getElementById('edit-renewal')?.value || mvs[idx].renewal_date;
    mvs[idx].account_status = document.getElementById('edit-status')?.value;
    mvs[idx].outreach_notes = document.getElementById('edit-notes')?.value;
    Store.set('engine_mvs', mvs);
    Store.set('engine_mvs_last_updated', new Date().toISOString());
    Components.closeModal('modal-edit-mvs');
    Components.showToast(`${mvs[idx].broker_name} updated.`, 'success');
    Events.log('mon_mvs_account_saved', { account_id: accountId, fields_changed_count: Object.keys(prev).filter(k => prev[k] !== mvs[idx][k]).length });
    render(document.getElementById('content-area'));
  }

  function showLogOutreach(accountId) {
    Components.closeModal('modal-edit-mvs');
    const methodOpts = ['Email', 'Phone', 'In-Person', 'Note'].map(m => `<option value="${m}">${m}</option>`).join('');
    Components.showModal(Components.modal('Log Outreach', `
      <div class="form-group"><label class="form-label">Contact Method *</label><select class="form-select" id="out-method">${methodOpts}</select></div>
      <div class="form-group"><label class="form-label">Summary * (max 500 chars)</label><textarea class="form-textarea" id="out-summary" maxlength="500" placeholder="What was discussed?"></textarea></div>
      <div class="form-group"><label class="form-label">Outcome</label><select class="form-select" id="out-outcome"><option value="">—</option><option value="Contacted">Contacted</option><option value="No Response">No Response</option><option value="Renewal Confirmed">Renewal Confirmed</option><option value="Escalated">Escalated</option></select></div>
      <div class="form-group"><label class="form-label">Next Follow-Up Date</label><input class="form-input" id="out-followup" type="date"></div>
    `, { id: 'modal-outreach', actions: [
      { label: 'Cancel', class: 'btn-ghost', onClick: "Components.closeModal('modal-outreach')" },
      { label: 'Log Outreach', class: 'btn-primary', onClick: `MonetizationHub.saveOutreach('${accountId}')` }
    ]}));
  }

  function saveOutreach(accountId) {
    const method = document.getElementById('out-method')?.value;
    const summary = document.getElementById('out-summary')?.value?.trim();
    if (!summary) { Components.showToast('Summary is required.', 'error'); return; }
    const outcome = document.getElementById('out-outcome')?.value || null;
    const followup = document.getElementById('out-followup')?.value || null;
    const log = Store.get('avengineos_mon_outreach_log') || [];
    log.push({
      id: 'OUT-' + Date.now().toString(36),
      account_id: accountId,
      date: new Date().toISOString(),
      method, summary, outcome,
      next_followup: followup,
      owner: 'Ian'
    });
    Store.set('avengineos_mon_outreach_log', log);
    // Update last contact on MVS account
    const mvs = Store.get('engine_mvs') || [];
    const acct = mvs.find(a => a.account_id === accountId);
    if (acct) { acct.last_contact_date = new Date().toISOString().split('T')[0]; Store.set('engine_mvs', mvs); }
    Components.closeModal('modal-outreach');
    Components.showToast('Outreach logged.', 'success');
    Events.log('mon_outreach_logged', { contact_method: method, account_id: accountId, next_followup_date: followup });
    DecisionLog.addAuto({ domain: 'monetization', decision: `Outreach logged for ${acct?.broker_name || accountId}: ${method}`, reason: summary, owner: 'Ian' });
    render(document.getElementById('content-area'));
  }

  return { render, showAddAccount, saveAccount, showEditAccount, saveEditAccount, showLogOutreach, saveOutreach };
})();
