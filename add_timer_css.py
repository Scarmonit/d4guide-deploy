#!/usr/bin/env python3
# Script to add timer CSS to index.html

# Read the file
with open('C:/Users/scarm/d4guide-deploy/index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Event tracker CSS to add
timer_css = '''
        /* ═══════════════════════════════════════════════════════════════
           EVENT TRACKER - Premium Timer Hub
           ═══════════════════════════════════════════════════════════════ */
        @keyframes shimmer {
            0% { background-position: 200% center; }
            100% { background-position: -200% center; }
        }

        .event-tracker {
            background: linear-gradient(180deg, rgba(10, 10, 20, 0.95) 0%, rgba(5, 5, 12, 0.98) 100%);
            border-bottom: 1px solid var(--glass-border);
            padding: 20px;
            position: relative;
            overflow: hidden;
            margin-top: 60px;
        }

        .event-tracker::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background:
                radial-gradient(ellipse at 20% 50%, rgba(212, 175, 55, 0.08) 0%, transparent 50%),
                radial-gradient(ellipse at 80% 50%, rgba(110, 69, 226, 0.08) 0%, transparent 50%);
            pointer-events: none;
        }

        .event-tracker-header {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 8px;
            margin-bottom: 24px;
            position: relative;
            z-index: 1;
        }

        .event-tracker-title-wrapper {
            display: flex;
            align-items: center;
            gap: 16px;
        }

        .event-tracker-title {
            font-family: 'Orbitron', sans-serif;
            font-size: 0.9rem;
            font-weight: 700;
            letter-spacing: 6px;
            text-transform: uppercase;
            background: linear-gradient(135deg, #fff 0%, var(--gold) 50%, #fff 100%);
            background-size: 200% auto;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            animation: shimmer 4s linear infinite;
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .event-tracker-title::before,
        .event-tracker-title::after {
            content: '';
            width: 60px;
            height: 1px;
            background: linear-gradient(90deg, transparent, var(--gold), transparent);
        }

        .title-icon {
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .title-icon svg {
            width: 18px;
            height: 18px;
            fill: var(--gold);
            filter: drop-shadow(0 0 8px var(--gold-glow));
        }

        .live-indicator {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(239, 68, 68, 0.08) 100%);
            border: 1px solid rgba(239, 68, 68, 0.25);
            border-radius: 25px;
            padding: 6px 16px;
            font-family: 'Orbitron', sans-serif;
            font-size: 0.7rem;
            font-weight: 600;
            color: #ef4444;
            letter-spacing: 2px;
            text-shadow: 0 0 10px rgba(239, 68, 68, 0.5);
        }

        .live-indicator svg {
            width: 14px;
            height: 14px;
            fill: #ef4444;
            animation: livePulse 3.5s ease-in-out infinite;
        }

        @keyframes livePulse {
            0%, 100% { opacity: 1; transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.6); }
            50% { opacity: 0.8; transform: scale(1.2); box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
        }

        .event-cards {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            max-width: 900px;
            margin: 0 auto;
            position: relative;
            z-index: 1;
        }

        .event-card {
            background: rgba(15, 15, 25, 0.8);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border-radius: 20px;
            padding: 24px;
            position: relative;
            overflow: hidden;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .event-card::before {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: 20px;
            padding: 2px;
            background: linear-gradient(135deg, var(--card-accent, var(--gold)) 0%, transparent 50%, var(--card-accent, var(--gold)) 100%);
            -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
            mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
            -webkit-mask-composite: xor;
            mask-composite: exclude;
            opacity: 0.5;
            transition: opacity 0.3s ease;
        }

        .event-card:hover::before { opacity: 0.8; }
        .event-card:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4); }

        .event-card.world-boss { --card-accent: #ef4444; }
        .event-card.world-boss.urgent { animation: urgentGlow 3s ease-in-out infinite; }
        .event-card.world-boss.warning { --card-accent: var(--gold); }

        @keyframes urgentGlow {
            0%, 100% { box-shadow: 0 0 25px rgba(239, 68, 68, 0.25), inset 0 0 20px rgba(239, 68, 68, 0.03); }
            50% { box-shadow: 0 0 40px rgba(239, 68, 68, 0.4), inset 0 0 30px rgba(239, 68, 68, 0.08); }
        }

        .event-card.helltide { --card-accent: var(--purple); }
        .event-card.helltide.active { --card-accent: #a855f7; animation: helltideActive 4s ease-in-out infinite; }

        @keyframes helltideActive {
            0%, 100% { box-shadow: 0 0 25px rgba(168, 85, 247, 0.25), inset 0 0 20px rgba(168, 85, 247, 0.03); }
            50% { box-shadow: 0 0 40px rgba(168, 85, 247, 0.4), inset 0 0 30px rgba(168, 85, 247, 0.08); }
        }

        .event-card-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 20px;
        }

        .event-type {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .event-icon {
            width: 40px;
            height: 40px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.4rem;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .world-boss .event-icon {
            background: linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.05) 100%);
            border-color: rgba(239, 68, 68, 0.3);
        }

        .helltide .event-icon {
            background: linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(168, 85, 247, 0.05) 100%);
            border-color: rgba(168, 85, 247, 0.3);
        }

        .event-label {
            font-family: 'Orbitron', sans-serif;
            font-size: 0.7rem;
            font-weight: 600;
            letter-spacing: 2px;
            text-transform: uppercase;
            color: var(--text-dim);
        }

        .event-status-badge {
            font-size: 0.6rem;
            font-weight: 700;
            letter-spacing: 1px;
            text-transform: uppercase;
            padding: 5px 12px;
            border-radius: 20px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .event-status-badge.soon {
            background: rgba(239, 68, 68, 0.15);
            border-color: rgba(239, 68, 68, 0.3);
            color: #ef4444;
        }

        .event-status-badge.active {
            background: rgba(74, 222, 128, 0.15);
            border-color: rgba(74, 222, 128, 0.3);
            color: #4ade80;
        }

        .event-status-badge.waiting { color: var(--text-dim); }

        .event-card-body {
            display: flex;
            align-items: center;
            gap: 20px;
        }

        .progress-ring-container {
            position: relative;
            width: 100px;
            height: 100px;
            flex-shrink: 0;
        }

        .progress-ring {
            transform: rotate(-90deg);
            width: 100px;
            height: 100px;
        }

        .progress-ring-bg {
            fill: none;
            stroke: rgba(255, 255, 255, 0.08);
            stroke-width: 6;
        }

        .progress-ring-fill {
            fill: none;
            stroke-width: 6;
            stroke-linecap: round;
            transition: stroke-dashoffset 1s ease;
        }

        .world-boss .progress-ring-fill {
            stroke: url(#bossGradient);
            filter: drop-shadow(0 0 8px rgba(239, 68, 68, 0.5));
        }

        .helltide .progress-ring-fill {
            stroke: url(#helltideGradient);
            filter: drop-shadow(0 0 8px rgba(168, 85, 247, 0.5));
        }

        .progress-ring-center {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
        }

        .ring-icon {
            font-size: 2rem;
            display: flex;
            align-items: center;
            justify-content: center;
            filter: drop-shadow(0 0 10px var(--card-accent));
            animation: iconPulse 4s ease-in-out infinite;
        }

        .ring-icon svg { width: 36px; height: 36px; }

        @keyframes iconPulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.08); opacity: 0.9; }
        }

        .event-info { flex: 1; }

        .event-name {
            font-family: 'Orbitron', sans-serif;
            font-size: 1.1rem;
            font-weight: 700;
            margin-bottom: 4px;
            color: var(--text);
        }

        .world-boss .event-name { color: #fca5a5; text-shadow: 0 0 20px rgba(239, 68, 68, 0.4); }
        .helltide .event-name { color: #c4b5fd; text-shadow: 0 0 20px rgba(168, 85, 247, 0.4); }

        .event-location {
            font-size: 0.8rem;
            color: var(--text-dim);
            margin-bottom: 12px;
        }

        .countdown-display {
            display: flex;
            gap: 8px;
        }

        .countdown-segment { text-align: center; }

        .countdown-value {
            font-family: 'Orbitron', monospace;
            font-size: 1.8rem;
            font-weight: 800;
            background: linear-gradient(180deg, rgba(20, 20, 35, 0.9) 0%, rgba(10, 10, 20, 0.95) 100%);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            padding: 8px 12px;
            min-width: 52px;
            display: block;
            color: var(--gold);
            text-shadow: 0 0 20px var(--gold-glow);
            position: relative;
            overflow: hidden;
        }

        .countdown-value::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 0;
            right: 0;
            height: 1px;
            background: rgba(255, 255, 255, 0.05);
        }

        .countdown-value.urgent {
            color: #ef4444;
            text-shadow: 0 0 20px rgba(239, 68, 68, 0.6);
            animation: urgentBlink 0.5s infinite;
        }

        @keyframes urgentBlink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.6; }
        }

        .countdown-label {
            font-size: 0.6rem;
            color: var(--text-dim);
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-top: 4px;
        }

        .countdown-separator {
            font-family: 'Orbitron', monospace;
            font-size: 1.5rem;
            font-weight: 800;
            color: var(--text-dim);
            align-self: flex-start;
            padding-top: 12px;
            animation: separatorBlink 2.5s ease-in-out infinite;
        }

        @keyframes separatorBlink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.4; }
        }

        .helltide-progress { margin-top: 12px; }

        .progress-bar-container {
            background: rgba(0, 0, 0, 0.4);
            border-radius: 10px;
            height: 8px;
            overflow: hidden;
            border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .progress-bar-fill {
            height: 100%;
            border-radius: 10px;
            background: linear-gradient(90deg, var(--purple) 0%, #a855f7 50%, var(--purple) 100%);
            background-size: 200% 100%;
            animation: progressShimmer 2s infinite;
            transition: width 1s ease;
        }

        @keyframes progressShimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
        }

        .event-icon svg { width: 22px; height: 22px; }
        .world-boss .event-icon svg { fill: #ef4444; filter: drop-shadow(0 0 6px rgba(239, 68, 68, 0.5)); }
        .helltide .event-icon svg { fill: #a855f7; filter: drop-shadow(0 0 6px rgba(168, 85, 247, 0.5)); }

        .progress-label {
            display: flex;
            justify-content: space-between;
            margin-top: 6px;
            font-size: 0.7rem;
            color: var(--text-dim);
        }

        .svg-defs {
            position: absolute;
            width: 0;
            height: 0;
            overflow: hidden;
        }

        /* Timer Responsive */
        @media (max-width: 768px) {
            .event-cards { grid-template-columns: 1fr; }
            .event-card-body { flex-direction: column; text-align: center; }
            .countdown-display { justify-content: center; }
            .event-info { width: 100%; }
        }

'''

# Insert before "/* Responsive */"
old_marker = '        /* Responsive */'
content = content.replace(old_marker, timer_css + old_marker)

# Write back
with open('C:/Users/scarm/d4guide-deploy/index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('Timer CSS added successfully')
