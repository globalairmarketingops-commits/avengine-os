/* =====================================================================
   AvEngineOS — Shared UI Components
   All reusable rendering functions for tables, cards, badges, modals, etc.
   ===================================================================== */

const Components = (() => {

  /* ---- KPI Tile ---- */
  function kpiTile(label, value, opts = {}) {
    const { delta, trend, confidence, topDriverLabel, topDriverRoute, subtitle } = opts;
    const trendArrow = trend === 'up' ? '&#9650;' : trend === 'down' ? '&#9660;' : '&#9654;';
    const trendClass = trend === 'up' ? 'trend-up' : trend === 'down' ? 'trend-down' : 'trend-flat';
    const confBadge = confidence ? `<span class="confidence-tag confidence-${confidence.toLowerCase()}">${confidence}</span>` : '';
    const topDriver = topDriverLabel ? `<a class="top-driver-link" onclick="Router.navigate('${topDriverRoute || ''}')" title="View top driver">${topDriverLabel}</a>` : '';
    const deltaHtml = delta != null ? `<span class="kpi-delta ${trendClass}">${trendArrow} ${delta}</span>` : '';
    return `
      <div class="kpi-tile" role="group" aria-label="${label}: ${value}. ${confidence || ''} ${trend || ''}">
        <div class="kpi-label">${label} ${confBadge}</div>
        <div class="kpi-value">${value}</div>
        ${subtitle ? `<div class="kpi-subtitle">${subtitle}</div>` : ''}
        <div class="kpi-footer">${deltaHtml} ${topDriver}</div>
      </div>`;
  }

  /* ---- Status Card (Gate / Blocker) ---- */
  function statusCard(name, status, opts = {}) {
    const { owner, cod, ticket, lastUpdated, onClick } = opts;
    const statusLower = (status || '').toLowerCase().replace(/\s+/g, '_');
    const colorMap = {
      clean: 'green', confirmed: 'green', active: 'green', live: 'green', resolved: 'green', unblocked: 'green',
      unconfirmed: 'red', not_active: 'red', blocked: 'red', contaminated: 'red',
      in_progress: 'amber', being_replaced: 'amber', pending: 'amber'
    };
    const color = colorMap[statusLower] || 'red';
    const ticketHtml = ticket ? `<div class="status-ticket"><a href="#" title="${ticket}">${ticket}</a></div>` : '';
    return `
      <div class="status-card status-${color}" ${onClick ? `onclick="${onClick}"` : ''} role="button" tabindex="0"
           aria-label="${name}: ${status}. Owner: ${owner || 'Unassigned'}. Cost of delay: ${cod || 'N/A'}">
        <div class="status-header">
          <span class="status-dot status-dot-${color}"></span>
          <span class="status-name">${name}</span>
        </div>
        <div class="status-pill status-pill-${color}">${status}</div>
        <div class="status-meta">
          ${owner ? `<div class="status-owner">Owner: ${owner}</div>` : ''}
          ${cod ? `<div class="status-cod">COD: ${cod}</div>` : ''}
          ${ticketHtml}
          ${lastUpdated ? `<div class="status-updated">Updated: ${formatDate(lastUpdated)}</div>` : ''}
        </div>
      </div>`;
  }

  /* ---- Badge ---- */
  function badge(text, color = 'blue') {
    return `<span class="ga-badge ga-badge-${color}">${text}</span>`;
  }

  function domainBadge(domain) {
    const colors = { ppc: 'green', seo: 'blue', listings: 'amber', monetization: 'red' };
    return badge(domain.toUpperCase(), colors[domain] || 'blue');
  }

  /* ---- Sortable Table ---- */
  function table(columns, rows, opts = {}) {
    const { id, sortable, onRowClick, checkboxes, emptyMessage } = opts;
    if (!rows || rows.length === 0) {
      return emptyState('&#128203;', emptyMessage || 'No data available.', '', null);
    }
    const tableId = id || 'table-' + Math.random().toString(36).slice(2, 8);
    let html = `<div class="table-wrapper"><table class="ga-table" id="${tableId}"><thead><tr>`;
    if (checkboxes) html += '<th class="th-checkbox"><input type="checkbox" class="select-all" aria-label="Select all"></th>';
    columns.forEach(col => {
      const sortAttr = sortable ? `class="sortable" data-col="${col.key}" onclick="Components.sortTable('${tableId}','${col.key}')"` : '';
      html += `<th ${sortAttr} scope="col">${col.label}</th>`;
    });
    html += '</tr></thead><tbody>';
    rows.forEach((row, i) => {
      const rowClass = row._rowClass || '';
      const clickAttr = onRowClick ? `onclick="${onRowClick}(${i})" class="clickable ${rowClass}"` : `class="${rowClass}"`;
      html += `<tr ${clickAttr} data-idx="${i}">`;
      if (checkboxes) html += `<td><input type="checkbox" class="row-checkbox" value="${row.id || i}" aria-label="Select ${row[columns[0]?.key] || 'item'}"></td>`;
      columns.forEach(col => {
        const val = col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—');
        html += `<td>${val}</td>`;
      });
      html += '</tr>';
    });
    html += '</tbody></table></div>';
    return html;
  }

  let sortState = {};
  function sortTable(tableId, colKey) {
    const tbl = document.getElementById(tableId);
    if (!tbl) return;
    const dir = sortState[tableId + colKey] === 'asc' ? 'desc' : 'asc';
    sortState[tableId + colKey] = dir;
    const tbody = tbl.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    const colIdx = Array.from(tbl.querySelectorAll('thead th')).findIndex(th => th.dataset.col === colKey);
    if (colIdx < 0) return;
    rows.sort((a, b) => {
      let va = a.cells[colIdx]?.textContent.trim() || '';
      let vb = b.cells[colIdx]?.textContent.trim() || '';
      const na = parseFloat(va.replace(/[^0-9.\-]/g, ''));
      const nb = parseFloat(vb.replace(/[^0-9.\-]/g, ''));
      if (!isNaN(na) && !isNaN(nb)) return dir === 'asc' ? na - nb : nb - na;
      return dir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    });
    rows.forEach(r => tbody.appendChild(r));
    tbl.querySelectorAll('thead th').forEach(th => th.removeAttribute('aria-sort'));
    const th = tbl.querySelector(`thead th[data-col="${colKey}"]`);
    if (th) th.setAttribute('aria-sort', dir === 'asc' ? 'ascending' : 'descending');
  }

  /* ---- Modal ---- */
  function modal(title, bodyHtml, opts = {}) {
    const { actions, id, wide } = opts;
    const modalId = id || 'modal-' + Math.random().toString(36).slice(2, 8);
    let actionsHtml = '';
    if (actions) {
      actionsHtml = '<div class="modal-actions">' + actions.map(a =>
        `<button class="btn ${a.class || 'btn-primary'}" onclick="${a.onClick}">${a.label}</button>`
      ).join('') + '</div>';
    }
    return `
      <div class="modal-overlay" id="${modalId}" role="dialog" aria-modal="true" aria-labelledby="${modalId}-title" onclick="Components.closeModal('${modalId}')">
        <div class="modal-content ${wide ? 'modal-wide' : ''}" onclick="event.stopPropagation()">
          <div class="modal-header">
            <h2 id="${modalId}-title">${title}</h2>
            <button class="modal-close" onclick="Components.closeModal('${modalId}')" aria-label="Close">&times;</button>
          </div>
          <div class="modal-body">${bodyHtml}</div>
          ${actionsHtml}
        </div>
      </div>`;
  }

  function showModal(html) {
    const container = document.getElementById('modal-container');
    if (container) {
      container.innerHTML = html;
      const overlay = container.querySelector('.modal-overlay');
      if (overlay) {
        // Focus first input or button inside modal
        const firstFocusable = overlay.querySelector('input, select, textarea, button:not(.modal-close)');
        if (firstFocusable) setTimeout(() => firstFocusable.focus(), 50);
        // Trap focus inside modal
        overlay.addEventListener('keydown', trapFocus);
        // Close on Escape
        overlay.addEventListener('keydown', (e) => { if (e.key === 'Escape') { const id = overlay.id; if (id) closeModal(id); } });
      }
    }
  }

  function trapFocus(e) {
    if (e.key !== 'Tab') return;
    const modal = e.currentTarget.querySelector('.modal-content');
    if (!modal) return;
    const focusables = modal.querySelectorAll('input, select, textarea, button, [tabindex]:not([tabindex="-1"])');
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }

  /* ---- Gauge (Circular) ---- */
  function gauge(value, max, opts = {}) {
    const { label, unit, thresholds } = opts;
    const pct = Math.round((value / max) * 100) || 0;
    let color = 'var(--ga-green)';
    if (thresholds) {
      if (pct < thresholds.red) color = 'var(--ga-red)';
      else if (pct < thresholds.amber) color = 'var(--ga-amber)';
    }
    const circumference = 2 * Math.PI * 40;
    const dashoffset = circumference * (1 - pct / 100);
    return `
      <div class="gauge-container" aria-label="${label || ''}: ${pct}%">
        <svg viewBox="0 0 100 100" class="gauge-svg">
          <circle cx="50" cy="50" r="40" fill="none" stroke="var(--ga-border)" stroke-width="8"/>
          <circle cx="50" cy="50" r="40" fill="none" stroke="${color}" stroke-width="8"
                  stroke-dasharray="${circumference}" stroke-dashoffset="${dashoffset}"
                  stroke-linecap="round" transform="rotate(-90 50 50)"/>
        </svg>
        <div class="gauge-text">
          <span class="gauge-value">${pct}${unit || '%'}</span>
          ${label ? `<span class="gauge-label">${label}</span>` : ''}
        </div>
      </div>`;
  }

  /* ---- Date Range Picker ---- */
  function dateRangePicker(current = '7d') {
    const settings = Store.get('engine_settings') || {};
    const compareMode = settings.compare_mode || 'wow';
    const ranges = ['7d', '30d', '90d', 'custom'];
    return `
      <div style="display:flex;align-items:center;gap:8px;">
        <div class="date-range-picker" role="group" aria-label="Date range">
          ${ranges.map(r => `<button class="dr-btn ${r === current ? 'dr-active' : ''}" data-range="${r}" onclick="Components.setDateRange('${r}')">${r === 'custom' ? 'Custom' : r.toUpperCase()}</button>`).join('')}
        </div>
        <div class="date-range-picker" role="group" aria-label="Compare mode">
          <button class="dr-btn ${compareMode === 'wow' ? 'dr-active' : ''}" onclick="Components.setCompareMode('wow')">WoW</button>
          <button class="dr-btn ${compareMode === 'mom' ? 'dr-active' : ''}" onclick="Components.setCompareMode('mom')">MoM</button>
        </div>
      </div>`;
  }

  function setDateRange(range) {
    if (range === 'custom') {
      showCustomDateRange();
      return;
    }
    const settings = Store.get('engine_settings') || {};
    settings.date_range = range;
    Store.set('engine_settings', settings);
    document.querySelectorAll('.dr-btn').forEach(b => b.classList.toggle('dr-active', b.dataset.range === range));
    Events.log('engine_cmd_daterange_change', { range, compare_mode: settings.compare_mode });
  }

  function setCompareMode(mode) {
    const settings = Store.get('engine_settings') || {};
    settings.compare_mode = mode;
    Store.set('engine_settings', settings);
    // Update UI
    document.getElementById('topbar-date-range').innerHTML = dateRangePicker(settings.date_range || '7d');
    Events.log('engine_cmd_daterange_change', { range: settings.date_range, compare_mode: mode });
  }

  function showCustomDateRange() {
    const today = new Date().toISOString().split('T')[0];
    const thirtyAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    showModal(modal('Custom Date Range', `
      <div class="form-group"><label class="form-label">Start Date</label><input class="form-input" type="date" id="dr-start" value="${thirtyAgo}"></div>
      <div class="form-group"><label class="form-label">End Date</label><input class="form-input" type="date" id="dr-end" value="${today}" max="${today}"></div>
      <p style="font-size:11px;color:var(--ga-muted);margin-top:8px;">Maximum 90 days. For longer analysis, use AvIntelOS.</p>
    `, { id: 'modal-daterange', actions: [
      { label: 'Cancel', class: 'btn-ghost', onClick: "Components.closeModal('modal-daterange')" },
      { label: 'Apply Range', class: 'btn-primary', onClick: 'Components.applyCustomDateRange()' }
    ]}));
  }

  function applyCustomDateRange() {
    const start = document.getElementById('dr-start')?.value;
    const end = document.getElementById('dr-end')?.value;
    if (!start || !end) return;
    const days = (new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24);
    if (days > 90) { showToast('Maximum 90 days. For longer analysis, use AvIntelOS.', 'error'); return; }
    if (days < 0) { showToast('Start date must be before end date.', 'error'); return; }
    const settings = Store.get('engine_settings') || {};
    settings.date_range = 'custom';
    settings.custom_start = start;
    settings.custom_end = end;
    Store.set('engine_settings', settings);
    closeModal('modal-daterange');
    showToast(`Custom range: ${start} to ${end} (${Math.round(days)} days)`, 'success');
    Events.log('engine_cmd_daterange_change', { range: 'custom', start_date: start, end_date: end });
    document.getElementById('topbar-date-range').innerHTML = dateRangePicker('custom');
  }

  /* ---- Empty State ---- */
  function emptyState(icon, message, ctaText, ctaAction) {
    return `
      <div class="empty-state">
        <div class="empty-icon">${icon}</div>
        <div class="empty-message">${message}</div>
        ${ctaText ? `<button class="btn btn-primary" onclick="${ctaAction || ''}">${ctaText}</button>` : ''}
      </div>`;
  }

  /* ---- Toast ---- */
  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.setAttribute('role', 'alert');
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('toast-visible'));
    setTimeout(() => { toast.classList.remove('toast-visible'); setTimeout(() => toast.remove(), 300); }, 3000);
  }

  /* ---- Section Headers ---- */
  function sectionHeader(title, subtitle) {
    return `<div class="section-header"><h2 class="section-title">${title}</h2>${subtitle ? `<p class="section-subtitle">${subtitle}</p>` : ''}</div>`;
  }

  function partHeader(partLabel, title) {
    return `<div class="part-header"><span class="part-label">${partLabel}</span><h3 class="part-title">${title}</h3></div>`;
  }

  /* ---- Alert Banner ---- */
  function alertBanner(message, type = 'error') {
    return `<div class="alert-banner alert-${type}" role="alert">${message}</div>`;
  }

  /* ---- Operating Mode Pill ---- */
  function operatingModePill() {
    const settings = Store.get('engine_settings') || {};
    const gates = [
      settings.conversion_signal_status,
      settings.call_tracking_active,
      settings.gclid_capture_status,
      settings.enhanced_conversions_status,
      settings.ai_crawler_status
    ];
    const criticalGates = [settings.conversion_signal_status, settings.call_tracking_active];
    const greenStatuses = ['clean', 'confirmed', 'active', 'live', 'unblocked'];
    const hasCriticalRed = criticalGates.some(g => g && !greenStatuses.includes((g.status || '').toLowerCase()));
    const failingCount = gates.filter(g => g && !greenStatuses.includes((g.status || '').toLowerCase())).length;

    let mode, color, label;
    if (failingCount === 0) { mode = 'green'; label = 'ALL CLEAR'; }
    else if (hasCriticalRed) { mode = 'red'; label = 'CRITICAL'; }
    else { mode = 'amber'; label = `WARNING (${failingCount})`; }

    return `<button class="op-mode-pill op-mode-${mode}" onclick="Router.navigate('command')"
              aria-label="Operating mode: ${label}. Click to view gate status.">${label}</button>`;
  }

  /* ---- Category Filter ---- */
  function categoryFilter() {
    const settings = Store.get('engine_settings') || {};
    const current = settings.category_filter || 'all';
    const cats = ['all', 'jet', 'piston', 'helicopter', 'turboprop', 'fbo'];
    return `
      <select class="cat-filter" onchange="Components.setCategoryFilter(this.value)" aria-label="Category filter">
        ${cats.map(c => `<option value="${c}" ${c === current ? 'selected' : ''}>${c === 'all' ? 'All Categories' : c.charAt(0).toUpperCase() + c.slice(1)}</option>`).join('')}
      </select>`;
  }

  function setCategoryFilter(val) {
    const settings = Store.get('engine_settings') || {};
    settings.category_filter = val;
    Store.set('engine_settings', settings);
    Events.log('engine_cmd_filter_change', { filter_type: 'category', filter_value: val });
    Router.navigate(Router.getCurrent());
  }

  /* ---- Signal Clean Toggle ---- */
  function signalCleanToggle() {
    const settings = Store.get('engine_settings') || {};
    const isOn = settings.signal_clean_only !== false;
    return `
      <label class="toggle-label" title="Filter out contaminated GA4 data">
        <input type="checkbox" class="toggle-input" ${isOn ? 'checked' : ''} onchange="Components.setSignalClean(this.checked)">
        <span class="toggle-switch"></span>
        <span class="toggle-text">Signal Clean</span>
      </label>`;
  }

  function setSignalClean(val) {
    const settings = Store.get('engine_settings') || {};
    settings.signal_clean_only = val;
    Store.set('engine_settings', settings);
    Events.log('engine_cmd_filter_change', { filter_type: 'signal_clean', filter_value: val });
    Router.navigate(Router.getCurrent());
  }

  /* ---- Windsor Staleness Dot ---- */
  function windsorDot(connectorKey) {
    const cache = Store.get('windsor_cache') || {};
    const connector = cache[connectorKey];
    if (!connector || !connector.timestamp) {
      return '<span class="windsor-dot windsor-dot-red" title="Windsor.ai not connected">&#9679; PENDING</span>';
    }
    const ageHrs = (Date.now() - new Date(connector.timestamp).getTime()) / (1000 * 60 * 60);
    if (ageHrs < 24) return `<span class="windsor-dot windsor-dot-green" title="Refreshed ${Math.round(ageHrs)}h ago">&#9679;</span>`;
    if (ageHrs < 48) return `<span class="windsor-dot windsor-dot-amber" title="Data may be stale — ${Math.round(ageHrs)}h ago">&#9679;</span>`;
    return `<span class="windsor-dot windsor-dot-red" title="STALE DATA — ${Math.round(ageHrs)}h ago">&#9679; STALE</span>`;
  }

  /* ---- Helpers ---- */
  function formatDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function formatCurrency(val) {
    if (val == null || isNaN(val)) return '—';
    return '$' + Number(val).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  function formatPct(val) {
    if (val == null || isNaN(val)) return '—';
    return Number(val).toFixed(1) + '%';
  }

  function statusColor(status) {
    const s = (status || '').toLowerCase().replace(/\s+/g, '_');
    const map = { open: 'blue', in_progress: 'amber', blocked: 'red', shipped: 'green', verified: 'green', resolved: 'green' };
    return map[s] || 'blue';
  }

  return {
    kpiTile, statusCard, badge, domainBadge, table, sortTable,
    modal, showModal, closeModal, gauge, dateRangePicker, setDateRange,
    setCompareMode, showCustomDateRange, applyCustomDateRange,
    emptyState, showToast, sectionHeader, partHeader, alertBanner,
    operatingModePill, categoryFilter, setCategoryFilter,
    signalCleanToggle, setSignalClean, windsorDot,
    formatDate, formatCurrency, formatPct, statusColor
  };
})();
