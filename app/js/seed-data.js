/* =====================================================================
   AvEngineOS — Seed Data & First-Launch Initialization
   Runs exactly once on first load. All schemas from Page 01-08 specs.
   ===================================================================== */

const SeedData = (() => {
  function initialize() {
    if (Store.isInitialized()) return;
    console.log('[AvEngineOS] First launch — initializing seed data...');

    // G.2 — Gate Settings (from Page 01 spec)
    Store.set('engine_settings', {
      conversion_signal_status: { status: 'UNCONFIRMED', owner: 'Casey', ticket_ref: null, cod_per_day: '$225', last_updated: '2026-03-21', updated_by: 'system' },
      call_tracking_active: { status: 'NOT_ACTIVE', owner: 'Casey', ticket_ref: null, cod_per_day: 'T4 QIs invisible', last_updated: '2026-03-21', updated_by: 'system' },
      gclid_capture_status: { status: 'BLOCKED', owner: 'Dev Team', ticket_ref: 'Sprint 2 backlog', cod_per_day: 'Cross-device de-dupe impossible', last_updated: '2026-03-21', updated_by: 'system' },
      enhanced_conversions_status: { status: 'UNCONFIRMED', owner: 'Casey', ticket_ref: 'Sprint 1 audit', cod_per_day: 'Attribution gap', last_updated: '2026-03-21', updated_by: 'system' },
      ai_crawler_status: { status: 'BLOCKED', owner: 'Thomas Galla', ticket_ref: 'T2 ticket open', cod_per_day: 'Zero AEO visibility', last_updated: '2026-03-21', updated_by: 'system' },
      signal_clean_only: true,
      category_filter: 'all',
      date_range: '7d',
      compare_mode: 'wow',
      featured_price_per_week: null
    });

    // PPC — Campaign config (from Page 02 spec)
    Store.set('avengineos_ppc_campaigns', {
      campaigns: [
        { id: 'cessna', name: 'Cessna (Piston)', daily_budget: 75, segment: 'piston', status: 'active',
          metrics: { impressions: 2340, clicks: 65, ctr: 2.8, qis: 3, cpqi: 52, spend: 156, date_range: '7d', last_updated: '2026-03-21T00:00:00Z', source: 'seed' } },
        { id: 'beechcraft', name: 'Beechcraft (Piston)', daily_budget: 75, segment: 'piston', status: 'active',
          metrics: { impressions: 1890, clicks: 48, ctr: 2.5, qis: 2, cpqi: 58, spend: 116, date_range: '7d', last_updated: '2026-03-21T00:00:00Z', source: 'seed' } },
        { id: 'cirrus', name: 'Cirrus (Piston)', daily_budget: 75, segment: 'piston', status: 'active',
          metrics: { impressions: 1650, clicks: 52, ctr: 3.1, qis: 2, cpqi: 47, spend: 94, date_range: '7d', last_updated: '2026-03-21T00:00:00Z', source: 'seed' } },
        { id: 'jets', name: 'Jets', daily_budget: 0, segment: 'jet', status: 'on_hold', hold_reason: 'Signal cleanup required',
          metrics: null }
      ], version: 1
    });

    // PPC — CPQI thresholds
    Store.set('avengineos_ppc_cpqi_thresholds', {
      piston: { target: 45, ceiling: 75 }, jet: { target: 120, ceiling: 200 },
      helicopter: { target: 60, ceiling: 100 }, turboprop: { target: 80, ceiling: 140 },
      updated_at: '2026-03-21T00:00:00Z', updated_by: 'casey'
    });

    // PPC — Governance state
    Store.set('avengineos_ppc_governance', {
      layers: [
        { id: 1, name: 'Economic Viability', status: 'red', auto: true, override: null },
        { id: 2, name: 'Signal Integrity', status: 'red', auto: true, override: null },
        { id: 3, name: 'Lead Quality', status: 'red', auto: false, override: null },
        { id: 4, name: 'Structure', status: 'yellow', auto: false, override: null },
        { id: 5, name: 'Scaling Math', status: 'red', auto: true, override: null },
        { id: 6, name: 'Portfolio Allocation', status: 'red', auto: false, override: null },
        { id: 7, name: 'Experiments', status: 'green', auto: false, override: null }
      ], scaling_approved: false, last_updated: '2026-03-21T00:00:00Z'
    });

    // PPC — Scaling config
    Store.set('avengineos_ppc_scaling_config', {
      degradation_rate: 0.15, is_loss_budget_threshold: 0.20,
      projection_tiers: [2, 5, 10], custom_enabled: true
    });

    // PPC — Experiments
    Store.set('avengineos_ppc_experiments', { experiments: [], version: 1 });

    // SEO — Seeds
    Store.set('avengineos_seo_date_range', { range: '30d', updated_at: new Date().toISOString(), updated_by: 'system' });
    Store.set('avengineos_seo_rank_targets', {
      'globalair.com/private-jets-for-sale': { target_position: 3, current_position: 15.2, category: 'jet', intervention: 'Content depth + internal links', owner: 'Casey', wow_delta: -0.3, last_moved: '2026-03-15' },
      'globalair.com/cessna-aircraft-for-sale': { target_position: 3, current_position: 5.4, category: 'piston', intervention: 'Title rewrite', owner: 'Casey', wow_delta: 0.8, last_moved: '2026-03-18' },
      'globalair.com/helicopters-for-sale': { target_position: 1, current_position: 1.8, category: 'helicopter', intervention: 'Protect position', owner: 'Casey', wow_delta: 0.1, last_moved: '2026-03-20' },
      'globalair.com/beechcraft-for-sale': { target_position: 3, current_position: 7.1, category: 'piston', intervention: 'Internal links + schema', owner: 'Jadda', wow_delta: 1.2, last_moved: '2026-03-12' },
      'globalair.com/turboprop-aircraft': { target_position: 5, current_position: 8.9, category: 'turboprop', intervention: 'Content expansion', owner: 'Jadda', wow_delta: -0.5, last_moved: '2026-03-10' }
    });
    Store.set('avengineos_seo_pipeline', {
      week: '2026-03-17', briefs_issued: 1, articles_published: 12, in_progress: 2, pending_brief: 0,
      evergreen_percent: 8, entries: [{ updated_at: '2026-03-17T09:00:00Z', updated_by: 'Casey', previous_value: null, new_value: { briefs_issued: 1 } }]
    });
    Store.set('avengineos_seo_ctr_thresholds', {
      jets: { decline_threshold: 0.10, red_threshold: 0.15 }, piston: { decline_threshold: 0.12, red_threshold: 0.20 },
      helicopter: { decline_threshold: 0.08, red_threshold: 0.12 }, turboprop: { decline_threshold: 0.10, red_threshold: 0.15 }
    });
    Store.set('avengineos_seo_blockers', {
      ai_crawler: { status: 'blocked', ticket_id: 'T2-1847', owner: 'Thomas Galla', due_date: 'TBD', cost_of_delay: 'Zero AEO visibility until resolved' }
    });
    Store.set('avengineos_seo_crawlers', {
      GPTBot: { status: 'blocked' }, ClaudeBot: { status: 'blocked' }, PerplexityBot: { status: 'blocked' },
      YouBot: { status: 'blocked' }, CCBot: { status: 'blocked' }
    });

    // Listings — Seeds
    Store.set('avengineos_lst_stale_config', { jet: 14, piston: 7, helicopter: 14, turboprop: 14 });
    Store.set('avengineos_lst_inventory', { last_updated: null });
    Store.set('engine_listings_csv', []);
    Store.set('engine_csv_upload', { last_upload_date: null, row_count: 0, missing_columns: [] });

    // Monetization — MVS seed accounts
    Store.set('engine_mvs', [
      { account_id: 'BRK-001', broker_name: 'Atlantic Aviation Group', contact_name: 'Mike Reynolds', contact_email: 'mreynolds@atlanticaviation.com', listings_mrr: 850, featured_mrr: 500, display_mrr: 0, brokernet_mrr: 200, sponsorship_mrr: 0, fbo_mrr: 0, event_mrr: 0, renewal_date: '2026-04-15', last_contact_date: '2026-03-10', account_status: 'Active', flag_priority: null, customer_segment: 'jet', featured_tier: 'Featured' },
      { account_id: 'BRK-002', broker_name: 'Midwest Piston Sales', contact_name: 'Tom Bradley', contact_email: 'tbradley@midwestpiston.com', listings_mrr: 400, featured_mrr: 0, display_mrr: 0, brokernet_mrr: 200, sponsorship_mrr: 0, fbo_mrr: 0, event_mrr: 0, renewal_date: '2026-04-05', last_contact_date: '2026-02-20', account_status: 'At Risk', flag_priority: 1, customer_segment: 'piston', featured_tier: 'Standard' },
      { account_id: 'BRK-003', broker_name: 'SkyBridge Jets', contact_name: 'Sarah Chen', contact_email: 'schen@skybridgejets.com', listings_mrr: 1200, featured_mrr: 750, display_mrr: 200, brokernet_mrr: 200, sponsorship_mrr: 0, fbo_mrr: 0, event_mrr: 0, renewal_date: '2026-06-01', last_contact_date: '2026-03-18', account_status: 'Active', flag_priority: null, customer_segment: 'jet', featured_tier: 'Featured' },
      { account_id: 'BRK-004', broker_name: 'Heritage Rotorcraft', contact_name: 'Dave Kowalski', contact_email: 'dkowalski@heritagerotors.com', listings_mrr: 600, featured_mrr: 0, display_mrr: 0, brokernet_mrr: 0, sponsorship_mrr: 0, fbo_mrr: 0, event_mrr: 0, renewal_date: '2026-05-15', last_contact_date: '2026-03-05', account_status: 'Active', flag_priority: null, customer_segment: 'helicopter', featured_tier: 'Standard' },
      { account_id: 'FBO-001', broker_name: 'Louisville Executive Aviation', contact_name: 'Karen Mitchell', contact_email: 'kmitchell@louexecav.com', listings_mrr: 0, featured_mrr: 0, display_mrr: 300, brokernet_mrr: 0, sponsorship_mrr: 500, fbo_mrr: 400, event_mrr: 0, renewal_date: '2026-07-01', last_contact_date: '2026-03-15', account_status: 'Active', flag_priority: null, customer_segment: 'fbo', featured_tier: 'Standard' }
    ]);
    Store.set('engine_mvs_last_updated', new Date().toISOString());
    Store.set('avengineos_mon_outreach_log', []);
    Store.set('avengineos_mon_featured_config', { total_slots: 50, filled_slots: 35, avg_featured_price_monthly: 500 });

    // G.3 — Opportunity Queue Seed (5 items from system doc tables)
    Store.set('engine_opp_ppc', [
      { id: 'OPP-PPC-001', domain: 'ppc', name: 'High Impression / Low CTR — Cessna Ad Group', diagnosis: 'Headline intent mismatch on Cessna broad match group', action: 'RSA rewrite via Copy Intelligence queue', owner: 'Casey', eta: '2026-03-28', stop_loss: 'CTR < 2% after 7 days', success_metric: 'CTR increase to 4%+', cod: '$18/day QI loss', sprint: 'S1', impact: 8, urgency: 8, effort: 3, status: 'Open', category: 'piston' },
      { id: 'OPP-PPC-002', domain: 'ppc', name: 'Wasted Spend — Zero-Conversion Terms', diagnosis: 'Search terms consuming $12/day with zero conversions over 14 days', action: 'Add to negative keyword queue', owner: 'Casey', eta: '2026-03-25', stop_loss: null, success_metric: 'Eliminate $12/day waste', cod: '$12/day wasted', sprint: 'S1', impact: 6, urgency: 9, effort: 2, status: 'Open', category: 'piston' }
    ]);
    Store.set('engine_opp_seo', [
      { id: 'OPP-SEO-001', domain: 'seo', name: 'Private Jet Page — Position 15.2', diagnosis: 'Primary commercial page stuck outside top 10. Estimated 300+ impressions/day lost.', action: 'Content depth expansion + internal link push', owner: 'Jadda', eta: '2026-04-15', stop_loss: 'No movement after 30 days', success_metric: 'Position 1-5', cod: '300+ impressions/day', sprint: 'S2', impact: 9, urgency: 7, effort: 6, status: 'Open', category: 'jet' }
    ]);
    Store.set('engine_opp_listings', [
      { id: 'OPP-LST-001', domain: 'listings', name: 'Stale Piston Listings — At-Risk Broker', diagnosis: 'Midwest Piston Sales listings not updated in 30+ days. At-risk account with renewal April 5.', action: 'Ian outreach — listing refresh + renewal conversation', owner: 'Ian', eta: '2026-03-25', stop_loss: null, success_metric: 'Listings refreshed, renewal secured', cod: '$600/month MRR at risk', sprint: 'S1', impact: 9, urgency: 10, effort: 3, status: 'Open', category: 'piston' }
    ]);
    Store.set('engine_opp_monetization', [
      { id: 'OPP-MON-001', domain: 'monetization', name: 'Featured Upgrade — Heritage Rotorcraft', diagnosis: 'Standard tier with strong listing activity and 85% spec completeness. Featured upgrade candidate.', action: 'Ian outreach with performance data + featured ROI case', owner: 'Ian', eta: '2026-04-01', stop_loss: null, success_metric: '+$500/month featured MRR', cod: '$125/week leakage', sprint: 'S1', impact: 7, urgency: 5, effort: 3, status: 'Open', category: 'helicopter' }
    ]);

    // G.4 — Decision Log Seed
    Store.set('engine_decision_log', [
      { id: 'DEC-001', date: '2026-03-21T10:00:00Z', domain: 'ppc', decision: 'Held all three piston campaigns at $75/day — no scaling until signal confirmed clean', reason: 'Conversion signal UNCONFIRMED. Layer 2 gate red. Scaling on contaminated signal creates false precision.', owner: 'Casey', expected_outcome: 'Signal cleanup completes Sprint 1. Scaling decisions resume Sprint 2.', stop_loss: null, outcome: null, is_experiment: false },
      { id: 'DEC-002', date: '2026-03-21T14:00:00Z', domain: 'seo', decision: 'Redirected Jadda from reactive news to keyword-targeted evergreen briefs', reason: 'Content mix 100% reactive. Target is 80/20. Zero evergreen briefs produced per week. 25.3K keyword gap vs Controller.', owner: 'Casey', expected_outcome: '3-4 evergreen briefs/week by end of Sprint 1. First brief published by April 4.', stop_loss: null, outcome: null, is_experiment: false }
    ]);

    // Gaps Log Seed (from System Doc v2.0 Section 10)
    Store.set('engine_gaps', [
      { id: 'GAP-001', domain: 'ppc', description: 'Conversion actions / GA4 signal quality', status: 'Open', blocks_scaling: true, cod: '$225/day unverifiable spend', owner: 'Casey', ticket_ref: 'Sprint 1 priority', resolution_path: 'Audit conversion actions, confirm form submission tracking, replace call-click as primary', last_updated: '2026-03-21' },
      { id: 'GAP-002', domain: 'ppc', description: 'Call tracking — NOT ACTIVE (CallRail ~$50/month)', status: 'Blocked', blocks_scaling: true, cod: 'T4 QIs invisible — lead quality unscored', owner: 'Casey', ticket_ref: 'Sprint 2 target', resolution_path: 'Activate CallRail, configure 90s threshold, integrate with GA4', last_updated: '2026-03-21' },
      { id: 'GAP-003', domain: 'ppc', description: 'gclid/UTM capture in CRM', status: 'Blocked', blocks_scaling: true, cod: 'Cross-device de-dupe impossible', owner: 'Dev Team', ticket_ref: 'Awaiting dev sprint', resolution_path: 'Build gclid capture into CRM form handler', last_updated: '2026-03-21' },
      { id: 'GAP-004', domain: 'ppc', description: 'Enhanced conversions status', status: 'Open', blocks_scaling: false, cod: 'Attribution gap — unknown size', owner: 'Casey', ticket_ref: 'Sprint 1 audit', resolution_path: 'Audit Google Ads enhanced conversions setup', last_updated: '2026-03-21' },
      { id: 'GAP-005', domain: 'seo', description: 'AI crawler unblock (robots.txt + WAF)', status: 'Blocked', blocks_scaling: false, cod: 'Zero AEO citation visibility', owner: 'Thomas Galla', ticket_ref: 'T2 ticket open', resolution_path: 'Whitelist GPTBot, ClaudeBot, PerplexityBot in robots.txt and WAF', last_updated: '2026-03-21' },
      { id: 'GAP-006', domain: 'seo', description: 'Jadda keyword strategy — CONFIRMED ABSENT', status: 'In Progress', blocks_scaling: false, cod: '0 evergreen briefs/week', owner: 'Casey', ticket_ref: null, resolution_path: 'Redirect to 80/20 mix via SEO Hub brief generator', last_updated: '2026-03-21' },
      { id: 'GAP-007', domain: 'listings', description: 'Listing API or DB read access', status: 'Blocked', blocks_scaling: false, cod: 'CSV manual uploads only', owner: 'Thomas Galla', ticket_ref: 'Sprint 3 target', resolution_path: 'Expose REST endpoint or provision read-only DB credentials', last_updated: '2026-03-21' },
      { id: 'GAP-008', domain: 'monetization', description: 'ARPA baseline / churn rate — UNKNOWN', status: 'Open', blocks_scaling: false, cod: 'At-risk accounts cannot be scored by revenue impact', owner: 'Casey', ticket_ref: null, resolution_path: 'Populate MVS for all accounts before Sprint 3', last_updated: '2026-03-21' },
      { id: 'GAP-009', domain: 'monetization', description: 'Billing/CRM read access — Jeff approval required', status: 'Blocked', blocks_scaling: false, cod: 'Sprint 3 integration cannot start', owner: 'Casey', ticket_ref: null, resolution_path: 'Submit access request + business case to Jeff by end of March', last_updated: '2026-03-21' },
      { id: 'GAP-010', domain: 'ppc', description: 'Jets campaign — ON HOLD', status: 'Blocked', blocks_scaling: true, cod: 'Revenue ceiling until piston signal clean', owner: 'Casey', ticket_ref: null, resolution_path: 'Unblocks post signal cleanup', last_updated: '2026-03-21' }
    ]);

    // Windsor cache seed (empty — no live data yet)
    Store.set('windsor_cache', {
      google_ads: { timestamp: null, data: null },
      ga4: { timestamp: null, data: null },
      gsc: { timestamp: null, data: null }
    });

    Store.markInitialized();
    console.log('[AvEngineOS] Seed data initialized successfully.');
  }

  return { initialize };
})();
