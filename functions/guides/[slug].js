// Dynamic Guide Page - Renders build guides from D1 database
// GET /guides/:slug

const JSON_FIELDS = ['skills', 'gear', 'aspects', 'tempering', 'paragon', 'rotation', 'tips', 'strengths', 'weaknesses'];

function safeParseJSON(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getTierColor(tier) {
  switch (tier?.toUpperCase()) {
    case 'S': return 'var(--gold)';
    case 'A': return '#a855f7';
    case 'B': return '#3b82f6';
    default: return '#888';
  }
}

function getTierBadge(tier) {
  if (tier === 'S') return 'VERIFIED';
  return `${tier}-TIER`;
}

function renderDifficultyPips(difficulty) {
  const count = parseInt(difficulty) || 3;
  let html = '<div class="difficulty-bar">';
  for (let i = 1; i <= 5; i++) {
    html += `<div class="difficulty-pip${i <= count ? ' filled' : ''}"></div>`;
  }
  html += '</div>';
  return html;
}

function getDifficultyLabel(difficulty) {
  const d = parseInt(difficulty) || 3;
  if (d <= 2) return 'Easy';
  if (d === 3) return 'Medium';
  if (d === 4) return 'Hard';
  return 'Very Hard';
}

function renderStrengths(strengths) {
  if (!strengths || !Array.isArray(strengths) || strengths.length === 0) return '';
  return `
    <div class="pros">
      <h4>Strengths</h4>
      <ul>
        ${strengths.map(s => `<li>${escapeHtml(typeof s === 'string' ? s : s.text || s.name || JSON.stringify(s))}</li>`).join('')}
      </ul>
    </div>
  `;
}

function renderWeaknesses(weaknesses) {
  if (!weaknesses || !Array.isArray(weaknesses) || weaknesses.length === 0) return '';
  return `
    <div class="cons">
      <h4>Weaknesses</h4>
      <ul>
        ${weaknesses.map(w => `<li>${escapeHtml(typeof w === 'string' ? w : w.text || w.name || JSON.stringify(w))}</li>`).join('')}
      </ul>
    </div>
  `;
}

function renderSkills(skills) {
  if (!skills || !Array.isArray(skills) || skills.length === 0) {
    return '<p style="color: #888;">Skill data not yet available. Check back after the next data sync.</p>';
  }

  let html = '<div class="section"><h2>Active Skills</h2>';
  let index = 1;

  for (const skill of skills) {
    if (typeof skill === 'object' && skill.type === 'passives') continue;

    // Handle both string format and object format
    const isString = typeof skill === 'string';
    const name = isString ? skill : (skill.name || skill.skill_name || 'Unknown Skill');
    const desc = isString ? '' : (skill.desc || skill.description || '');
    const tag = isString ? '' : (skill.tag || skill.rank || '');
    const isPrimary = name.toLowerCase().includes('primary') || name.toLowerCase().includes('lunging') || name.toLowerCase().includes('bash') || index === 1;

    html += `
      <div class="skill-card">
        <div class="skill-icon">${index}</div>
        <div class="skill-info">
          <div class="skill-name">${escapeHtml(name)} ${tag ? `<span class="skill-tag">${escapeHtml(tag)}</span>` : ''} ${isPrimary && index === 1 ? '<span class="skill-tag">PRIMARY</span>' : ''}</div>
          <p class="skill-desc">${escapeHtml(desc) || '<em style="color:#666;">Details available after next data sync</em>'}</p>
        </div>
      </div>
    `;
    index++;
  }

  html += '</div>';

  // Render passives if present (only for object format)
  const passivesEntry = skills.find(s => typeof s === 'object' && s.type === 'passives');
  if (passivesEntry && passivesEntry.items) {
    html += `
      <div class="section">
        <h2>Key Passives</h2>
        <div class="tier tier-s">
          <h4>Key Passives</h4>
          <ul>
            ${passivesEntry.items.map(p => `<li><strong>${escapeHtml(p.name)}</strong> ${p.desc ? '— ' + escapeHtml(p.desc) : ''}</li>`).join('')}
          </ul>
        </div>
      </div>
    `;
  }

  return html;
}

function renderGear(gear) {
  if (!gear || !Array.isArray(gear) || gear.length === 0) {
    return '<p style="color: #888;">Gear data not yet available. Check back after the next data sync.</p>';
  }

  let html = '<div class="section"><h2>Key Items</h2>';

  for (const item of gear) {
    // Handle both string format and object format
    const isString = typeof item === 'string';
    const name = isString ? item : (item.name || item.item_name || 'Unknown Item');
    const slot = isString ? '' : (item.slot || '');
    const rarity = isString ? 'UNIQUE' : (item.rarity || 'UNIQUE');
    const effect = isString ? '' : (item.effect || item.description || '');

    const rarityColor = rarity.toUpperCase() === 'MYTHIC' ? 'var(--purple)' :
                        rarity.toUpperCase() === 'UNIQUE' ? 'var(--gold)' : 'var(--red)';

    html += `
      <div class="gear-slot-card" style="border-left-color: ${rarityColor};">
        <div class="gear-slot-header">
          <span>${slot ? escapeHtml(slot) + ' - ' : ''}${escapeHtml(name)}</span>
          <span style="color: ${rarityColor};">${escapeHtml(rarity.toUpperCase())}</span>
        </div>
        ${effect ? `<div class="unique-effect"><strong>Effect:</strong> ${escapeHtml(effect)}</div>` : '<div class="unique-effect"><em style="color:#666;">Effect details available after next data sync</em></div>'}
      </div>
    `;
  }

  html += '</div>';
  return html;
}

function renderAspects(aspects, tempering) {
  let html = '';

  if (aspects && Array.isArray(aspects) && aspects.length > 0) {
    html += '<div class="section"><h2>Legendary Aspects</h2>';
    for (const aspect of aspects) {
      // Handle both string format and object format
      const isString = typeof aspect === 'string';
      const name = isString ? aspect : (aspect.name || 'Unknown Aspect');
      const slot = isString ? '' : (aspect.slot || '');
      const desc = isString ? '' : (aspect.desc || aspect.description || '');

      html += `
        <div class="gear-slot-card">
          <div class="gear-slot-header"><span>${slot ? escapeHtml(slot) + ' — ' : ''}${escapeHtml(name)}</span></div>
          ${desc ? `<div class="unique-effect">${escapeHtml(desc)}</div>` : '<div class="unique-effect"><em style="color:#666;">Effect details available after next data sync</em></div>'}
        </div>
      `;
    }
    html += '</div>';
  } else {
    html += '<div class="section"><h2>Legendary Aspects</h2><p style="color: #888;">Aspect data not yet available. Check back after the next data sync.</p></div>';
  }

  if (tempering && Array.isArray(tempering) && tempering.length > 0) {
    html += '<div class="section"><h2>Tempering Priorities</h2>';
    for (const tier of tempering) {
      const tierClass = tier.tier?.toLowerCase() || 'b';
      const label = tier.label || `${tier.tier}-Tier`;

      html += `<div class="tier tier-${tierClass}"><h4>${escapeHtml(label)}</h4><ul>`;
      if (tier.items && Array.isArray(tier.items)) {
        for (const item of tier.items) {
          html += `<li><strong>${escapeHtml(item.name)}</strong>${item.desc ? ' — ' + escapeHtml(item.desc) : ''}</li>`;
        }
      }
      html += '</ul></div>';
    }
    html += '</div>';
  }

  return html || '<p style="color: #888;">Aspect and tempering data not yet available.</p>';
}

function renderParagon(paragon) {
  if (!paragon || !Array.isArray(paragon) || paragon.length === 0) {
    return '<p style="color: #888;">Paragon data not yet available. Check back after the next data sync.</p>';
  }

  let html = '<div class="section"><h2>Paragon Board Order</h2>';
  html += '<p>Attach boards in this order. Level glyphs to 15 first, then push to 21 for radius bonus.</p>';

  let boardIndex = 1;
  for (const board of paragon) {
    // Handle both string format ("BoardName/Glyph") and object format
    const isString = typeof board === 'string';

    let boardName, glyph, order, desc;
    if (isString) {
      // Parse "BoardName/Glyph" format
      const parts = board.split('/');
      boardName = parts[0] || board;
      glyph = parts[1] || '';
      order = `Board ${boardIndex}`;
      desc = '';
    } else {
      boardName = board.board || board.name || 'Unknown Board';
      order = board.order || `Board ${boardIndex}`;
      glyph = board.glyph || '';
      desc = board.desc || board.description || '';
    }

    html += `
      <div class="paragon-board">
        <div class="paragon-board-header">
          <span class="paragon-board-name">${escapeHtml(boardName)}</span>
          <span class="paragon-board-order">${escapeHtml(order)}</span>
        </div>
        <p style="color: #c0c0c0;">${glyph ? `Glyph: <span class="glyph-name">${escapeHtml(glyph)}</span>` : ''} ${desc ? (glyph ? ' — ' : '') + escapeHtml(desc) : ''}</p>
      </div>
    `;
    boardIndex++;
  }

  html += '</div>';
  return html;
}

function renderGameplay(rotation, tips) {
  let html = '';

  if (rotation && Array.isArray(rotation) && rotation.length > 0) {
    html += '<div class="section"><h2>Rotation</h2><ol class="rotation-steps">';
    for (const step of rotation) {
      const text = typeof step === 'string' ? step : step.text || step.desc || JSON.stringify(step);
      html += `<li class="rotation-step"><p>${escapeHtml(text)}</p></li>`;
    }
    html += '</ol></div>';
  }

  if (tips && Array.isArray(tips) && tips.length > 0) {
    html += '<div class="section"><h2>Gameplay Tips</h2>';
    for (const tip of tips) {
      const title = tip.title || 'Tip';
      const desc = tip.desc || tip.description || '';
      html += `
        <div class="tip-card">
          <strong>${escapeHtml(title)}</strong>
          <p>${escapeHtml(desc)}</p>
        </div>
      `;
    }
    html += '</div>';
  }

  if (!html) {
    html = '<p style="color: #888;">Gameplay tips not yet available. Check back after the next data sync.</p>';
  }

  return html;
}

function renderGuidePage(build) {
  const title = `${build.build_name} Build Guide | D4 Season ${build.season || 11}`;
  const description = build.summary || `Complete Diablo 4 Season ${build.season || 11} ${build.build_name} guide with skills, gear, paragon, aspects, and tempering.`;
  const tierColor = getTierColor(build.tier);
  const tierBadge = getTierBadge(build.tier);
  const className = build.class_name ? build.class_name.charAt(0).toUpperCase() + build.class_name.slice(1) : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/assets/css/style.css">
    <link rel="stylesheet" href="/assets/css/enhanced.css">
    <link rel="stylesheet" href="/assets/css/guide.css">
    <link rel="manifest" href="/manifest.json">
    <meta name="theme-color" content="#d4af37">
    <meta property="og:type" content="article">
    <meta property="og:url" content="https://scarmonit.com/guides/${build.slug}">
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:site_name" content="SCARMONIT">
    <meta name="robots" content="index, follow">
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "${escapeHtml(build.build_name)} Build Guide",
        "description": "${escapeHtml(description)}",
        "dateModified": "${build.updated_at || new Date().toISOString()}",
        "author": {"@type": "Organization", "name": "SCARMONIT"},
        "publisher": {"@type": "Organization", "name": "SCARMONIT"}
    }
    </script>
</head>
<body>
    <svg class="svg-defs">
        <defs>
            <linearGradient id="bossGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style="stop-color:#ef4444"/>
                <stop offset="50%" style="stop-color:#f97316"/>
                <stop offset="100%" style="stop-color:#ef4444"/>
            </linearGradient>
        </defs>
    </svg>

    <div class="bg-wrapper">
        <div class="bg-blob"></div>
        <div class="bg-blob"></div>
        <div class="bg-blob"></div>
    </div>

    <nav>
        <div class="nav-left">
            <a href="/" class="logo">SCARMONIT</a>
            <a href="/ai" class="ai-nav-link"><img src="/assets/images/ai-icon.png" alt="AI" class="ai-nav-icon"> AI Assistant</a>
        </div>
        <button class="menu-toggle" aria-label="Toggle navigation">
            <span></span><span></span><span></span>
        </button>
        <div class="nav-links" role="navigation">
            <a href="/" class="nav-home" aria-label="Home">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
            </a>
            <div class="nav-dropdown">
                <button class="nav-dropdown-trigger active" aria-haspopup="true">Content <span class="dropdown-arrow">▾</span></button>
                <div class="dropdown-menu">
                    <a href="/build-guides" class="active">Build Guides</a>
                    <a href="/videos">Videos</a>
                    <a href="/socials">Socials</a>
                </div>
            </div>
            <div class="nav-dropdown">
                <button class="nav-dropdown-trigger" aria-haspopup="true">Apps <span class="dropdown-arrow">▾</span></button>
                <div class="dropdown-menu">
                    <a href="/tools">Tools</a>
                    <a href="/kpass">KPass</a>
                    <a href="/soundboard">Soundboard</a>
                    <a href="/upload">Upload</a>
                    <a href="/screen-share">Screen Share</a>
                </div>
            </div>
            <a href="/game">Game</a>
            <a href="/downloads">Downloads</a>
            <a href="/discord">Discord</a>
        </div>
    </nav>
    <div class="nav-overlay"></div>

    <main id="main-content">
        <a href="/build-guides" class="back-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Back to Build Guides
        </a>

        <header class="guide-hero">
            <span class="badge">Season ${build.season || 11} - Divine Intervention</span>
            <h1>${escapeHtml(build.build_name)}<span class="verified-badge" style="background: linear-gradient(135deg, ${tierColor}, ${tierColor}99);">${tierBadge}</span></h1>
            <p class="subtitle">${build.tier || 'S'}-Tier ${escapeHtml(build.playstyle || className + ' Build')}</p>
            <p class="auto-update-notice" style="font-size: 0.8rem; color: #888; margin-top: 10px;">
                <em>Auto-updated from database &middot; Last sync: ${build.updated_at ? new Date(build.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'}</em>
            </p>
        </header>

        <div class="nav-tabs">
            <button class="nav-tab active" onclick="showTab('overview')">Overview</button>
            <button class="nav-tab" onclick="showTab('skills')">Skills</button>
            <button class="nav-tab" onclick="showTab('gear')">Gear</button>
            <button class="nav-tab" onclick="showTab('aspects')">Aspects & Tempering</button>
            <button class="nav-tab" onclick="showTab('paragon')">Paragon</button>
            <button class="nav-tab" onclick="showTab('gameplay')">Gameplay</button>
        </div>

        <div class="container">
            <!-- OVERVIEW TAB -->
            <div id="overview" class="tab-content active">
                <div class="section">
                    <h2>Build Summary</h2>
                    <p>${escapeHtml(build.summary || 'Build summary coming soon.')}</p>

                    <div class="build-info-grid">
                        <div class="build-info-item">
                            <div class="build-info-label">Tier</div>
                            <div class="build-info-value" style="color: ${tierColor};">${build.tier || 'S'}-Tier</div>
                        </div>
                        <div class="build-info-item">
                            <div class="build-info-label">Playstyle</div>
                            <div class="build-info-value">${escapeHtml(build.playstyle || 'N/A')}</div>
                        </div>
                        <div class="build-info-item">
                            <div class="build-info-label">Class</div>
                            <div class="build-info-value">${escapeHtml(className)}</div>
                        </div>
                        <div class="build-info-item">
                            <div class="build-info-label">Difficulty</div>
                            <div class="build-info-value">
                                ${getDifficultyLabel(build.difficulty)}
                                ${renderDifficultyPips(build.difficulty)}
                            </div>
                        </div>
                    </div>
                </div>

                ${(build.strengths || build.weaknesses) ? `
                <div class="section">
                    <h2>Strengths & Weaknesses</h2>
                    <div class="pros-cons">
                        ${renderStrengths(build.strengths)}
                        ${renderWeaknesses(build.weaknesses)}
                    </div>
                </div>
                ` : ''}
            </div>

            <!-- SKILLS TAB -->
            <div id="skills" class="tab-content">
                ${renderSkills(build.skills)}
            </div>

            <!-- GEAR TAB -->
            <div id="gear" class="tab-content">
                ${renderGear(build.gear)}
            </div>

            <!-- ASPECTS TAB -->
            <div id="aspects" class="tab-content">
                ${renderAspects(build.aspects, build.tempering)}
            </div>

            <!-- PARAGON TAB -->
            <div id="paragon" class="tab-content">
                ${renderParagon(build.paragon)}
            </div>

            <!-- GAMEPLAY TAB -->
            <div id="gameplay" class="tab-content">
                ${renderGameplay(build.rotation, build.tips)}
            </div>
        </div>

        <script>
            function showTab(tabId) {
                document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
                document.querySelectorAll('.nav-tab').forEach(el => el.classList.remove('active'));
                const target = document.getElementById(tabId);
                if (target) target.classList.add('active');
                if (event && event.target) event.target.classList.add('active');
            }
        </script>
    </main>

    <footer>
        <p>&copy; 2025 <a href="https://scarmonit.com">Scarmonit.com</a> - All Rights Reserved</p>
    </footer>

    <script src="/assets/js/main.js" defer></script>
</body>
</html>`;
}

export async function onRequestGet(context) {
  const { env, params } = context;

  try {
    const slug = params.slug;

    if (!slug) {
      return Response.redirect('https://scarmonit.com/build-guides', 302);
    }

    // Fetch build from D1
    const build = await env.DB.prepare('SELECT * FROM builds WHERE slug = ?')
      .bind(slug)
      .first();

    if (!build) {
      // Return 404 page
      return new Response(`
        <!DOCTYPE html>
        <html><head><title>Build Not Found</title>
        <meta http-equiv="refresh" content="3;url=/build-guides">
        <style>body{background:#0a0a0a;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;}
        .msg{text-align:center;}.msg h1{color:#d4af37;}</style></head>
        <body><div class="msg"><h1>Build Not Found</h1><p>Redirecting to build guides...</p></div></body></html>
      `, {
        status: 404,
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // Parse JSON fields
    for (const field of JSON_FIELDS) {
      if (build[field]) {
        build[field] = safeParseJSON(build[field]);
      }
    }

    // Render the page
    const html = renderGuidePage(build);

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html;charset=UTF-8',
        'Cache-Control': 'public, max-age=300, s-maxage=600',
      }
    });

  } catch (err) {
    console.error('Guide page error:', err);
    return new Response(`
      <!DOCTYPE html>
      <html><head><title>Error</title>
      <style>body{background:#0a0a0a;color:#fff;font-family:sans-serif;padding:40px;}</style></head>
      <body><h1>Something went wrong</h1><p>${err.message}</p><a href="/build-guides" style="color:#d4af37;">Back to guides</a></body></html>
    `, {
      status: 500,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}
