/* =====================================================================
   AvEngineOS — Data Bridge
   Import/export all localStorage data as JSON for portability,
   backup, and Windsor.ai pre-fetch hydration.
   ===================================================================== */

const DataBridge = (() => {
  const EXPORT_KEYS = [
    'engine_settings', 'engine_initialized',
    'avengineos_ppc_campaigns', 'avengineos_ppc_cpqi_thresholds',
    'avengineos_ppc_governance', 'avengineos_ppc_scaling_config',
    'avengineos_ppc_experiments',
    'avengineos_seo_date_range', 'avengineos_seo_rank_targets',
    'avengineos_seo_pipeline', 'avengineos_seo_ctr_thresholds',
    'avengineos_seo_blockers', 'avengineos_seo_crawlers',
    'avengineos_seo_semrush_upload',
    'avengineos_lst_stale_config', 'avengineos_lst_inventory',
    'engine_listings_csv', 'engine_csv_upload',
    'engine_mvs', 'engine_mvs_last_updated',
    'avengineos_mon_outreach_log', 'avengineos_mon_featured_config',
    'engine_opp_ppc', 'engine_opp_seo', 'engine_opp_listings', 'engine_opp_monetization',
    'engine_decision_log', 'engine_gaps',
    'windsor_cache', 'engine_event_log'
  ];

  function exportAll() {
    const snapshot = { _meta: { app: 'AvEngineOS', version: '1.0', exported_at: new Date().toISOString(), key_count: 0 } };
    EXPORT_KEYS.forEach(key => {
      const val = Store.get(key);
      if (val !== null) {
        snapshot[key] = val;
        snapshot._meta.key_count++;
      }
    });
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AvEngineOS_Export_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    Components.showToast(`Exported ${snapshot._meta.key_count} data keys.`, 'success');
    Events.log('data_bridge_export', { key_count: snapshot._meta.key_count });
    return snapshot;
  }

  function importAll(jsonStr) {
    let data;
    try {
      data = JSON.parse(jsonStr);
    } catch (e) {
      Components.showToast('Invalid JSON file. Import aborted.', 'error');
      return false;
    }
    if (!data._meta || data._meta.app !== 'AvEngineOS') {
      Components.showToast('Not a valid AvEngineOS export file.', 'error');
      return false;
    }
    let imported = 0;
    EXPORT_KEYS.forEach(key => {
      if (data[key] !== undefined) {
        Store.set(key, data[key]);
        imported++;
      }
    });
    Components.showToast(`Imported ${imported} data keys from ${Components.formatDate(data._meta.exported_at)}.`, 'success');
    Events.log('data_bridge_import', { key_count: imported, export_date: data._meta.exported_at });
    return true;
  }

  function importWindsorData(connector, jsonData) {
    if (!jsonData || !jsonData.data) {
      console.warn('[DataBridge] Invalid Windsor data format for', connector);
      return false;
    }
    Windsor.updateCache(connector, jsonData.data);

    // Map to domain-specific stores
    if (connector === 'google_ads') {
      mapAdsToCampaignMetrics(jsonData);
    } else if (connector === 'gsc' || connector === 'searchconsole') {
      mapGSCToRankTargets(jsonData);
    }

    Components.showToast(`Windsor ${connector} data imported: ${jsonData.data.length} rows.`, 'success');
    Events.log('data_bridge_windsor_import', { connector, row_count: jsonData.data.length });
    return true;
  }

  function mapAdsToCampaignMetrics(adsData) {
    const data = Store.get('avengineos_ppc_campaigns');
    if (!data?.campaigns || !adsData?.data) return;

    const mapping = { 'CESSNA': 'cessna', 'BEECHCRAFT': 'beechcraft', 'CIRRUS': 'cirrus', 'JET': 'jets' };

    adsData.data.forEach(row => {
      const campName = (row.campaign || '').toUpperCase();
      const key = Object.keys(mapping).find(k => campName.includes(k));
      if (!key) return;
      const campaign = data.campaigns.find(c => c.id === mapping[key]);
      if (!campaign) return;
      const impressions = row.impressions || 0;
      const clicks = row.clicks || 0;
      const conversions = row.conversions || 0;
      const spend = row.spend || row.cost || 0;
      campaign.metrics = {
        impressions,
        clicks,
        ctr: impressions > 0 ? parseFloat((clicks / impressions * 100).toFixed(1)) : 0,
        qis: conversions,
        cpqi: conversions > 0 ? Math.round(spend / conversions) : null,
        spend,
        date_range: adsData.date_range || '30d',
        last_updated: adsData.fetched_at || new Date().toISOString(),
        source: 'windsor'
      };
    });

    Store.set('avengineos_ppc_campaigns', data);
  }

  function mapGSCToRankTargets(gscData) {
    if (!gscData?.data) return;
    const targets = Store.get('avengineos_seo_rank_targets') || {};

    gscData.data.forEach(row => {
      const page = row.page || '';
      // Match by URL path
      const matchKey = Object.keys(targets).find(key => page.includes(key.replace('globalair.com', '')));
      if (!matchKey) return;
      const target = targets[matchKey];
      if (row.position != null) {
        const oldPos = target.current_position;
        target.current_position = parseFloat(row.position.toFixed(1));
        target.wow_delta = parseFloat((target.current_position - oldPos).toFixed(1));
        target.last_moved = new Date().toISOString().split('T')[0];
      }
    });

    Store.set('avengineos_seo_rank_targets', targets);
  }

  function showImportDialog() {
    Components.showModal(Components.modal('Import AvEngineOS Data', `
      <div class="csv-dropzone" id="import-dropzone" onclick="document.getElementById('import-file').click()">
        <div class="csv-dropzone-icon">&#128230;</div>
        <div class="csv-dropzone-text">Drag & drop AvEngineOS JSON export, or click to browse</div>
        <div style="font-size:11px;color:var(--ga-muted);margin-top:8px;">Accepts .json files exported from AvEngineOS</div>
      </div>
      <input type="file" id="import-file" accept=".json" style="display:none" onchange="DataBridge.handleImportFile(this)">
    `, { id: 'modal-import', actions: [
      { label: 'Cancel', class: 'btn-ghost', onClick: "Components.closeModal('modal-import')" }
    ]}));
  }

  function handleImportFile(input) {
    if (!input.files[0]) return;
    const reader = new FileReader();
    reader.onload = function(e) {
      const success = importAll(e.target.result);
      if (success) {
        Components.closeModal('modal-import');
        // Refresh current page
        Router.navigate(Router.getCurrent());
        renderTopbar();
        updateNavBadges();
      }
    };
    reader.readAsText(input.files[0]);
  }

  return {
    exportAll, importAll, importWindsorData,
    mapAdsToCampaignMetrics, mapGSCToRankTargets,
    showImportDialog, handleImportFile,
    EXPORT_KEYS
  };
})();
