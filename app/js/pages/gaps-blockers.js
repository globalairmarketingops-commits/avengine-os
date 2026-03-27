/* =====================================================================
   AvEngineOS — Page 08: Gaps & Blockers
   Live gap log with COD, owner, resolution tracking
   Pre-populated from System Document v2.0 Section 10
   ===================================================================== */

const GapsBlockersPage = (() => {
  let domainFilter = 'all';

  function render(container) {
    const blocksScaling = Gaps.getBlocksScaling();
    const active = Gaps.getActive().filter(g => !g.blocks_scaling);
    const resolved = Gaps.getResolved();
    let allGaps = Gaps.getAll();
    if (domainFilter !== 'all') allGaps = allGaps.filter(g => g.domain === domainFilter);
    const totalCOD = Gaps.totalCOD();

    let html = Components.sectionHeader('Gaps & Blockers', `Live gap log — ${Gaps.getActive().length} active gaps. Total quantified COD: ${Components.formatCurrency(totalCOD)}/day`);

    // Domain filter
    html += '<div style="margin-bottom:16px;">';
    html += '<div class="domain-filters">';
    ['all', 'ppc', 'seo', 'listings', 'monetization'].forEach(d => {
      html += `<button class="domain-filter-btn ${d === domainFilter ? 'active' : ''}" onclick="GapsBlockersPage.setDomainFilter('${d}')">${d === 'all' ? 'All' : d.toUpperCase()}</button>`;
    });
    html += '</div></div>';

    // Section 1: Blocks Scaling (Critical)
    const criticalGaps = domainFilter === 'all' ? blocksScaling : blocksScaling.filter(g => g.domain === domainFilter);
    html += `<div style="margin-bottom:24px;">`;
    html += `<h3 style="font-size:16px;font-weight:700;color:var(--ga-red);margin-bottom:12px;">&#9888; Blocks Scaling — Critical Path (${criticalGaps.length})</h3>`;
    if (criticalGaps.length === 0) {
      html += Components.emptyState('&#9989;', 'No scaling blockers. All critical gates clear.', '', null);
    } else {
      const cols = [
        { key: 'description', label: 'Gap' },
        { key: 'domain', label: 'Domain', render: v => Components.domainBadge(v) },
        { key: 'status', label: 'Status', render: (v, row) => `
          <select class="form-select" style="font-size:11px;padding:2px 6px;min-height:24px;width:auto;" onchange="GapsBlockersPage.changeStatus('${row.id}', this.value)">
            ${['Open', 'In Progress', 'Blocked', 'Resolved'].map(s => `<option value="${s}" ${s === v ? 'selected' : ''}>${s}</option>`).join('')}
          </select>` },
        { key: 'cod', label: 'COD', render: v => `<span style="color:var(--ga-red);font-weight:600;">${v}</span>` },
        { key: 'owner', label: 'Owner' },
        { key: 'ticket_ref', label: 'Ticket', render: v => v || '—' },
        { key: 'last_updated', label: 'Updated', render: v => Components.formatDate(v) }
      ];
      html += Components.table(cols, criticalGaps, { id: 'gaps-critical-table', sortable: true });
    }
    html += '</div>';

    // Section 2: Active Operational Gaps
    const activeGaps = domainFilter === 'all' ? active : active.filter(g => g.domain === domainFilter);
    html += `<div style="margin-bottom:24px;">`;
    html += `<h3 style="font-size:16px;font-weight:700;color:var(--ga-navy);margin-bottom:12px;">Active Operational Gaps (${activeGaps.length})</h3>`;
    if (activeGaps.length === 0) {
      html += Components.emptyState('&#9989;', 'No active operational gaps.', '', null);
    } else {
      const cols = [
        { key: 'description', label: 'Gap' },
        { key: 'domain', label: 'Domain', render: v => Components.domainBadge(v) },
        { key: 'status', label: 'Status', render: (v, row) => `
          <select class="form-select" style="font-size:11px;padding:2px 6px;min-height:24px;width:auto;" onchange="GapsBlockersPage.changeStatus('${row.id}', this.value)">
            ${['Open', 'In Progress', 'Blocked', 'Resolved'].map(s => `<option value="${s}" ${s === v ? 'selected' : ''}>${s}</option>`).join('')}
          </select>` },
        { key: 'cod', label: 'COD' },
        { key: 'owner', label: 'Owner' },
        { key: 'resolution_path', label: 'Resolution Path', render: v => `<span style="font-size:11px;">${v || '—'}</span>` },
        { key: 'last_updated', label: 'Updated', render: v => Components.formatDate(v) }
      ];
      html += Components.table(cols, activeGaps, { id: 'gaps-active-table', sortable: true });
    }
    html += '</div>';

    // Section 3: Resolved (archive)
    const resolvedGaps = domainFilter === 'all' ? resolved : resolved.filter(g => g.domain === domainFilter);
    if (resolvedGaps.length > 0) {
      html += `<div>`;
      html += `<h3 style="font-size:16px;font-weight:700;color:var(--ga-green-dark);margin-bottom:12px;">Recently Resolved (${resolvedGaps.length})</h3>`;
      const cols = [
        { key: 'description', label: 'Gap' },
        { key: 'domain', label: 'Domain', render: v => Components.domainBadge(v) },
        { key: 'resolved_date', label: 'Resolved', render: v => Components.formatDate(v) },
        { key: 'resolution_method', label: 'Method', render: v => v || '—' }
      ];
      html += Components.table(cols, resolvedGaps, { id: 'gaps-resolved-table' });
      html += '</div>';
    }

    container.innerHTML = html;
    Events.log('gap_log_view', { total: allGaps.length, critical: criticalGaps.length, active: activeGaps.length });
  }

  function setDomainFilter(d) { domainFilter = d; render(document.getElementById('content-area')); }

  function changeStatus(id, newStatus) {
    if (newStatus === 'Resolved') {
      Components.showModal(Components.modal('Resolve Gap', `
        <div class="form-group"><label class="form-label">Resolution Method</label><input class="form-input" id="gap-resolution" placeholder="How was this resolved?"></div>
      `, { id: 'modal-gap-resolve', actions: [
        { label: 'Cancel', class: 'btn-ghost', onClick: "Components.closeModal('modal-gap-resolve')" },
        { label: 'Mark Resolved', class: 'btn-primary', onClick: `GapsBlockersPage.doResolve('${id}')` }
      ]}));
    } else {
      Gaps.updateStatus(id, newStatus);
      Components.showToast(`Gap status updated to ${newStatus}.`, 'success');
      render(document.getElementById('content-area'));
      updateNavBadges();
    }
  }

  function doResolve(id) {
    const resolution = document.getElementById('gap-resolution')?.value?.trim() || 'Resolved';
    Gaps.updateStatus(id, 'Resolved', resolution);
    Components.closeModal('modal-gap-resolve');
    Components.showToast('Gap marked as resolved.', 'success');
    DecisionLog.addAuto({ domain: 'ops', decision: `Gap resolved: ${id}`, reason: resolution, owner: 'Casey' });
    render(document.getElementById('content-area'));
    updateNavBadges();
  }

  return { render, setDomainFilter, changeStatus, doResolve };
})();
