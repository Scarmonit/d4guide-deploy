#!/usr/bin/env python3
# Script to add timer HTML and JavaScript to index.html

# Read the file
with open('C:/Users/scarm/d4guide-deploy/index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# SVG gradient definitions to add after <body>
svg_defs = '''
    <!-- SVG Gradient Definitions for Timers -->
    <svg class="svg-defs">
        <defs>
            <linearGradient id="bossGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style="stop-color:#ef4444"/>
                <stop offset="50%" style="stop-color:#f97316"/>
                <stop offset="100%" style="stop-color:#ef4444"/>
            </linearGradient>
            <linearGradient id="helltideGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style="stop-color:#6e45e2"/>
                <stop offset="50%" style="stop-color:#a855f7"/>
                <stop offset="100%" style="stop-color:#6e45e2"/>
            </linearGradient>
        </defs>
    </svg>

'''

# Event tracker HTML to add after </nav>
event_tracker_html = '''
    <!-- Event Tracker Hub -->
    <section class="event-tracker">
        <div class="event-tracker-header">
            <div class="event-tracker-title-wrapper">
                <span class="event-tracker-title">
                    <span class="title-icon">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                    </span>
                    Live Events
                </span>
            </div>
            <span class="live-indicator">
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="4"/>
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" opacity="0.3"/>
                    <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" opacity="0.5"/>
                </svg>
                LIVE
            </span>
        </div>

        <div class="event-cards">
            <!-- World Boss Card -->
            <div class="event-card world-boss" id="worldBossCard">
                <div class="event-card-header">
                    <div class="event-type">
                        <div class="event-icon">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12c0 3.69 2.47 6.86 6 8.25V22c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-1.75c3.53-1.39 6-4.56 6-8.25 0-5.52-4.48-10-10-10zm-2 16v2H9v-3c0-.55-.45-1-1-1-.55 0-1 .45-1 1v3h-1v-2c-2.16-1.13-3.6-3.39-3.6-5.93 0-3.87 3.13-7 7-7s7 3.13 7 7c0 2.54-1.44 4.8-3.6 5.93zm-2-6c-.83 0-1.5-.67-1.5-1.5S7.17 9 8 9s1.5.67 1.5 1.5S8.83 12 8 12zm8 0c-.83 0-1.5-.67-1.5-1.5S15.17 9 16 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm-4 3c-1.1 0-2-.45-2-1s.9-1 2-1 2 .45 2 1-.9 1-2 1z"/>
                            </svg>
                        </div>
                        <span class="event-label">World Boss</span>
                    </div>
                    <span class="event-status-badge waiting" id="bossStatusBadge">Waiting</span>
                </div>
                <div class="event-card-body">
                    <div class="progress-ring-container">
                        <svg class="progress-ring" viewBox="0 0 100 100">
                            <circle class="progress-ring-bg" cx="50" cy="50" r="42"/>
                            <circle class="progress-ring-fill" id="bossProgressRing" cx="50" cy="50" r="42"
                                stroke-dasharray="264" stroke-dashoffset="0"/>
                        </svg>
                        <div class="progress-ring-center">
                            <span class="ring-icon" id="bossIcon">
                                <svg viewBox="0 0 48 48" fill="currentColor">
                                    <path d="M24 4c-9.94 0-18 8.06-18 18 0 6.63 3.58 12.41 8.91 15.54V42c0 1.1.9 2 2 2h14.18c1.1 0 2-.9 2-2v-4.46C38.42 34.41 42 28.63 42 22c0-9.94-8.06-18-18-18z" fill="url(#bossGradient)" opacity="0.9"/>
                                    <circle cx="16" cy="20" r="3" fill="#1a1a2e"/>
                                    <circle cx="32" cy="20" r="3" fill="#1a1a2e"/>
                                    <ellipse cx="24" cy="28" rx="4" ry="2" fill="#1a1a2e"/>
                                    <path d="M8 12 L4 4 L10 10 Z" fill="url(#bossGradient)"/>
                                    <path d="M40 12 L44 4 L38 10 Z" fill="url(#bossGradient)"/>
                                </svg>
                            </span>
                        </div>
                    </div>
                    <div class="event-info">
                        <div class="event-name" id="bossName">Loading...</div>
                        <div class="event-location" id="bossLocation">Checking spawn time...</div>
                        <div class="countdown-display">
                            <div class="countdown-segment">
                                <span class="countdown-value" id="bossHours">--</span>
                                <span class="countdown-label">Hours</span>
                            </div>
                            <span class="countdown-separator">:</span>
                            <div class="countdown-segment">
                                <span class="countdown-value" id="bossMinutes">--</span>
                                <span class="countdown-label">Mins</span>
                            </div>
                            <span class="countdown-separator">:</span>
                            <div class="countdown-segment">
                                <span class="countdown-value" id="bossSeconds">--</span>
                                <span class="countdown-label">Secs</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Helltide Card -->
            <div class="event-card helltide" id="helltideCard">
                <div class="event-card-header">
                    <div class="event-type">
                        <div class="event-icon">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 23c-4.97 0-9-3.58-9-8 0-2.52 1.17-4.83 3-6.36V8c0-.95.38-1.81 1-2.44V5c0-1.66 1.34-3 3-3 .95 0 1.81.38 2.44 1h.12c.63-.62 1.49-1 2.44-1 1.66 0 3 1.34 3 3v.56c.62.63 1 1.49 1 2.44v.64c1.83 1.53 3 3.84 3 6.36 0 4.42-4.03 8-9 8zm-2-17c-.55 0-1 .45-1 1v3.17l-.88.88C7.42 11.76 7 12.85 7 14c0 2.76 2.24 5 5 5s5-2.24 5-5c0-1.15-.42-2.24-1.12-2.95l-.88-.88V7c0-.55-.45-1-1-1-.55 0-1 .45-1 1v2h-2V7c0-.55-.45-1-1-1z"/>
                            </svg>
                        </div>
                        <span class="event-label">Helltide</span>
                    </div>
                    <span class="event-status-badge waiting" id="helltideStatusBadge">Waiting</span>
                </div>
                <div class="event-card-body">
                    <div class="progress-ring-container">
                        <svg class="progress-ring" viewBox="0 0 100 100">
                            <circle class="progress-ring-bg" cx="50" cy="50" r="42"/>
                            <circle class="progress-ring-fill" id="helltideProgressRing" cx="50" cy="50" r="42"
                                stroke-dasharray="264" stroke-dashoffset="264"/>
                        </svg>
                        <div class="progress-ring-center">
                            <span class="ring-icon">
                                <svg viewBox="0 0 48 48" fill="currentColor">
                                    <path d="M24 4c-2 4-4 6-4 10 0 2.21 1.79 4 4 4s4-1.79 4-4c0-4-2-6-4-10z" fill="url(#helltideGradient)"/>
                                    <path d="M16 18c-1.5 3-3 5-3 8 0 3.31 2.69 6 6 6 1.66 0 3.16-.67 4.24-1.76-.84-1.37-1.24-2.94-1.24-4.24 0-3 1.5-5 3-8-3 1-6 1.5-9 0z" fill="url(#helltideGradient)" opacity="0.8"/>
                                    <path d="M32 18c1.5 3 3 5 3 8 0 3.31-2.69 6-6 6-1.66 0-3.16-.67-4.24-1.76.84-1.37 1.24-2.94 1.24-4.24 0-3-1.5-5-3-8 3 1 6 1.5 9 0z" fill="url(#helltideGradient)" opacity="0.8"/>
                                    <path d="M24 20c-3 4.5-6 8-6 14 0 5.52 4.48 10 10 10s10-4.48 10-10c0-6-3-9.5-6-14-1 2-2 3-4 3s-3-1-4-3z" fill="url(#helltideGradient)"/>
                                    <ellipse cx="24" cy="36" rx="3" ry="4" fill="#1a1a2e" opacity="0.6"/>
                                </svg>
                            </span>
                        </div>
                    </div>
                    <div class="event-info">
                        <div class="event-name" id="helltideStatus">Loading...</div>
                        <div class="event-location" id="helltideSubtext">Checking status...</div>
                        <div class="countdown-display">
                            <div class="countdown-segment">
                                <span class="countdown-value" id="helltideMinutes">--</span>
                                <span class="countdown-label">Mins</span>
                            </div>
                            <span class="countdown-separator">:</span>
                            <div class="countdown-segment">
                                <span class="countdown-value" id="helltideSeconds">--</span>
                                <span class="countdown-label">Secs</span>
                            </div>
                        </div>
                        <div class="helltide-progress">
                            <div class="progress-bar-container">
                                <div class="progress-bar-fill" id="helltideProgressBar" style="width: 0%"></div>
                            </div>
                            <div class="progress-label">
                                <span id="helltideProgressLabel">--</span>
                                <span id="helltideTimer">--:--</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

'''

# Timer JavaScript to add before </body>
timer_js = '''
    <!-- Timer JavaScript -->
    <script>
        // World Boss Timer - Based on helltides.com API data
        const BOSS_ROTATION = [
            { boss: 'Avarice', zone: 'Fractured Peaks', icon: '\\u{1F4B0}' },
            { boss: 'Azmodan', zone: 'Fractured Peaks', icon: '\\u{1F47F}' },
            { boss: 'Avarice', zone: 'Dry Steppes', icon: '\\u{1F4B0}' },
            { boss: 'Azmodan', zone: 'Kehjistan', icon: '\\u{1F47F}' },
            { boss: 'Ashava', zone: 'Fractured Peaks', icon: '\\u{1F479}' },
            { boss: 'Azmodan', zone: 'Nahantu', icon: '\\u{1F47F}' },
            { boss: 'Ashava', zone: 'Dry Steppes', icon: '\\u{1F479}' },
            { boss: 'Azmodan', zone: 'Nahantu', icon: '\\u{1F47F}' },
            { boss: 'Ashava', zone: 'Scosglen', icon: '\\u{1F479}' },
            { boss: 'Azmodan', zone: 'Scosglen', icon: '\\u{1F47F}' },
            { boss: 'Wandering Death', zone: 'Kehjistan', icon: '\\u{1F480}' },
            { boss: 'Azmodan', zone: 'Fractured Peaks', icon: '\\u{1F47F}' },
            { boss: 'Wandering Death', zone: 'Dry Steppes', icon: '\\u{1F480}' },
            { boss: 'Azmodan', zone: 'Kehjistan', icon: '\\u{1F47F}' },
            { boss: 'Avarice', zone: 'Nahantu', icon: '\\u{1F4B0}' },
            { boss: 'Azmodan', zone: 'Scosglen', icon: '\\u{1F47F}' },
            { boss: 'Avarice', zone: 'Fractured Peaks', icon: '\\u{1F4B0}' },
            { boss: 'Azmodan', zone: 'Dry Steppes', icon: '\\u{1F47F}' },
            { boss: 'Ashava', zone: 'Kehjistan', icon: '\\u{1F479}' },
            { boss: 'Azmodan', zone: 'Nahantu', icon: '\\u{1F47F}' }
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
    </script>
'''

# Add SVG defs after <body>
body_tag = '<body>'
content = content.replace(body_tag, body_tag + svg_defs, 1)

# Add event tracker HTML after </nav>
nav_close = '</nav>'
content = content.replace(nav_close, nav_close + event_tracker_html, 1)

# Add timer JS before </body>
body_close = '</body>'
content = content.replace(body_close, timer_js + body_close, 1)

# Write back
with open('C:/Users/scarm/d4guide-deploy/index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('Timer HTML and JavaScript added successfully')
