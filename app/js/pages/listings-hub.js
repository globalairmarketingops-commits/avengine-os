/* =====================================================================
   AvEngineOS — Page 04: Listings Hub
   Inventory Health & Quality Layer. Per Page_04_Listings_Hub_Spec_v1.0
   ===================================================================== */

const ListingsHub = (() => {

  function render(container) {
    const listings = Store.get('engine_listings_csv') || [];
    const csvUpload = Store.get('engine_csv_upload') || {};
    const staleConfig = Store.get('avengineos_lst_stale_config') || {};
    const hasData = listings.length > 0;

    let html = '<div class="domain-page">';

    // ---- PART A: Domain Health ----
    html += '<div class="domain-part">';
    html += Components.partHeader('Part A', 'Domain Health — Listings');

    if (!hasData) {
      html += Components.alertBanner('No listing data loaded. Upload a CSV to populate the Listings Hub.', 'warning');
    } else if (Store.isStale('engine_csv_upload', 7)) {
      html += Components.alertBanner(`DATA NOT REFRESHED — last upload: ${Components.formatDate(csvUpload.last_upload_date)}. Opportunity engine suppressed.`, 'error');
    }

    // Inventory by Category
    html += '<h4 style="margin:12px 0 8px;font-size:14px;font-weight:600;color:var(--ga-navy);">Inventory by Category</h4>';
    html += renderInventory(listings);

    // Freshness Distribution
    html += '<h4 style="margin:20px 0 8px;font-size:14px;font-weight:600;color:var(--ga-navy);">Freshness Distribution</h4>';
    html += renderFreshness(listings);

    // Featured vs Standard
    html += '<h4 style="margin:20px 0 8px;font-size:14px;font-weight:600;color:var(--ga-navy);">Featured vs Standard</h4>';
    html += renderFeatured(listings);

    html += '</div>';

    // ---- PART B: Diagnostics ----
    html += '<div class="domain-part">';
    html += Components.partHeader('Part B', 'Diagnostics');

    // Broker Activity (US-LST-008)
    html += '<h4 style="margin:12px 0 8px;font-size:14px;font-weight:600;color:var(--ga-navy);">Broker Health Table</h4>';
    html += renderBrokerHealth(listings);

    // Photo/Spec Quality
    html += '<h4 style="margin:20px 0 8px;font-size:14px;font-weight:600;color:var(--ga-navy);">Quality Flags</h4>';
    html += renderQualityFlags(listings);

    html += '</div>';

    // ---- PART C: Action Stack ----
    html += '<div class="domain-part">';
    html += Components.partHeader('Part C', 'Action Stack');

    // CSV Upload
    html += '<h4 style="margin:12px 0 8px;font-size:14px;font-weight:600;color:var(--ga-navy);">CSV Upload</h4>';
    html += renderCSVUpload(csvUpload);

    // Listings Opportunities
    html += '<h4 style="margin:20px 0 8px;font-size:14px;font-weight:600;color:var(--ga-navy);">Listings Opportunities</h4>';
    const lstOpps = Opportunity.getByDomain('listings');
    if (lstOpps.length === 0) {
      html += Components.emptyState('&#127919;', 'No listing opportunities. Upload CSV to populate.', '', null);
    } else {
      const cols = [
        { key: 'score', label: 'Score', render: (v, row) => `<strong>${Opportunity.scoreDisplay(row)}</strong>` },
        { key: 'name', label: 'Opportunity' },
        { key: 'owner', label: 'Owner' },
        { key: 'cod', label: 'COD' },
        { key: 'status', label: 'Status', render: v => Components.badge(v, Components.statusColor(v)) }
      ];
      html += Components.table(cols, lstOpps, { id: 'lst-opp-table', sortable: true });
    }

    // Listings Gaps
    html += '<h4 style="margin:20px 0 8px;font-size:14px;font-weight:600;color:var(--ga-navy);">Listings Gaps</h4>';
    const lstGaps = Gaps.getByDomain('listings');
    if (lstGaps.length > 0) {
      const gapCols = [
        { key: 'description', label: 'Gap' },
        { key: 'status', label: 'Status', render: v => Components.badge(v, Components.statusColor(v)) },
        { key: 'cod', label: 'COD' },
        { key: 'owner', label: 'Owner' }
      ];
      html += Components.table(gapCols, lstGaps, { id: 'lst-gaps-table' });
    } else {
      html += Components.emptyState('&#9989;', 'No listing gaps.', '', null);
    }

    html += '</div></div>';
    container.innerHTML = html;

    // Bind CSV drag and drop
    const dropzone = container.querySelector('#csv-dropzone');
    if (dropzone) {
      dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('dragover'); });
      dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
      dropzone.addEventListener('drop', (e) => { e.preventDefault(); dropzone.classList.remove('dragover'); handleCSV(e.dataTransfer.files[0]); });
      dropzone.addEventListener('click', () => document.getElementById('csv-file-input')?.click());
    }

    Events.log('lst_inventory_view', { listing_count: listings.length, has_data: hasData });
  }

  function renderInventory(listings) {
    if (listings.length === 0) {
      return '<div class="row-grid row-grid-4">' +
        ['Jet', 'Piston', 'Helicopter', 'Turboprop'].map(c =>
          Components.kpiTile(c, '—', { confidence: 'PENDING', subtitle: 'Upload CSV' })
        ).join('') + '</div>';
    }
    const cats = {};
    listings.forEach(l => {
      const cat = (l.category || 'other').toLowerCase();
      cats[cat] = (cats[cat] || 0) + 1;
    });
    let html = '<div class="row-grid row-grid-4">';
    ['jet', 'piston', 'helicopter', 'turboprop'].forEach(c => {
      html += Components.kpiTile(c.charAt(0).toUpperCase() + c.slice(1), (cats[c] || 0).toString(), {
        confidence: 'CONFIRMED',
        subtitle: `${((cats[c] || 0) / Math.max(listings.length, 1) * 100).toFixed(0)}% of total`
      });
    });
    html += '</div>';
    return html;
  }

  function renderFreshness(listings) {
    if (listings.length === 0) return Components.emptyState('&#128197;', 'No freshness data. Upload CSV.', '', null);
    const buckets = { '<30d': 0, '30-90d': 0, '90-180d': 0, '180+d': 0 };
    listings.forEach(l => {
      const days = l.days_since_update || 0;
      if (days < 30) buckets['<30d']++;
      else if (days < 90) buckets['30-90d']++;
      else if (days < 180) buckets['90-180d']++;
      else buckets['180+d']++;
    });
    let html = '<div class="row-grid row-grid-4">';
    Object.entries(buckets).forEach(([label, count]) => {
      const color = label === '<30d' ? 'green' : label === '30-90d' ? 'amber' : 'red';
      html += `<div class="ga-card" style="padding:14px;text-align:center;">
        <div style="font-size:24px;font-weight:700;color:var(--ga-${color === 'green' ? 'green-dark' : color === 'amber' ? 'amber' : 'red'});">${count}</div>
        <div style="font-size:12px;color:var(--ga-muted);">${label}</div>
      </div>`;
    });
    html += '</div>';
    return html;
  }

  function renderFeatured(listings) {
    if (listings.length === 0) return Components.emptyState('&#11088;', 'No featured data.', '', null);
    const featured = listings.filter(l => l.featured).length;
    const standard = listings.length - featured;
    return `<div class="row-grid row-grid-3">
      ${Components.kpiTile('Featured', featured.toString(), { subtitle: `${(featured / listings.length * 100).toFixed(0)}% of total` })}
      ${Components.kpiTile('Standard', standard.toString(), { subtitle: `${(standard / listings.length * 100).toFixed(0)}% of total` })}
      ${Components.gauge(featured, listings.length, { label: 'Fill Rate', thresholds: { red: 60, amber: 80 } })}
    </div>`;
  }

  function renderBrokerHealth(listings) {
    if (listings.length === 0) return Components.emptyState('&#129309;', 'No broker data. Upload CSV.', '', null);
    const brokers = {};
    listings.forEach(l => {
      const bid = l.account_id || 'unknown';
      if (!brokers[bid]) brokers[bid] = { account_id: bid, listing_count: 0, stale: 0, total_photos: 0, total_spec: 0 };
      brokers[bid].listing_count++;
      if ((l.days_since_update || 0) > 14) brokers[bid].stale++;
      brokers[bid].total_photos += (l.photo_count || 0);
      brokers[bid].total_spec += (l.spec_completeness_score || 0);
    });
    const rows = Object.values(brokers).map(b => ({
      ...b,
      freshness: `${((1 - b.stale / b.listing_count) * 100).toFixed(0)}%`,
      avg_photos: (b.total_photos / b.listing_count).toFixed(1),
      avg_spec: `${(b.total_spec / b.listing_count).toFixed(0)}%`,
      at_risk: b.stale / b.listing_count > 0.5
    }));
    const columns = [
      { key: 'account_id', label: 'Broker ID' },
      { key: 'listing_count', label: 'Listings' },
      { key: 'freshness', label: 'Freshness' },
      { key: 'avg_photos', label: 'Avg Photos' },
      { key: 'avg_spec', label: 'Avg Spec' },
      { key: 'at_risk', label: 'Status', render: v => v ? Components.badge('AT RISK', 'red') : Components.badge('Healthy', 'green') }
    ];
    return Components.table(columns, rows, { id: 'lst-broker-table', sortable: true });
  }

  function renderQualityFlags(listings) {
    if (listings.length === 0) return Components.emptyState('&#128247;', 'No quality data.', '', null);
    const noPhoto = listings.filter(l => (l.photo_count || 0) === 0).length;
    const lowPhoto = listings.filter(l => (l.photo_count || 0) > 0 && (l.photo_count || 0) < 3).length;
    const noPrice = listings.filter(l => l.price == null).length;
    const lowSpec = listings.filter(l => (l.spec_completeness_score || 0) < 50).length;
    return `<div class="row-grid row-grid-4">
      ${Components.kpiTile('No Photos', noPhoto.toString(), { subtitle: 'Red severity', confidence: noPhoto > 0 ? 'ESTIMATE' : 'CONFIRMED' })}
      ${Components.kpiTile('Low Photos (<3)', lowPhoto.toString(), { subtitle: 'Amber severity' })}
      ${Components.kpiTile('No Price', noPrice.toString(), { subtitle: 'Call for Price' })}
      ${Components.kpiTile('Low Spec (<50%)', lowSpec.toString(), { subtitle: 'Missing key fields' })}
    </div>`;
  }

  function renderCSVUpload(csvUpload) {
    return `<div class="csv-dropzone" id="csv-dropzone">
      <div class="csv-dropzone-icon">&#128196;</div>
      <div class="csv-dropzone-text">Drag & drop listing CSV here, or click to browse</div>
      <div style="font-size:11px;color:var(--ga-muted);margin-top:8px;">
        Required: account_id, listing_id, make, model, year, price, photo_count, featured, days_since_update, spec_completeness_score
      </div>
      ${csvUpload.last_upload_date ? `<div style="font-size:11px;color:var(--ga-muted);margin-top:6px;">Last upload: ${Components.formatDate(csvUpload.last_upload_date)} (${csvUpload.row_count} rows)</div>` : ''}
    </div>
    <input type="file" id="csv-file-input" accept=".csv" style="display:none" onchange="ListingsHub.handleFileInput(this)">`;
  }

  function handleFileInput(input) {
    if (input.files[0]) handleCSV(input.files[0]);
  }

  function handleCSV(file) {
    if (!file || !file.name.endsWith('.csv')) {
      Components.showToast('Please upload a .csv file.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = function(e) {
      const text = e.target.result;
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length < 2) { Components.showToast('CSV contains no data rows. Verify export and retry.', 'error'); return; }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const required = ['account_id', 'listing_id', 'make', 'model', 'year', 'price', 'photo_count', 'featured', 'days_since_update', 'spec_completeness_score'];
      const missing = required.filter(r => !headers.includes(r));

      const rows = [];
      for (let i = 1; i < lines.length; i++) {
        const vals = lines[i].split(',');
        const row = {};
        headers.forEach((h, idx) => {
          let val = (vals[idx] || '').trim();
          if (['price', 'photo_count', 'year', 'days_since_update', 'spec_completeness_score'].includes(h)) {
            val = val === '' || val === 'null' ? null : parseFloat(val);
          }
          if (h === 'featured') val = val === 'true' || val === '1' || val === 'TRUE';
          row[h] = val;
        });
        if (row.account_id) rows.push(row);
      }

      // De-dupe by listing_id
      const seen = new Set();
      const deduped = rows.filter(r => {
        if (!r.listing_id || seen.has(r.listing_id)) return false;
        seen.add(r.listing_id);
        return true;
      });

      Store.set('engine_listings_csv', deduped);
      Store.set('engine_csv_upload', {
        last_upload_date: new Date().toISOString(),
        row_count: deduped.length,
        missing_columns: missing
      });

      Events.log('engine_cmd_csv_upload', { filename: file.name, row_count: deduped.length, missing_columns: missing });

      if (missing.length > 0) {
        Components.showToast(`CSV loaded with ${deduped.length} rows. Missing columns: ${missing.join(', ')}`, 'error');
      } else {
        Components.showToast(`CSV loaded successfully: ${deduped.length} listings.`, 'success');
      }
      render(document.getElementById('content-area'));
    };
    reader.readAsText(file);
  }

  return { render, handleFileInput, handleCSV };
})();
