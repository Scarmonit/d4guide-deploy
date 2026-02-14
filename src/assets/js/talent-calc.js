// TBC Classic Talent Calculator Engine
// Requires a data file loaded before this script that sets window.TALENT_CALC_CONFIG

const ICON_BASE = 'https://wow.zamimg.com/images/wow/icons/large/';

// Read config from data file
const CONFIG = window.TALENT_CALC_CONFIG;
const TALENT_DATA = CONFIG.talentData;
const RECOMMENDED_ORDER = CONFIG.recommendedOrder;
const TREE_CONFIG = CONFIG.trees; // [{key, gridId, arrowId, pointsId, abbrev}]

// State
let currentTalents = {};
let playerLevel = 70;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initTalentTrees();
    setupEventListeners();
    updateUI();
});

function initTalentTrees() {
    Object.keys(TALENT_DATA).forEach(treeName => {
        TALENT_DATA[treeName].talents.forEach(talent => {
            currentTalents[talent.id] = 0;
        });
    });
    TREE_CONFIG.forEach(tc => {
        renderTree(tc.key, tc.gridId);
    });
}

function renderTree(treeName, gridId) {
    const grid = document.getElementById(gridId);
    const tree = TALENT_DATA[treeName];
    grid.innerHTML = '';

    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 4; col++) {
            const talent = tree.talents.find(t => t.row === row && t.col === col);
            if (talent) {
                const div = createTalentElement(talent, treeName);
                grid.appendChild(div);
            } else {
                const empty = document.createElement('div');
                empty.className = 'talent-empty';
                grid.appendChild(empty);
            }
        }
    }

    setTimeout(() => drawArrows(treeName), 100);
}

function drawArrows(treeName) {
    const tc = TREE_CONFIG.find(t => t.key === treeName);
    if (!tc) return;
    const svg = document.getElementById(tc.arrowId);
    if (!svg) return;

    svg.innerHTML = '';
    const tree = TALENT_DATA[treeName];
    const gridWrapper = svg.parentElement;
    const grid = gridWrapper.querySelector('.tree-grid');

    tree.talents.forEach(talent => {
        if (talent.dependsOn) {
            const parentTalent = tree.talents.find(t => t.id === talent.dependsOn);
            if (!parentTalent) return;

            const parentEl = grid.querySelector(`[data-id="${parentTalent.id}"]`);
            const childEl = grid.querySelector(`[data-id="${talent.id}"]`);

            if (!parentEl || !childEl) return;

            const gridRect = grid.getBoundingClientRect();
            const parentRect = parentEl.getBoundingClientRect();
            const childRect = childEl.getBoundingClientRect();

            const parentCenterX = parentRect.left + parentRect.width / 2 - gridRect.left;
            const parentBottomY = parentRect.bottom - gridRect.top;
            const childCenterX = childRect.left + childRect.width / 2 - gridRect.left;
            const childTopY = childRect.top - gridRect.top;

            const isActive = currentTalents[parentTalent.id] >= parentTalent.maxRank;
            const strokeColor = isActive ? '#00ff00' : '#808080';

            if (parentTalent.col === talent.col) {
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', parentCenterX);
                line.setAttribute('y1', parentBottomY);
                line.setAttribute('x2', childCenterX);
                line.setAttribute('y2', childTopY - 6);
                line.setAttribute('stroke', strokeColor);
                line.setAttribute('stroke-width', '2');
                if (isActive) line.classList.add('active');
                svg.appendChild(line);
            } else {
                const midY = parentBottomY + (childTopY - parentBottomY) / 2;

                const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line1.setAttribute('x1', parentCenterX);
                line1.setAttribute('y1', parentBottomY);
                line1.setAttribute('x2', parentCenterX);
                line1.setAttribute('y2', midY);
                line1.setAttribute('stroke', strokeColor);
                line1.setAttribute('stroke-width', '2');
                if (isActive) line1.classList.add('active');
                svg.appendChild(line1);

                const line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line2.setAttribute('x1', parentCenterX);
                line2.setAttribute('y1', midY);
                line2.setAttribute('x2', childCenterX);
                line2.setAttribute('y2', midY);
                line2.setAttribute('stroke', strokeColor);
                line2.setAttribute('stroke-width', '2');
                if (isActive) line2.classList.add('active');
                svg.appendChild(line2);

                const line3 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line3.setAttribute('x1', childCenterX);
                line3.setAttribute('y1', midY);
                line3.setAttribute('x2', childCenterX);
                line3.setAttribute('y2', childTopY - 6);
                line3.setAttribute('stroke', strokeColor);
                line3.setAttribute('stroke-width', '2');
                if (isActive) line3.classList.add('active');
                svg.appendChild(line3);
            }

            const arrowHead = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            const tipY = childTopY - 2;
            arrowHead.setAttribute('points',
                `${childCenterX},${tipY} ${childCenterX - 5},${tipY - 8} ${childCenterX + 5},${tipY - 8}`);
            arrowHead.setAttribute('fill', strokeColor);
            if (isActive) arrowHead.classList.add('active');
            svg.appendChild(arrowHead);
        }
    });
}

