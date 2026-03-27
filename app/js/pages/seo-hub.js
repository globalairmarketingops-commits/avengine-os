/* =====================================================================
   AvEngineOS — Page 03: SEO Hub
   Organic Search Command Layer. Per Page_03_SEO_Hub_Spec_v1.0
   ===================================================================== */

const SEOHub = (() => {

  function render(container) {
    const rankTargets = Store.get('avengineos_seo_rank_targets') || {};
    const pipeline = Store.get('avengineos_seo_pipeline') || {};
    const crawlers = Store.get('avengineos_seo_crawlers') || {};
    const blockers = Store.get('avengineos_seo_blockers') || {};

    let html = '<div class="domain-page">';

    // ---- PART A: Domain Health ----
    html += '<div class="domain-part">';
    html += Components.partHeader('Part A', 'Domain Health — SEO');

    // KPI row
    html += '<div class="row-grid row-grid-4">';
    html += Components.kpiTile('Organic Keywords', '201K+', { confidence: 'CONFIRMED', delta: '+1.2K', trend: 'up' });
    html += Components.kpiTile('Monthly Organic Clicks', '157K', { confidence: 'CONFIRMED', delta: '-3%', trend: 'down', subtitle: '6-month CTR decline active' });
    html += Components.kpiTile('Controller Gap', '25.3K keywords', { confidence: 'CONFIRMED', subtitle: 'Keywords Controller ranks for that GlobalAir does not' });
    html += Components.kpiTile('Evergreen Ratio', pipeline.evergreen_percent != null ? pipeline.evergreen_percent + '%' : '0%', { confidence: pipeline.briefs_issued > 0 ? 'CONFIRMED' : 'ESTIMATE', subtitle: `Target: 80/20. Current: ${pipeline.evergreen_percent || 0}% evergreen` });
    html += '</div>';

    // Priority Page Rank Tracker (US-SEO-001)
    html += '<h4 style="margin:20px 0 8px;font-size:14px;font-weight:600;color:var(--ga-navy);">Priority Page Rank Tracker</h4>';
    html += renderRankTracker(rankTargets);

    // Content Pipeline Ratio (US-SEO-006)
    html += '<h4 style="margin:20px 0 8px;font-size:14px;font-weight:600;color:var(--ga-navy);">Content Pipeline Ratio</h4>';
    html += renderPipelineRatio(pipeline);

    html += '</div>';

    // ---- PART B: Diagnostics ----
    html += '<div class="domain-part">';
    html += Components.partHeader('Part B', 'Diagnostics');

    // CTR Decline Watch (US-SEO-002)
    html += '<h4 style="margin:12px 0 8px;font-size:14px;font-weight:600;color:var(--ga-navy);">CTR Decline Watch (6-Month Trend)</h4>';
    html += renderCTRWatch();

    // Controller Gap Tracker (US-SEO-003)
    html += '<h4 style="margin:20px 0 8px;font-size:14px;font-weight:600;color:var(--ga-navy);">Controller Gap Tracker</h4>';
    html += renderGapTracker();

    // Position 4-10 Push List (US-SEO-004)
    html += '<h4 style="margin:20px 0 8px;font-size:14px;font-weight:600;color:var(--ga-navy);">Position 4-10 Push List</h4>';
    html += renderPushList(rankTargets);

    // Technical Blockers (US-SEO-005)
    html += '<h4 style="margin:20px 0 8px;font-size:14px;font-weight:600;color:var(--ga-navy);">Technical Blockers</h4>';
    html += renderTechBlockers(crawlers, blockers);

    html += '</div>';

    // ---- PART C: Action Stack ----
    html += '<div class="domain-part">';
    html += Components.partHeader('Part C', 'Action Stack');

    // SEO Opportunity Engine (US-SEO-007)
    html += '<h4 style="margin:12px 0 8px;font-size:14px;font-weight:600;color:var(--ga-navy);">SEO Opportunities</h4>';
    const seoOpps = Opportunity.getByDomain('seo');
    if (seoOpps.length === 0) {
      html += Components.emptyState('&#127919;', 'No active SEO opportunities. All KPIs on target.', '', null);
    } else {
      const cols = [
        { key: 'score', label: 'Score', render: (v, row) => `<strong>${Opportunity.scoreDisplay(row)}</strong>` },
        { key: 'name', label: 'Opportunity' },
        { key: 'owner', label: 'Owner' },
        { key: 'cod', label: 'COD' },
        { key: 'status', label: 'Status', render: v => Components.badge(v, Components.statusColor(v)) }
      ];
      html += Components.table(cols, seoOpps, { id: 'seo-opp-table', sortable: true });
    }

    // SEO Gaps (US-SEO-008)
    html += '<h4 style="margin:20px 0 8px;font-size:14px;font-weight:600;color:var(--ga-navy);">SEO Gaps</h4>';
    const seoGaps = Gaps.getByDomain('seo');
    if (seoGaps.length === 0) {
      html += Components.emptyState('&#9989;', 'No active SEO gaps.', '', null);
    } else {
      const gapCols = [
        { key: 'description', label: 'Gap' },
        { key: 'status', label: 'Status', render: v => Components.badge(v, Components.statusColor(v)) },
        { key: 'cod', label: 'COD' },
        { key: 'owner', label: 'Owner' }
      ];
      html += Components.table(gapCols, seoGaps, { id: 'seo-gaps-table' });
    }

    html += '</div></div>';
    container.innerHTML = html;
    Events.log('seo_hub_view', { page_section: 'all' });
  }

  function renderRankTracker(targets) {
    const urls = Object.entries(targets).map(([url, data]) => ({
      url: url.replace('globalair.com/', ''),
      current_position: data.current_position,
      target_position: data.target_position,
      wow_delta: data.wow_delta,
      last_moved: data.last_moved,
      intervention: data.intervention,
      owner: data.owner,
      category: data.category,
      _rowClass: data.current_position > 10 ? 'cpqi-red' : ''
    }));

    const columns = [
      { key: 'url', label: 'URL', render: v => `<span style="font-size:12px;font-family:var(--ga-font-mono);">/${v}</span>` },
      { key: 'current_position', label: 'Position', render: (v) => {
        const color = v <= 3 ? 'cpqi-green' : v <= 10 ? 'cpqi-amber' : 'cpqi-red';
        return `<span class="${color}">${v}</span>`;
      }},
      { key: 'target_position', label: 'Target' },
      { key: 'wow_delta', label: 'WoW', render: v => {
        if (v > 0) return `<span class="trend-down">&#9660; ${v}</span>`;
        if (v < 0) return `<span class="trend-up">&#9650; ${Math.abs(v)}</span>`;
        return '<span class="trend-flat">—</span>';
      }},
      { key: 'last_moved', label: 'Last Moved', render: v => Components.formatDate(v) },
      { key: 'intervention', label: 'Intervention', render: v => `<span style="font-size:11px;">${v}</span>` },
      { key: 'owner', label: 'Owner' }
    ];

    return Components.table(columns, urls, { id: 'seo-rank-table', sortable: true });
  }

  function renderPipelineRatio(pipeline) {
    const total = (pipeline.briefs_issued || 0) + (pipeline.articles_published || 0);
    const evPct = pipeline.evergreen_percent || 0;
    const isOffTarget = evPct < 70;

    let html = '<div class="row-grid row-grid-2">';
    html += `<div class="ga-card" style="padding:16px;">
      <div style="display:flex;gap:24px;align-items:center;">
        ${Components.gauge(evPct, 100, { label: 'Evergreen', thresholds: { red: 30, amber: 60 } })}
        <div>
          <div style="font-size:13px;margin-bottom:8px;"><strong>This Week:</strong></div>
          <div style="font-size:12px;">Briefs Issued: ${pipeline.briefs_issued || 0}</div>
          <div style="font-size:12px;">Published: ${pipeline.articles_published || 0}</div>
          <div style="font-size:12px;">In Progress: ${pipeline.in_progress || 0}</div>
          <div style="font-size:12px;">Pending Brief: ${pipeline.pending_brief || 0}</div>
        </div>
      </div>
      ${isOffTarget ? `<div class="alert-banner alert-error" style="margin-top:12px;">Content mix is ${evPct}% evergreen — target is 80%. Issue ${Math.max(3 - (pipeline.briefs_issued || 0), 0)} more evergreen briefs this sprint.</div>` : ''}
    </div>`;
    html += `<div class="ga-card" style="padding:16px;">
      <div style="font-size:13px;font-weight:600;color:var(--ga-navy);margin-bottom:8px;">Pipeline Input</div>
      <button class="btn btn-primary btn-sm" onclick="SEOHub.showPipelineInput()">Update Pipeline (Monday)</button>
      <div style="font-size:11px;color:var(--ga-muted);margin-top:8px;">Last updated: ${pipeline.entries?.length > 0 ? Components.formatDate(pipeline.entries[pipeline.entries.length - 1]?.updated_at) : 'Never'}</div>
    </div>`;
    html += '</div>';
    return html;
  }

  function renderCTRWatch() {
    const categories = [
      { name: 'Jets', ctr: [4.2, 4.0, 3.8, 3.5, 3.3, 3.1], color: 'var(--ga-navy)' },
      { name: 'Piston', ctr: [5.1, 4.8, 4.9, 4.5, 4.3, 4.0], color: 'var(--ga-green)' },
      { name: 'Helicopter', ctr: [6.2, 6.0, 5.8, 5.9, 5.7, 5.5], color: 'var(--ga-blue)' },
      { name: 'Turboprop', ctr: [3.8, 3.6, 3.7, 3.4, 3.2, 3.0], color: 'var(--ga-amber)' }
    ];
    let html = '<div class="row-grid row-grid-4">';
    categories.forEach(cat => {
      const decline = cat.ctr[0] - cat.ctr[cat.ctr.length - 1];
      const pct = ((decline / cat.ctr[0]) * 100).toFixed(1);
      const isSteepest = pct > 15;
      html += `<div class="ga-card" style="padding:14px;${isSteepest ? 'border-color:var(--ga-red);' : ''}">
        <div style="font-size:13px;font-weight:600;color:var(--ga-navy);margin-bottom:8px;">${cat.name}</div>
        <div style="font-size:11px;color:var(--ga-muted);margin-bottom:6px;">6-month trend: ${cat.ctr.map(c => c + '%').join(' → ')}</div>
        <div style="font-size:14px;font-weight:700;color:${decline > 0 ? 'var(--ga-red)' : 'var(--ga-green-dark)'};">
          ${decline > 0 ? '↓' : '↑'} ${pct}% decline
        </div>
      </div>`;
    });
    html += '</div>';
    return html;
  }

  function renderGapTracker() {
    const tiers = [
      { name: 'Buyer-Ready', count: 3200, examples: ['used gulfstream for sale', 'cessna 172 price', 'bell 407 for sale'] },
      { name: 'Research-Phase', count: 8700, examples: ['private jet cost per hour', 'turboprop vs jet', 'helicopter maintenance costs'] },
      { name: 'Awareness', count: 13400, examples: ['best first airplane to buy', 'aviation career', 'types of aircraft'] }
    ];

    // SEMrush CSV staleness check
    const semrushUpload = Store.get('avengineos_seo_semrush_upload');
    const isSemrushStale = !semrushUpload || Store.isStale('avengineos_seo_semrush_upload', 7);

    let html = '';
    if (isSemrushStale) {
      html += `<div class="alert-banner alert-warning" style="margin-bottom:12px;">
        SEMrush data ${semrushUpload ? 'refreshed ' + Components.formatDate(semrushUpload.last_updated) : 'not yet uploaded'}.
        <button class="btn btn-ghost btn-sm" style="margin-left:8px;" onclick="SEOHub.showSemrushUpload()">Upload CSV</button>
      </div>`;
    }

    html += '<div style="display:flex;flex-direction:column;gap:12px;">';
    tiers.forEach(tier => {
      html += `<div class="ga-card" style="padding:14px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <span style="font-size:13px;font-weight:600;color:var(--ga-navy);">${tier.name} (${tier.count.toLocaleString()} keywords)</span>
          <button class="btn btn-primary btn-sm" onclick="SEOHub.showCreateBrief('${tier.name}')">Create Brief</button>
        </div>
        <div style="font-size:11px;color:var(--ga-muted);">Examples: ${tier.examples.join(', ')}</div>
      </div>`;
    });
    html += '</div>';
    return html;
  }

  function showSemrushUpload() {
    Components.showModal(Components.modal('Upload SEMrush Competitive Gap CSV', `
      <div class="csv-dropzone" id="semrush-dropzone" onclick="document.getElementById('semrush-file').click()">
        <div class="csv-dropzone-icon">&#128200;</div>
        <div class="csv-dropzone-text">Drag & drop SEMrush CSV here, or click to browse</div>
        <div style="font-size:11px;color:var(--ga-muted);margin-top:8px;">Expected columns: keyword, intent, difficulty, volume, competitor_rank, status</div>
      </div>
      <input type="file" id="semrush-file" accept=".csv" style="display:none" onchange="SEOHub.handleSemrushFile(this)">
    `, { id: 'modal-semrush', actions: [
      { label: 'Cancel', class: 'btn-ghost', onClick: "Components.closeModal('modal-semrush')" }
    ]}));
  }

  function handleSemrushFile(input) {
    if (!input.files[0]) return;
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
      const lines = e.target.result.split('\n').filter(l => l.trim());
      Store.set('avengineos_seo_semrush_upload', { last_updated: new Date().toISOString(), row_count: lines.length - 1, filename: file.name });
      Components.closeModal('modal-semrush');
      Components.showToast(`SEMrush CSV loaded: ${lines.length - 1} keywords.`, 'success');
      Events.log('seo_semrush_upload', { filename: file.name, row_count: lines.length - 1 });
      render(document.getElementById('content-area'));
    };
    reader.readAsText(file);
  }

  function renderPushList(targets) {
    const pushable = Object.entries(targets)
      .filter(([, d]) => d.current_position >= 4 && d.current_position <= 10)
      .map(([url, d]) => ({
        url: url.replace('globalair.com/', ''),
        position: d.current_position,
        target: 3,
        est_qi_gain: Math.round((d.current_position - 3) * 12),
        intervention: d.intervention,
        owner: d.owner
      }))
      .sort((a, b) => b.est_qi_gain - a.est_qi_gain);

    if (pushable.length === 0) return Components.emptyState('&#127942;', 'All target URLs either top-3 or 11+. Review rank targets.', '', null);

    const columns = [
      { key: 'url', label: 'URL', render: v => `<span style="font-size:12px;font-family:var(--ga-font-mono);">/${v}</span>` },
      { key: 'position', label: 'Position' },
      { key: 'target', label: 'Target' },
      { key: 'est_qi_gain', label: 'Est. QI Gain/mo', render: v => `<span class="cpqi-green">+${v}</span>` },
      { key: 'intervention', label: 'Intervention' },
      { key: 'owner', label: 'Owner' }
    ];
    return Components.table(columns, pushable, { id: 'seo-push-table', sortable: true });
  }

  function renderTechBlockers(crawlers, blockers) {
    let html = '<div class="row-grid row-grid-4">';
    // AI Crawlers
    const crawlerBlocked = Object.values(crawlers).some(c => c.status === 'blocked');
    html += Components.statusCard('AI Crawler Access', crawlerBlocked ? 'BLOCKED' : 'UNBLOCKED', {
      owner: 'Thomas Galla',
      cod: 'Zero AEO visibility',
      ticket: blockers.ai_crawler?.ticket_id || 'T2 ticket'
    });
    // Index Coverage
    html += Components.statusCard('Index Coverage', 'MONITORING', { owner: 'Casey', cod: 'Pending audit' });
    // Core Web Vitals
    html += Components.statusCard('Core Web Vitals', 'GREEN', { owner: 'Thomas Galla', cod: '<1% traffic impact' });
    // GTM Consistency
    html += Components.statusCard('GTM (8 servers)', 'PENDING AUDIT', { owner: 'Casey', cod: 'Conversion tags may misfire', ticket: 'Sprint 2 audit' });
    html += '</div>';
    return html;
  }

  function showCreateBrief(tier) {
    Components.showModal(Components.modal('Create SEO Brief — Q-Stack Format', `
      <div class="form-group"><label class="form-label">Target Keyword *</label><input class="form-input" id="brief-keyword" placeholder="e.g. used gulfstream for sale"></div>
      <div class="form-group"><label class="form-label">Intent Tier</label><input class="form-input" value="${tier}" readonly></div>
      <div class="form-group"><label class="form-label">Target Word Count</label><input class="form-input" id="brief-wordcount" value="500" type="number"></div>
      <div class="form-group"><label class="form-label">H1 Suggestion</label><input class="form-input" id="brief-h1" placeholder="Auto-generated from keyword"></div>
      <div class="form-group"><label class="form-label">H2 Outline</label><textarea class="form-textarea" id="brief-h2" placeholder="H2 sections..."></textarea></div>
      <div class="form-group"><label class="form-label">Internal Link Targets</label><input class="form-input" id="brief-links" placeholder="Pillar pages to link to"></div>
      <div class="form-group"><label class="form-label">AEO Requirements</label><input class="form-input" value="Q-Stack: direct answer first paragraph, FAQ schema" readonly></div>
    `, { id: 'modal-brief', wide: true, actions: [
      { label: 'Cancel', class: 'btn-ghost', onClick: "Components.closeModal('modal-brief')" },
      { label: 'Approve & Route to Jadda', class: 'btn-primary', onClick: 'SEOHub.approveBrief()' }
    ]}));
    Events.log('seo_brief_generate', { intent_tier: tier });
  }

  function approveBrief() {
    const keyword = document.getElementById('brief-keyword')?.value?.trim();
    if (!keyword) { Components.showToast('Keyword is required.', 'error'); return; }
    Components.closeModal('modal-brief');
    Components.showToast(`Brief for "${keyword}" routed to Jadda's queue.`, 'success');
    Events.log('seo_brief_approve', { keyword });
    // Update pipeline
    const pipeline = Store.get('avengineos_seo_pipeline') || {};
    pipeline.briefs_issued = (pipeline.briefs_issued || 0) + 1;
    pipeline.pending_brief = (pipeline.pending_brief || 0) + 1;
    Store.set('avengineos_seo_pipeline', pipeline);
  }

  function showPipelineInput() {
    const pipeline = Store.get('avengineos_seo_pipeline') || {};
    Components.showModal(Components.modal('Update Content Pipeline', `
      <p style="font-size:12px;color:var(--ga-muted);margin-bottom:16px;">Monday update — Casey input</p>
      <div class="form-group"><label class="form-label">Briefs Issued This Week</label><input class="form-input" id="pipe-briefs" type="number" value="${pipeline.briefs_issued || 0}"></div>
      <div class="form-group"><label class="form-label">Articles Published</label><input class="form-input" id="pipe-published" type="number" value="${pipeline.articles_published || 0}"></div>
      <div class="form-group"><label class="form-label">In Progress</label><input class="form-input" id="pipe-progress" type="number" value="${pipeline.in_progress || 0}"></div>
      <div class="form-group"><label class="form-label">Pending Brief</label><input class="form-input" id="pipe-pending" type="number" value="${pipeline.pending_brief || 0}"></div>
    `, { id: 'modal-pipeline', actions: [
      { label: 'Cancel', class: 'btn-ghost', onClick: "Components.closeModal('modal-pipeline')" },
      { label: 'Save', class: 'btn-primary', onClick: 'SEOHub.savePipeline()' }
    ]}));
  }

  function savePipeline() {
    const pipeline = Store.get('avengineos_seo_pipeline') || {};
    const prev = { ...pipeline };
    pipeline.briefs_issued = parseInt(document.getElementById('pipe-briefs')?.value) || 0;
    pipeline.articles_published = parseInt(document.getElementById('pipe-published')?.value) || 0;
    pipeline.in_progress = parseInt(document.getElementById('pipe-progress')?.value) || 0;
    pipeline.pending_brief = parseInt(document.getElementById('pipe-pending')?.value) || 0;
    const total = pipeline.briefs_issued + pipeline.articles_published;
    pipeline.evergreen_percent = total > 0 ? Math.round((pipeline.briefs_issued / total) * 100) : 0;
    pipeline.entries = pipeline.entries || [];
    pipeline.entries.push({ updated_at: new Date().toISOString(), updated_by: 'Casey', previous_value: prev, new_value: pipeline });
    Store.set('avengineos_seo_pipeline', pipeline);
    Components.closeModal('modal-pipeline');
    Components.showToast('Pipeline updated.', 'success');
    Events.log('seo_pipeline_manual_input', { briefs_issued: pipeline.briefs_issued, published: pipeline.articles_published });
    render(document.getElementById('content-area'));
  }

  return { render, showCreateBrief, approveBrief, showPipelineInput, savePipeline, showSemrushUpload, handleSemrushFile };
})();
