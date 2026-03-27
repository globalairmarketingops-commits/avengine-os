/* =====================================================================
   AvEngineOS — Hash-Based Router
   Routes: #command, #ppc, #seo, #listings, #monetization,
           #opportunities, #decisions, #gaps
   ===================================================================== */

const Router = (() => {
  const routes = {
    command:        { label: 'Command Center', icon: '&#9881;',  page: 'command-center',   group: 'core' },
    ppc:            { label: 'PPC',            icon: '&#128176;', page: 'ppc-hub',          group: 'domains' },
    seo:            { label: 'SEO',            icon: '&#128269;', page: 'seo-hub',          group: 'domains' },
    listings:       { label: 'Listings',       icon: '&#9992;',   page: 'listings-hub',     group: 'domains' },
    monetization:   { label: 'Monetization',   icon: '&#128178;', page: 'monetization-hub', group: 'domains' },
    opportunities:  { label: 'Opportunity Queue', icon: '&#127919;', page: 'opportunity-queue', group: 'ops' },
    decisions:      { label: 'Decision Log',   icon: '&#128203;', page: 'decision-log',     group: 'ops' },
    gaps:           { label: 'Gaps & Blockers', icon: '&#9888;',  page: 'gaps-blockers',    group: 'ops' }
  };

  let currentRoute = 'command';

  function init() {
    window.addEventListener('hashchange', handleRoute);
    // Set default hash without triggering hashchange
    if (!window.location.hash || !routes[window.location.hash.slice(1)]) {
      history.replaceState(null, '', '#command');
    }
    handleRoute();
  }

  function handleRoute() {
    const hash = window.location.hash.slice(1) || 'command';
    if (!routes[hash]) {
      history.replaceState(null, '', '#command');
      currentRoute = 'command';
    } else {
      currentRoute = hash;
    }
    updateNav();
    renderPage(currentRoute);
    Events.log('engine_nav_click', { target_view: currentRoute, source_view: currentRoute });
  }

  function navigate(route) {
    window.location.hash = '#' + route;
  }

  function updateNav() {
    document.querySelectorAll('.nav-item[data-route]').forEach(item => {
      item.classList.toggle('active', item.dataset.route === currentRoute);
    });
  }

  function renderPage(route) {
    const content = document.getElementById('content-area');
    if (!content) return;
    content.innerHTML = '<div class="page-loading"><div class="skeleton-block"></div><div class="skeleton-block"></div><div class="skeleton-block"></div></div>';

    const pageRenderers = {
      command: () => typeof CommandCenter !== 'undefined' && CommandCenter.render(content),
      ppc: () => typeof PPCHub !== 'undefined' && PPCHub.render(content),
      seo: () => typeof SEOHub !== 'undefined' && SEOHub.render(content),
      listings: () => typeof ListingsHub !== 'undefined' && ListingsHub.render(content),
      monetization: () => typeof MonetizationHub !== 'undefined' && MonetizationHub.render(content),
      opportunities: () => typeof OpportunityQueuePage !== 'undefined' && OpportunityQueuePage.render(content),
      decisions: () => typeof DecisionLogPage !== 'undefined' && DecisionLogPage.render(content),
      gaps: () => typeof GapsBlockersPage !== 'undefined' && GapsBlockersPage.render(content)
    };

    // Render synchronously — rAF caused race conditions with hashchange
    setTimeout(() => {
      if (pageRenderers[route]) {
        pageRenderers[route]();
      } else {
        content.innerHTML = Components.emptyState('&#128679;', `Page "${route}" is not yet implemented.`, '', null);
      }
    }, 0);
  }

  function getCurrent() { return currentRoute; }
  function getRoutes() { return routes; }

  return { init, navigate, getCurrent, getRoutes };
})();
