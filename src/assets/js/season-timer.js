/**
 * Season Timer Component
 * Displays countdown to season end and next season start
 */

class SeasonTimer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.seasonData = null;
    this.intervalId = null;

    this.init();
  }

  async init() {
    await this.fetchSeasonData();
    this.render();
    this.startCountdown();
  }

  async fetchSeasonData() {
    try {
      const response = await fetch('/api/d4/season');
      if (response.ok) {
        this.seasonData = await response.json();
      }
    } catch (err) {
      console.error('Failed to fetch season data:', err);
    }
  }

  calculateTimeRemaining(endDate) {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end - now;

    if (diff <= 0) {
      return { ended: true };
    }

    return {
      ended: false,
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((diff % (1000 * 60)) / 1000),
    };
  }

  formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  }

  render() {
    if (!this.container || !this.seasonData) {
      if (this.container) {
        this.container.innerHTML = '<div class="season-timer-loading">Loading season info...</div>';
      }
      return;
    }

    const { current, next } = this.seasonData;

    let html = '<div class="season-timer">';

    if (current && !current.ended) {
      const timeLeft = this.calculateTimeRemaining(current.end);

      html += `
        <div class="season-current">
          <div class="season-label">
            <span class="season-badge">Season ${current.season}</span>
            <span class="season-name">${current.name}</span>
          </div>
          <div class="season-countdown" data-end="${current.end}">
            <div class="countdown-title">Season Ends In</div>
            <div class="countdown-timer">
              <div class="countdown-segment">
                <span class="countdown-value" data-days>${timeLeft.days}</span>
                <span class="countdown-label">Days</span>
              </div>
              <div class="countdown-segment">
                <span class="countdown-value" data-hours>${String(timeLeft.hours).padStart(2, '0')}</span>
                <span class="countdown-label">Hours</span>
              </div>
              <div class="countdown-segment">
                <span class="countdown-value" data-minutes>${String(timeLeft.minutes).padStart(2, '0')}</span>
                <span class="countdown-label">Min</span>
              </div>
              <div class="countdown-segment">
                <span class="countdown-value" data-seconds>${String(timeLeft.seconds).padStart(2, '0')}</span>
                <span class="countdown-label">Sec</span>
              </div>
            </div>
            <div class="countdown-date">Ends: ${this.formatDate(current.end)}</div>
          </div>
        </div>
      `;
    } else if (current && current.ended) {
      html += `
        <div class="season-ended">
          <div class="season-badge ended">Season ${current.season} Ended</div>
        </div>
      `;
    }

    if (next) {
      const timeUntil = this.calculateTimeRemaining(next.start);

      if (!timeUntil.ended) {
        html += `
          <div class="season-next">
            <div class="next-season-label">
              <span class="next-badge">Season ${next.season}</span>
              <span class="next-name">${next.name !== 'TBA' ? next.name : 'Coming Soon'}</span>
            </div>
            <div class="next-countdown" data-start="${next.start}">
              <div class="countdown-title">Starts In</div>
              <div class="countdown-timer next">
                <div class="countdown-segment">
                  <span class="countdown-value" data-next-days>${timeUntil.days}</span>
                  <span class="countdown-label">Days</span>
                </div>
                <div class="countdown-segment">
                  <span class="countdown-value" data-next-hours>${String(timeUntil.hours).padStart(2, '0')}</span>
                  <span class="countdown-label">Hours</span>
                </div>
                <div class="countdown-segment">
                  <span class="countdown-value" data-next-minutes>${String(timeUntil.minutes).padStart(2, '0')}</span>
                  <span class="countdown-label">Min</span>
                </div>
                <div class="countdown-segment">
                  <span class="countdown-value" data-next-seconds>${String(timeUntil.seconds).padStart(2, '0')}</span>
                  <span class="countdown-label">Sec</span>
                </div>
              </div>
              <div class="countdown-date">Starts: ${this.formatDate(next.start)}</div>
            </div>
          </div>
        `;
      }
    }

    html += '</div>';
    this.container.innerHTML = html;
  }

  startCountdown() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.intervalId = setInterval(() => {
      this.updateCountdowns();
    }, 1000);
  }

  updateCountdowns() {
    if (!this.seasonData) return;

    const { current, next } = this.seasonData;

    // Update current season countdown
    if (current && !current.ended) {
      const timeLeft = this.calculateTimeRemaining(current.end);

      if (timeLeft.ended) {
        // Season just ended, refresh data
        this.fetchSeasonData().then(() => this.render());
        return;
      }

      const daysEl = this.container.querySelector('[data-days]');
      const hoursEl = this.container.querySelector('[data-hours]');
      const minutesEl = this.container.querySelector('[data-minutes]');
      const secondsEl = this.container.querySelector('[data-seconds]');

      if (daysEl) daysEl.textContent = timeLeft.days;
      if (hoursEl) hoursEl.textContent = String(timeLeft.hours).padStart(2, '0');
      if (minutesEl) minutesEl.textContent = String(timeLeft.minutes).padStart(2, '0');
      if (secondsEl) secondsEl.textContent = String(timeLeft.seconds).padStart(2, '0');
    }

    // Update next season countdown
    if (next) {
      const timeUntil = this.calculateTimeRemaining(next.start);

      if (!timeUntil.ended) {
        const daysEl = this.container.querySelector('[data-next-days]');
        const hoursEl = this.container.querySelector('[data-next-hours]');
        const minutesEl = this.container.querySelector('[data-next-minutes]');
        const secondsEl = this.container.querySelector('[data-next-seconds]');

        if (daysEl) daysEl.textContent = timeUntil.days;
        if (hoursEl) hoursEl.textContent = String(timeUntil.hours).padStart(2, '0');
        if (minutesEl) minutesEl.textContent = String(timeUntil.minutes).padStart(2, '0');
        if (secondsEl) secondsEl.textContent = String(timeUntil.seconds).padStart(2, '0');
      } else {
        // Next season started, refresh
        this.fetchSeasonData().then(() => this.render());
      }
    }
  }

  destroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}

// Auto-initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('season-timer')) {
    window.seasonTimer = new SeasonTimer('season-timer');
  }
});
