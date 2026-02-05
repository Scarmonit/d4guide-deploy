/**
 * D4 API Client — fetches live data from /api/d4/ endpoints
 * Used by build-guides.njk and guide pages to show dynamic data
 */
const D4API = {
  base: '/api/d4',
  cache: {},
  cacheTimeout: 5 * 60 * 1000, // 5 min

  async fetch(endpoint, params = {}) {
    const query = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v))
    ).toString();
    const url = `${this.base}/${endpoint}${query ? '?' + query : ''}`;

    if (this.cache[url] && Date.now() - this.cache[url].ts < this.cacheTimeout) {
      return this.cache[url].data;
    }

    try {
      const resp = await fetch(url);
      if (!resp.ok) return null;
      const json = await resp.json();
      if (json.success) {
        this.cache[url] = { data: json.data, ts: Date.now() };
        return json.data;
      }
      return null;
    } catch (e) {
      console.warn('D4 API fetch failed:', e.message);
      return null;
    }
  },

  async getTierList(opts = {}) {
    return this.fetch('tier-list', opts);
  },

  async getBuilds(opts = {}) {
    return this.fetch('builds', opts);
  },

  async getBuild(idOrSlug) {
    return this.fetch(`builds/${encodeURIComponent(idOrSlug)}`);
  },

  async getItems(opts = {}) {
    return this.fetch('items', opts);
  },

  async getSkills(opts = {}) {
    return this.fetch('skills', opts);
  },

  async getAspects(opts = {}) {
    return this.fetch('aspects', opts);
  },

  async getMeta(opts = {}) {
    return this.fetch('meta', opts);
  }
};

/**
 * Updates the build guides index page with live tier list data
 * Called on page load if the element exists
 */
async function updateTierListDisplay() {
  const container = document.getElementById('live-tier-data');
  if (!container) return;

  const indicator = document.getElementById('api-status');

  try {
    const tierData = await D4API.getTierList({ category: 'endgame' });
    if (!tierData || !Object.keys(tierData).length) {
      if (indicator) indicator.textContent = 'Static data';
      return;
    }

    if (indicator) {
      indicator.textContent = 'Live';
      indicator.classList.add('live');
    }

    // Update the last-updated timestamp
    const tsEl = document.getElementById('data-timestamp');
    if (tsEl && tierData.S && tierData.S[0]) {
      const date = new Date(tierData.S[0].updated_at);
      tsEl.textContent = `Updated: ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }

    // Update tier badges on existing cards with live data
    document.querySelectorAll('.guide-card[data-build-slug]').forEach(card => {
      const slug = card.dataset.buildSlug;
      for (const [tier, builds] of Object.entries(tierData)) {
        const match = builds.find(b =>
          b.build_name.toLowerCase().replace(/\s+/g, '-').includes(slug.split('-').slice(0, 2).join('-'))
        );
        if (match) {
          const badge = card.querySelector('.tier-badge');
          if (badge) {
            badge.textContent = tier;
            badge.className = `tier-badge ${tier.toLowerCase()}-tier`;
          }
          // Show movement indicator
          if (match.movement) {
            let arrow = card.querySelector('.movement-indicator');
            if (!arrow) {
              arrow = document.createElement('span');
              arrow.className = 'movement-indicator';
              card.querySelector('.card-header')?.appendChild(arrow);
            }
            arrow.textContent = match.movement === 'up' ? '▲' : match.movement === 'down' ? '▼' : '';
            arrow.style.color = match.movement === 'up' ? '#4ade80' : '#ef4444';
          }
        }
      }
    });

  } catch (e) {
    if (indicator) indicator.textContent = 'Static data';
  }
}

/**
 * Shows API stats on the build guides page
 */
async function showApiStats() {
  const statsEl = document.getElementById('api-stats');
  if (!statsEl) return;

  try {
    const [builds, items, aspects] = await Promise.all([
      D4API.getBuilds({ limit: 1 }),
      D4API.getItems({ limit: 1 }),
      D4API.getAspects({ limit: 1 })
    ]);

    const parts = [];
    if (builds?.pagination) parts.push(`${builds.pagination.total} Builds`);
    if (items?.pagination) parts.push(`${items.pagination.total} Items`);
    if (aspects?.length) parts.push(`${aspects.length}+ Aspects`);

    if (parts.length) {
      statsEl.textContent = `API: ${parts.join(' · ')}`;
      statsEl.style.display = 'block';
    }
  } catch (e) { /* silent */ }
}

// Auto-init on page load
document.addEventListener('DOMContentLoaded', () => {
  updateTierListDisplay();
  showApiStats();
});
