// World Boss Timer - Based on helltides.com API data
const BOSS_ROTATION = [
    { boss: 'Avarice', zone: 'Fractured Peaks', icon: '\u{1F4B0}' },
    { boss: 'Azmodan', zone: 'Fractured Peaks', icon: '\u{1F47F}' },
    { boss: 'Avarice', zone: 'Dry Steppes', icon: '\u{1F4B0}' },
    { boss: 'Azmodan', zone: 'Kehjistan', icon: '\u{1F47F}' },
    { boss: 'Ashava', zone: 'Fractured Peaks', icon: '\u{1F479}' },
    { boss: 'Azmodan', zone: 'Nahantu', icon: '\u{1F47F}' },
    { boss: 'Ashava', zone: 'Dry Steppes', icon: '\u{1F479}' },
    { boss: 'Azmodan', zone: 'Nahantu', icon: '\u{1F47F}' },
    { boss: 'Ashava', zone: 'Scosglen', icon: '\u{1F479}' },
    { boss: 'Azmodan', zone: 'Scosglen', icon: '\u{1F47F}' },
    { boss: 'Wandering Death', zone: 'Kehjistan', icon: '\u{1F480}' },
    { boss: 'Azmodan', zone: 'Fractured Peaks', icon: '\u{1F47F}' },
    { boss: 'Wandering Death', zone: 'Dry Steppes', icon: '\u{1F480}' },
    { boss: 'Azmodan', zone: 'Kehjistan', icon: '\u{1F47F}' },
    { boss: 'Avarice', zone: 'Nahantu', icon: '\u{1F4B0}' },
    { boss: 'Azmodan', zone: 'Scosglen', icon: '\u{1F47F}' },
    { boss: 'Avarice', zone: 'Fractured Peaks', icon: '\u{1F4B0}' },
    { boss: 'Azmodan', zone: 'Dry Steppes', icon: '\u{1F47F}' },
    { boss: 'Ashava', zone: 'Kehjistan', icon: '\u{1F479}' },
    { boss: 'Azmodan', zone: 'Nahantu', icon: '\u{1F47F}' }
];

// Anchor: First spawn from API - Dec 29, 2025 08:30:00 UTC
const ANCHOR_TIMESTAMP_MS = 1766997000 * 1000;
const SPAWN_INTERVAL_MS = 6300 * 1000; // 1h 45m = 6300 seconds

function getNextWorldBoss() {
    const now = Date.now();
    const timeSinceAnchor = now - ANCHOR_TIMESTAMP_MS;

    let spawnsSinceAnchor = Math.floor(timeSinceAnchor / SPAWN_INTERVAL_MS);
    let nextSpawnIndex = spawnsSinceAnchor + 1;
    let nextSpawnTime = ANCHOR_TIMESTAMP_MS + (nextSpawnIndex * SPAWN_INTERVAL_MS);

    if (timeSinceAnchor < 0) {
        nextSpawnIndex = 0;
        nextSpawnTime = ANCHOR_TIMESTAMP_MS;
    }

    const rotationIndex = ((nextSpawnIndex % BOSS_ROTATION.length) + BOSS_ROTATION.length) % BOSS_ROTATION.length;
    const bossInfo = BOSS_ROTATION[rotationIndex];

    return {
        timestamp: nextSpawnTime,
        boss: bossInfo.boss,
        zone: bossInfo.zone,
        icon: bossInfo.icon,
        countdown: nextSpawnTime - now
    };
}

const BOSS_SPAWN_INTERVAL_MS = 6300 * 1000;
const HELLTIDE_DURATION_MS = 55 * 60 * 1000;
const HELLTIDE_INTERVAL_MS = 60 * 60 * 1000;
const PROGRESS_RING_CIRCUMFERENCE = 264;