function updateArrows() {
    TREE_CONFIG.forEach(tc => {
        drawArrows(tc.key);
    });
}

function createTalentElement(talent, treeName) {
    const div = document.createElement('div');
    div.className = 'talent';
    div.dataset.id = talent.id;
    div.dataset.tree = treeName;

    div.setAttribute('role', 'button');
    div.setAttribute('tabindex', '0');
    div.setAttribute('aria-label', `${talent.name}: ${currentTalents[talent.id]} of ${talent.maxRank} points`);

    const iconUrl = ICON_BASE + talent.icon + '.jpg';
    div.innerHTML = `
        <img src="${iconUrl}" alt="${talent.name}" class="talent-icon-img" loading="lazy">
        <span class="talent-points-badge">${currentTalents[talent.id]}/${talent.maxRank}</span>
    `;

    div.addEventListener('click', (e) => {
        e.preventDefault();
        addTalentPoint(talent.id, treeName);
    });
    div.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        removeTalentPoint(talent.id, treeName);
    });
    div.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            addTalentPoint(talent.id, treeName);
        } else if (e.key === 'Backspace' || e.key === 'Delete') {
            e.preventDefault();
            removeTalentPoint(talent.id, treeName);
        }
    });
    div.addEventListener('mouseenter', (e) => showTooltip(e, talent));
    div.addEventListener('mouseleave', hideTooltip);
    div.addEventListener('mousemove', moveTooltip);
    div.addEventListener('focus', (e) => showTooltip(e, talent));
    div.addEventListener('blur', hideTooltip);

    return div;
}

function setupEventListeners() {
    const levelInput = document.getElementById('player-level');
    levelInput.addEventListener('input', (e) => {
        playerLevel = Math.max(10, Math.min(70, parseInt(e.target.value) || 10));
        e.target.value = playerLevel;
        updateUI();
    });

    document.getElementById('level-up').addEventListener('click', () => {
        if (playerLevel < 70) {
            playerLevel++;
            levelInput.value = playerLevel;
            updateUI();
        }
    });
    document.getElementById('level-down').addEventListener('click', () => {
        if (playerLevel > 10) {
            playerLevel--;
            levelInput.value = playerLevel;
            updateUI();
        }
    });

    document.getElementById('reset-talents').addEventListener('click', resetTalents);
    document.getElementById('apply-recommended').addEventListener('click', applyRecommendedBuild);

    window.addEventListener('resize', () => {
        setTimeout(() => updateArrows(), 100);
    });
}

function getTreePoints(treeName) {
    return TALENT_DATA[treeName].talents.reduce((sum, talent) => sum + currentTalents[talent.id], 0);
}

function getTotalPoints() {
    return Object.values(currentTalents).reduce((sum, points) => sum + points, 0);
}

function getAvailablePoints() {
    return Math.max(0, playerLevel - 9);
}

function canAddPoint(talentId, treeName) {
    const availablePoints = getAvailablePoints();
    const totalUsed = getTotalPoints();
    if (totalUsed >= availablePoints) return false;

    const talent = TALENT_DATA[treeName].talents.find(t => t.id === talentId);
    if (!talent) return false;
    if (currentTalents[talentId] >= talent.maxRank) return false;

    const treePoints = getTreePoints(treeName);
    const requiredPoints = talent.requires || 0;
    if (treePoints < requiredPoints) return false;

    if (talent.dependsOn) {
        const depTalent = TALENT_DATA[treeName].talents.find(t => t.id === talent.dependsOn);
        if (!depTalent || currentTalents[talent.dependsOn] < depTalent.maxRank) {
            return false;
        }
    }

    return true;
}

function addTalentPoint(talentId, treeName) {
    if (canAddPoint(talentId, treeName)) {
        currentTalents[talentId]++;
        updateUI();
    }
}

function removeTalentPoint(talentId, treeName) {
    if (currentTalents[talentId] > 0) {
        const talent = TALENT_DATA[treeName].talents.find(t => t.id === talentId);
        const dependents = TALENT_DATA[treeName].talents.filter(t => t.dependsOn === talentId);
        for (const dep of dependents) {
            if (currentTalents[dep.id] > 0) return;
        }

        const treePoints = getTreePoints(treeName);
        const higherTierTalents = TALENT_DATA[treeName].talents.filter(t =>
            t.requires && t.requires >= treePoints && currentTalents[t.id] > 0 && t.id !== talentId
        );

        if (higherTierTalents.length > 0) {
            const newTreePoints = treePoints - 1;
            for (const ht of higherTierTalents) {
                if (newTreePoints < ht.requires) return;
            }
        }

        currentTalents[talentId]--;
        updateUI();
    }
}

function resetTalents() {
    Object.keys(currentTalents).forEach(id => { currentTalents[id] = 0; });
    updateUI();
}

function applyRecommendedBuild() {
    resetTalents();
    const maxLevel = playerLevel;
    RECOMMENDED_ORDER.forEach(rec => {
        if (rec.level <= maxLevel) {
            if (canAddPoint(rec.talent, rec.tree)) {
                currentTalents[rec.talent]++;
            }
        }
    });
    updateUI();
}

