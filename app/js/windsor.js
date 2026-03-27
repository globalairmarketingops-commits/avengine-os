/* =====================================================================
   AvEngineOS — Windsor.ai Integration Layer
   Data fetch abstraction with cache, staleness handling, and
   pre-fetched JSON hydration for GitHub Pages deployment.
   ===================================================================== */

const Windsor = (() => {
  const CACHE_KEY = 'windsor_cache';
  const CACHE_TTL_HOURS = 24;
  const STALE_THRESHOLD_HOURS = 48;

  // Pre-fetched JSON file paths (populated by Claude Code Windsor MCP fetch)
  const DATA_FILES = {
    google_ads: 'data/google_ads_campaigns.json',
    ga4: 'data/ga4_channels.json',
    gsc: 'data/gsc_portfolio.json'
  };

  function getCache() {
    return Store.get(CACHE_KEY) || {
      google_ads: { timestamp: null, data: null },
      ga4: { timestamp: null, data: null },
      gsc: { timestamp: null, data: null }
    };
  }

  function getCachedData(connector) {
    const cache = getCache();
    return cache[connector]?.data || null;
  }

  function getCacheAge(connector) {
    const cache = getCache();
    const ts = cache[connector]?.timestamp;
    if (!ts) return null;
    return (Date.now() - new Date(ts).getTime()) / (1000 * 60 * 60);
  }

  function isStale(connector) {
    const age = getCacheAge(connector);
    if (age === null) return true;
    return age > STALE_THRESHOLD_HOURS;
  }

  function isFresh(connector) {
    const age = getCacheAge(connector);
    if (age === null) return false;
    return age <= CACHE_TTL_HOURS;
  }

  function getStatus(connector) {
    const age = getCacheAge(connector);
    if (age === null) return 'pending';
    if (age <= CACHE_TTL_HOURS) return 'fresh';
    if (age <= STALE_THRESHOLD_HOURS) return 'aging';
    return 'stale';
  }

  // Fetch functions — return cached data, log for MCP wiring visibility
  function fetchGoogleAds(accounts, fields, dateRange) {
    console.log('[Windsor] fetchGoogleAds', { accounts, fields, dateRange });
    return getCachedData('google_ads');
  }

  function fetchGA4(accounts, fields, dateRange, cleanChannelOnly = true) {
    console.log('[Windsor] fetchGA4', { accounts, fields, dateRange, cleanChannelOnly });
    return getCachedData('ga4');
  }

  function fetchGSC(accounts, fields, dateRange) {
    console.log('[Windsor] fetchGSC', { accounts, fields, dateRange });
    return getCachedData('gsc');
  }

  function updateCache(connector, data) {
    const cache = getCache();
    cache[connector] = {
      timestamp: new Date().toISOString(),
      data: data
    };
    Store.set(CACHE_KEY, cache);
  }

  // Check if opportunity engine should be suspended for a domain
  function isDomainSuspended(domain) {
    const domainConnectors = {
      ppc: ['google_ads', 'ga4'],
      seo: ['gsc'],
      listings: [],
      monetization: []
    };
    const connectors = domainConnectors[domain] || [];
    return connectors.some(c => isStale(c));
  }

  /* ================================================================
     HYDRATION — Load pre-fetched JSON files into localStorage cache.
     Called on boot. Silently skips if files don't exist (seed mode).
     ================================================================ */

  async function hydrate() {
    let hydrated = 0;

    for (const [connector, filePath] of Object.entries(DATA_FILES)) {
      try {
        const resp = await fetch(filePath);
        if (!resp.ok) {
          console.log(`[Windsor] No pre-fetched data for ${connector} (${resp.status})`);
          continue;
        }
        const json = await resp.json();
        if (!json || !json.data) {
          console.warn(`[Windsor] Invalid data format in ${filePath}`);
          continue;
        }

        // Update Windsor cache
        updateCache(connector, json.data);

        // Map to domain-specific stores
        if (connector === 'google_ads' && typeof DataBridge !== 'undefined') {
          DataBridge.mapAdsToCampaignMetrics(json);
        } else if (connector === 'gsc' && typeof DataBridge !== 'undefined') {
          DataBridge.mapGSCToRankTargets(json);
        }

        hydrated++;
        console.log(`[Windsor] Hydrated ${connector}: ${json.data.length} rows`);
      } catch (e) {
        console.log(`[Windsor] Hydrate skip for ${connector}:`, e.message);
      }
    }

    if (hydrated > 0) {
      console.log(`[Windsor] Hydration complete: ${hydrated}/${Object.keys(DATA_FILES).length} connectors loaded`);
    } else {
      console.log('[Windsor] Running on seed/cached data — no pre-fetched JSON files found');
    }

    return hydrated;
  }

  /* ================================================================
     DATA HEALTH — Summary of all connector statuses for Command Center
     ================================================================ */

  function getHealthSummary() {
    const connectors = ['google_ads', 'ga4', 'gsc'];
    return connectors.map(c => ({
      connector: c,
      status: getStatus(c),
      age_hours: getCacheAge(c),
      has_data: getCachedData(c) !== null,
      row_count: (getCachedData(c) || []).length
    }));
  }

  return {
    getCache, getCachedData, getCacheAge,
    isStale, isFresh, getStatus, isDomainSuspended,
    fetchGoogleAds, fetchGA4, fetchGSC,
    updateCache, hydrate, getHealthSummary,
    CACHE_TTL_HOURS, STALE_THRESHOLD_HOURS
  };
})();