function updateBossTimer() {
    const { timestamp, boss, zone, icon, countdown } = getNextWorldBoss();

    const bossCard = document.getElementById('worldBossCard');
    const bossIcon = document.getElementById('bossIcon');
    const bossName = document.getElementById('bossName');
    const bossLocation = document.getElementById('bossLocation');
    const bossHours = document.getElementById('bossHours');
    const bossMinutes = document.getElementById('bossMinutes');
    const bossSeconds = document.getElementById('bossSeconds');
    const bossStatusBadge = document.getElementById('bossStatusBadge');
    const bossProgressRing = document.getElementById('bossProgressRing');

    // Guard clause if elements don't exist (e.g. on pages without the timer)
    if (!bossCard) return;

    bossIcon.textContent = icon;
    bossName.textContent = boss;
    bossLocation.textContent = zone;

    bossCard.classList.remove('urgent', 'warning');
    bossHours.classList.remove('urgent');
    bossMinutes.classList.remove('urgent');
    bossSeconds.classList.remove('urgent');

    if (countdown <= 0) {
        bossHours.textContent = '00';
        bossMinutes.textContent = '00';
        bossSeconds.textContent = '00';
        bossHours.classList.add('urgent');
        bossMinutes.classList.add('urgent');
        bossSeconds.classList.add('urgent');
        bossCard.classList.add('urgent');
        bossStatusBadge.textContent = 'SPAWNING';
        bossStatusBadge.className = 'event-status-badge soon';
        bossProgressRing.style.strokeDashoffset = 0;
    } else {
        const hours = Math.floor(countdown / (1000 * 60 * 60));
        const minutes = Math.floor((countdown % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((countdown % (1000 * 60)) / 1000);

        bossHours.textContent = String(hours).padStart(2, '0');
        bossMinutes.textContent = String(minutes).padStart(2, '0');
        bossSeconds.textContent = String(seconds).padStart(2, '0');

        const progress = countdown / BOSS_SPAWN_INTERVAL_MS;
        const offset = PROGRESS_RING_CIRCUMFERENCE * progress;
        bossProgressRing.style.strokeDashoffset = offset;

        if (countdown < 15 * 60 * 1000) {
            bossHours.classList.add('urgent');
            bossMinutes.classList.add('urgent');
            bossSeconds.classList.add('urgent');
            bossCard.classList.add('urgent');
            bossStatusBadge.textContent = 'SOON';
            bossStatusBadge.className = 'event-status-badge soon';
        } else if (countdown < 30 * 60 * 1000) {
            bossCard.classList.add('warning');
            bossStatusBadge.textContent = 'APPROACHING';
            bossStatusBadge.className = 'event-status-badge soon';
        } else {
            bossStatusBadge.textContent = 'WAITING';
            bossStatusBadge.className = 'event-status-badge waiting';
        }
    }
}

function getHelltideStatus() {
    const now = Date.now();
    const msIntoHour = now % HELLTIDE_INTERVAL_MS;

    if (msIntoHour < HELLTIDE_DURATION_MS) {
        const remaining = HELLTIDE_DURATION_MS - msIntoHour;
        const progress = (HELLTIDE_DURATION_MS - remaining) / HELLTIDE_DURATION_MS;
        return { active: true, remaining: remaining, progress: progress };
    } else {
        const remaining = HELLTIDE_INTERVAL_MS - msIntoHour;
        const progress = 0;
        return { active: false, remaining: remaining, progress: progress };
    }
}

function updateHelltideTimer() {
    const { active, remaining, progress } = getHelltideStatus();

    const helltideCard = document.getElementById('helltideCard');
    const statusEl = document.getElementById('helltideStatus');
    const subtextEl = document.getElementById('helltideSubtext');
    const timerEl = document.getElementById('helltideTimer');
    const statusBadge = document.getElementById('helltideStatusBadge');
    const progressRing = document.getElementById('helltideProgressRing');
    const progressBar = document.getElementById('helltideProgressBar');
    const progressLabel = document.getElementById('helltideProgressLabel');
    const helltideMinutes = document.getElementById('helltideMinutes');
    const helltideSeconds = document.getElementById('helltideSeconds');

    // Guard clause
    if (!helltideCard) return;

    const minutes = Math.floor(remaining / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
    const timeStr = String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');

    helltideMinutes.textContent = String(minutes).padStart(2, '0');
    helltideSeconds.textContent = String(seconds).padStart(2, '0');

    if (active) {
        statusEl.textContent = 'HELLTIDE ACTIVE';
        subtextEl.textContent = 'Demons are spawning!';
        timerEl.textContent = timeStr + ' left';
        statusBadge.textContent = 'ACTIVE';
        statusBadge.className = 'event-status-badge active';
        helltideCard.classList.add('active');

        const ringOffset = PROGRESS_RING_CIRCUMFERENCE * (1 - progress);
        progressRing.style.strokeDashoffset = ringOffset;

        progressBar.style.width = (progress * 100) + '%';
        progressLabel.textContent = Math.round(progress * 100) + '% complete';
    } else {
        statusEl.textContent = 'Next Helltide';
        subtextEl.textContent = 'Waiting for next event...';
        timerEl.textContent = 'in ' + timeStr;
        statusBadge.textContent = 'WAITING';
        statusBadge.className = 'event-status-badge waiting';
        helltideCard.classList.remove('active');

        progressRing.style.strokeDashoffset = PROGRESS_RING_CIRCUMFERENCE;
        progressBar.style.width = '0%';
        progressLabel.textContent = 'Starts in ' + timeStr;
    }
}

// Update timers every second
updateBossTimer();
updateHelltideTimer();
setInterval(updateBossTimer, 1000);
setInterval(updateHelltideTimer, 1000);