function updateUI() {
    const available = getAvailablePoints();
    const used = getTotalPoints();
    document.getElementById('available-points').textContent = available - used;

    // Update per-tree point displays
    const buildParts = [];
    TREE_CONFIG.forEach(tc => {
        const pts = getTreePoints(tc.key);
        const el = document.getElementById(tc.pointsId);
        if (el) el.textContent = pts;
        buildParts.push(pts);
    });

    document.getElementById('build-string').textContent = buildParts.join('/');

    const progress = ((playerLevel - 10) / 60) * 100;
    document.getElementById('level-progress').style.width = `${progress}%`;

    updateTalentElements();
    updateRecommendation();
    updateArrows();
}

function updateTalentElements() {
    Object.keys(TALENT_DATA).forEach(treeName => {
        TALENT_DATA[treeName].talents.forEach(talent => {
            const el = document.querySelector(`[data-id="${talent.id}"]`);
            if (!el) return;

            const points = currentTalents[talent.id];
            const pointsEl = el.querySelector('.talent-points-badge');
            pointsEl.textContent = `${points}/${talent.maxRank}`;

            const canAdd = canAddPoint(talent.id, treeName);
            let ariaLabel = `${talent.name}: ${points} of ${talent.maxRank} points`;
            if (points >= talent.maxRank) ariaLabel += ' (maxed)';
            else if (!canAdd && points === 0) ariaLabel += ' (locked)';
            el.setAttribute('aria-label', ariaLabel);

            el.classList.remove('selected', 'maxed', 'locked', 'recommended');

            if (points > 0 && points < talent.maxRank) {
                el.classList.add('selected');
            } else if (points >= talent.maxRank) {
                el.classList.add('maxed');
            }

            if (!canAdd && points === 0) {
                el.classList.add('locked');
            }
        });
    });

    const nextRec = getNextRecommendedTalent();
    if (nextRec) {
        const el = document.querySelector(`[data-id="${nextRec.talent}"]`);
        if (el && !el.classList.contains('maxed')) {
            el.classList.add('recommended');
        }
    }
}

function getNextRecommendedTalent() {
    const usedPoints = getTotalPoints();
    const nextLevel = usedPoints + 10;
    if (nextLevel > 70) return null;
    return RECOMMENDED_ORDER.find(rec => rec.level === nextLevel);
}

function updateRecommendation() {
    const nextRec = getNextRecommendedTalent();
    const textEl = document.getElementById('next-talent-name');
    const boxEl = document.getElementById('recommendation-box');

    if (nextRec && getTotalPoints() < getAvailablePoints()) {
        const talent = TALENT_DATA[nextRec.tree].talents.find(t => t.id === nextRec.talent);
        if (talent) {
            const tc = TREE_CONFIG.find(t => t.key === nextRec.tree);
            const abbrev = tc ? tc.abbrev : nextRec.tree;
            textEl.textContent = `${talent.name} (${abbrev})`;
            boxEl.style.display = 'block';
        }
    } else if (getTotalPoints() >= getAvailablePoints()) {
        textEl.textContent = 'All points allocated!';
        boxEl.style.display = 'block';
    } else {
        boxEl.style.display = 'none';
    }
}

// Tooltip
const tooltip = document.getElementById('talent-tooltip');

function showTooltip(e, talent) {
    const points = currentTalents[talent.id];
    const desc = talent.desc.replace(/\{([^}]+)\}/g, (match, values) => {
        const arr = values.split('/');
        return points > 0 ? arr[Math.min(points - 1, arr.length - 1)] : arr[0];
    });

    let reqText = '';
    if (talent.requires) {
        reqText += `<div class="tt-req">Requires ${talent.requires} points in tree</div>`;
    }
    if (talent.dependsOn) {
        const depTalent = Object.values(TALENT_DATA).flatMap(t => t.talents).find(t => t.id === talent.dependsOn);
        if (depTalent) {
            reqText += `<div class="tt-req">Requires ${depTalent.name}</div>`;
        }
    }

    const iconUrl = ICON_BASE + talent.icon + '.jpg';
    tooltip.innerHTML = `
        <div class="tt-header">
            <img src="${iconUrl}" class="tt-icon" alt="">
            <div>
                <div class="tt-title">${talent.name}</div>
                <div class="tt-rank">Rank ${points}/${talent.maxRank}</div>
            </div>
        </div>
        <div class="tt-desc">${desc}</div>
        ${reqText}
    `;

    tooltip.classList.add('visible');
    moveTooltip(e);
}

function hideTooltip() {
    tooltip.classList.remove('visible');
}

function moveTooltip(e) {
    const x = e.clientX + 15;
    const y = e.clientY + 15;
    const rect = tooltip.getBoundingClientRect();
    const maxX = window.innerWidth - rect.width - 20;
    const maxY = window.innerHeight - rect.height - 20;
    tooltip.style.left = `${Math.min(x, maxX)}px`;
    tooltip.style.top = `${Math.min(y, maxY)}px`;
}
