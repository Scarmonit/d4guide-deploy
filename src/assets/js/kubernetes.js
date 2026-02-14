/**
 * Kubernetes AI Stack Live Dashboard
 * Real-time monitoring and management for Ollama + K8s infrastructure
 */

class K8sDashboard {
    constructor() {
        this.isLocalAccess = this.checkLocalAccess();
        this.config = this.loadConfig();
        this.models = [];
        this.pods = [];
        this.containers = [];
        this.isConnected = false;
        this.isK8sConnected = false;
        this.refreshInterval = null;
        this.chatAbortController = null;
    }

    checkLocalAccess() {
        const hostname = window.location.hostname;
        return hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.') || hostname.startsWith('10.');
    }

    loadConfig() {
        // Use localhost for local access, tunnel for remote
        const defaults = {
            ollamaUrl: this.isLocalAccess ? 'http://localhost:11435' : 'https://ai-api.scarmonit.com',
            k8sApiUrl: 'http://localhost:3001',
            refreshRate: 30000,
            autoRefresh: true
        };
        try {
            const saved = localStorage.getItem('k8s-dashboard-config');
            if (saved) {
                const parsed = JSON.parse(saved);
                // Auto-update URL based on access type if using default URLs
                if (parsed.ollamaUrl === 'http://localhost:11435' || parsed.ollamaUrl === 'https://ai-api.scarmonit.com') {
                    parsed.ollamaUrl = defaults.ollamaUrl;
                }
                return { ...defaults, ...parsed };
            }
            return defaults;
        } catch {
            return defaults;
        }
    }

    saveConfig() {
        localStorage.setItem('k8s-dashboard-config', JSON.stringify(this.config));
    }

    async init() {
        this.bindEvents();
        this.loadSavedConfig();
        // Auto-detect best Ollama endpoint
        await this.autoDetectOllamaUrl();
        await this.refresh();
        if (this.config.autoRefresh) {
            this.startAutoRefresh();
        }
    }

    async autoDetectOllamaUrl() {
        // Try localhost first (fastest if available)
        try {
            const localResponse = await this.fetchWithTimeout('http://localhost:11435/api/tags', {}, 2000);
            if (localResponse.ok) {
                this.config.ollamaUrl = 'http://localhost:11435';
                console.log('Using local Ollama at localhost:11435');
                return;
            }
        } catch {}

        // Fall back to tunnel
        try {
            const tunnelResponse = await this.fetchWithTimeout('https://ai-api.scarmonit.com/api/tags', {}, 3000);
            if (tunnelResponse.ok) {
                this.config.ollamaUrl = 'https://ai-api.scarmonit.com';
                console.log('Using Ollama tunnel at ai-api.scarmonit.com');
                return;
            }
        } catch {}

        console.log('No Ollama endpoint available');
    }

    bindEvents() {
        // Settings
        document.getElementById('k8s-settings-btn')?.addEventListener('click', () => this.openSettings());
        document.getElementById('k8s-settings-close')?.addEventListener('click', () => this.closeSettings());
        document.getElementById('k8s-settings-save')?.addEventListener('click', () => this.saveSettings());
        document.getElementById('k8s-settings-overlay')?.addEventListener('click', (e) => {
            if (e.target.id === 'k8s-settings-overlay') this.closeSettings();
        });

        // Refresh
        document.getElementById('k8s-refresh-btn')?.addEventListener('click', () => this.refresh());
        document.getElementById('k8s-auto-refresh')?.addEventListener('change', (e) => {
            this.config.autoRefresh = e.target.checked;
            this.saveConfig();
            e.target.checked ? this.startAutoRefresh() : this.stopAutoRefresh();
        });

        // Chat
        document.getElementById('k8s-chat-send')?.addEventListener('click', () => this.sendChat());
        document.getElementById('k8s-chat-input')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendChat();
            }
        });
        document.getElementById('k8s-chat-clear')?.addEventListener('click', () => this.clearChat());
        document.getElementById('k8s-chat-stop')?.addEventListener('click', () => this.stopChat());

        // Model actions - event delegation
        document.getElementById('k8s-models-grid')?.addEventListener('click', (e) => {
            const deleteBtn = e.target.closest('.k8s-model-delete');
            if (deleteBtn) {
                const modelName = deleteBtn.dataset.model;
                if (confirm(`Delete model "${modelName}"?`)) {
                    this.deleteModel(modelName);
                }
            }
        });

        // Pull model
        document.getElementById('k8s-pull-btn')?.addEventListener('click', () => this.pullModel());
        document.getElementById('k8s-pull-input')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.pullModel();
        });

        // Copy commands
        document.querySelectorAll('.k8s-command-copy').forEach(btn => {
            btn.addEventListener('click', () => this.copyCommand(btn));
        });

        // Health check buttons
        document.querySelectorAll('.k8s-health-check').forEach(btn => {
            btn.addEventListener('click', () => this.checkServiceHealth(btn.dataset.url, btn));
        });
    }

    loadSavedConfig() {
        const urlInput = document.getElementById('k8s-ollama-url');
        const autoRefreshCheck = document.getElementById('k8s-auto-refresh');
        if (urlInput) urlInput.value = this.config.ollamaUrl;
        if (autoRefreshCheck) autoRefreshCheck.checked = this.config.autoRefresh;
    }

    openSettings() {
        document.getElementById('k8s-settings-overlay')?.classList.add('active');
        document.getElementById('k8s-settings-url').value = this.config.ollamaUrl;
        document.getElementById('k8s-settings-api-url').value = this.config.k8sApiUrl;
    }

    closeSettings() {
        document.getElementById('k8s-settings-overlay')?.classList.remove('active');
    }

    saveSettings() {
        const url = document.getElementById('k8s-settings-url')?.value?.trim();
        const apiUrl = document.getElementById('k8s-settings-api-url')?.value?.trim();
        if (url) {
            this.config.ollamaUrl = url.replace(/\/$/, '');
        }
        if (apiUrl) {
            this.config.k8sApiUrl = apiUrl.replace(/\/$/, '');
        }
        this.saveConfig();
        this.showToast('Settings saved', 'success');
        this.closeSettings();
        this.refresh();
    }

    startAutoRefresh() {
        this.stopAutoRefresh();
        this.refreshInterval = setInterval(() => this.refresh(), this.config.refreshRate);
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    async refresh() {
        this.setLoadingState(true);
        await Promise.all([
            this.fetchModels(),
            this.checkAllHealth(),
            this.fetchK8sData()
        ]);
        this.setLoadingState(false);
        this.updateLastRefresh();
    }

    async fetchK8sData() {
        // K8s API requires local access
        if (!this.isLocalAccess && this.config.k8sApiUrl.includes('localhost')) {
            this.isK8sConnected = false;
            this.updateK8sConnectionStatus('local');
            this.renderLocalOnlyMessage('k8s-containers-list', 'Docker containers require local access');
            this.renderLocalOnlyMessage('k8s-pods-list', 'Kubernetes pods require local access');
            return;
        }

        try {
            const response = await this.fetchWithTimeout(`${this.config.k8sApiUrl}/api/dashboard`, {
                method: 'GET'
            }, 10000);

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            this.pods = data.pods?.pods || [];
            this.containers = data.containers?.containers || [];
            this.isK8sConnected = true;
            this.updateK8sConnectionStatus('connected');
            this.renderPods();
            this.renderContainers();
        } catch (error) {
            console.error('Failed to fetch K8s data:', error);
            this.isK8sConnected = false;
            this.updateK8sConnectionStatus('offline');
        }
    }

    renderLocalOnlyMessage(containerId, message) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `<div class="k8s-local-only-msg"><span class="k8s-local-icon">🔒</span> ${message}. <br><small>Access from your local network to see live data.</small></div>`;
        }
    }

    updateK8sConnectionStatus(status) {
        const statusEl = document.getElementById('k8s-api-status');
        const latencyEl = document.getElementById('k8s-api-latency');

        if (statusEl) {
            statusEl.classList.remove('k8s-health-ok', 'k8s-health-error', 'k8s-health-local');
            if (status === 'connected') {
                statusEl.classList.add('k8s-health-ok');
            } else if (status === 'local') {
                statusEl.classList.add('k8s-health-local');
            } else {
                statusEl.classList.add('k8s-health-error');
            }
        }
        if (latencyEl) {
            latencyEl.textContent = status === 'connected' ? 'connected' : status === 'local' ? 'local only' : 'offline';
        }
    }

    renderPods() {
        const container = document.getElementById('k8s-pods-list');
        if (!container) return;

        if (this.pods.length === 0) {
            container.innerHTML = '<div class="k8s-pods-empty">No pods found. Start the API server: <code>node k8s-api-server.js</code></div>';
            return;
        }

        const html = this.pods.map(pod => {
            const isRunning = pod.status === 'Running';
            const statusClass = isRunning ? 'k8s-pod-running' : 'k8s-pod-pending';
            return `
                <div class="k8s-pod-row">
                    <span class="k8s-pod-name">
                        <span class="k8s-pod-indicator ${statusClass}"></span>
                        ${this.escapeHtml(pod.name || '')}
                    </span>
                    <span class="k8s-pod-namespace">${this.escapeHtml(pod.namespace || '')}</span>
                    <span class="k8s-pod-status">${this.escapeHtml(pod.status || '')}</span>
                    <span class="k8s-pod-age">${this.escapeHtml(pod.age || '')}</span>
                </div>`;
        }).join('');

        container.innerHTML = html;
    }

    renderContainers() {
        const container = document.getElementById('k8s-containers-list');
        if (!container) return;

        if (this.containers.length === 0) {
            container.innerHTML = '<div class="k8s-containers-empty">No Docker containers found</div>';
            return;
        }

        const html = this.containers.map(c => {
            const isRunning = c.State === 'running';
            const statusClass = isRunning ? 'k8s-pod-running' : 'k8s-pod-pending';
            return `
                <div class="k8s-container-row">
                    <span class="k8s-container-name">
                        <span class="k8s-pod-indicator ${statusClass}"></span>
                        ${this.escapeHtml(c.Names || '')}
                    </span>
                    <span class="k8s-container-image">${this.escapeHtml(c.Image || '')}</span>
                    <span class="k8s-container-status">${this.escapeHtml(c.Status || '')}</span>
                    <span class="k8s-container-ports">${this.escapeHtml(c.Ports || '')}</span>
                </div>`;
        }).join('');

        container.innerHTML = html;
    }

    setLoadingState(loading) {
        const refreshBtn = document.getElementById('k8s-refresh-btn');
        if (refreshBtn) {
            refreshBtn.classList.toggle('loading', loading);
            refreshBtn.disabled = loading;
        }
    }

    updateLastRefresh() {
        const el = document.getElementById('k8s-last-refresh');
        if (el) {
            el.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
        }
    }

    async fetchModels() {
        try {
            const response = await this.fetchWithTimeout(`${this.config.ollamaUrl}/api/tags`, {
                method: 'GET'
            }, 10000);

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            this.models = data.models || [];
            this.isConnected = true;
            this.updateConnectionStatus(true);
            this.renderModels();
            this.updateModelSelector();
            this.updateModelCount();
        } catch (error) {
            console.error('Failed to fetch models:', error);
            this.isConnected = false;
            this.updateConnectionStatus(false);
            this.renderModelsError(error.message);
        }
    }

    async fetchWithTimeout(url, options = {}, timeout = 5000) {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        try {
            const response = await fetch(url, { ...options, signal: controller.signal });
            clearTimeout(id);
            return response;
        } catch (error) {
            clearTimeout(id);
            throw error;
        }
    }

    updateConnectionStatus(connected) {
        const statusEl = document.getElementById('k8s-connection-status');
        const statusDot = document.getElementById('k8s-status-dot');
        const statusText = document.getElementById('k8s-status-text');

        if (statusEl) statusEl.classList.toggle('connected', connected);
        if (statusDot) {
            statusDot.classList.toggle('k8s-dot-green', connected);
            statusDot.classList.toggle('k8s-dot-red', !connected);
        }
        if (statusText) statusText.textContent = connected ? 'Connected' : 'Disconnected';
    }

    updateModelCount() {
        const countEl = document.getElementById('k8s-model-count');
        if (countEl) {
            const localCount = this.models.filter(m => !m.name.includes(':cloud')).length;
            const cloudCount = this.models.filter(m => m.name.includes(':cloud')).length;
            countEl.textContent = `${this.models.length} models (${localCount} local, ${cloudCount} cloud)`;
        }
    }

    renderModels() {
        const container = document.getElementById('k8s-models-grid');
        if (!container) return;

        if (this.models.length === 0) {
            container.innerHTML = `
                <div class="k8s-models-empty">
                    <p>No models installed</p>
                    <p class="k8s-hint">Pull a model using the input above</p>
                </div>`;
            return;
        }

        const html = this.models.map(model => {
            const isCloud = model.name.includes(':cloud');
            const size = model.size ? this.formatBytes(model.size) : 'Cloud';
            const family = model.details?.family || 'Unknown';
            const params = model.details?.parameter_size || '';
            const quant = model.details?.quantization_level || '';

            return `
                <div class="k8s-model-card ${isCloud ? 'k8s-model-cloud' : 'k8s-model-local'}">
                    <div class="k8s-model-header">
                        <span class="k8s-model-name">${this.escapeHtml(model.name)}</span>
                        <span class="k8s-model-type">${isCloud ? 'Cloud' : 'Local'}</span>
                    </div>
                    <div class="k8s-model-meta">
                        <span class="k8s-model-size">${size}</span>
                        ${params ? `<span class="k8s-model-params">${params}</span>` : ''}
                        ${quant ? `<span class="k8s-model-quant">${quant}</span>` : ''}
                    </div>
                    <div class="k8s-model-family">${this.escapeHtml(family)}</div>
                    <div class="k8s-model-actions">
                        <button class="k8s-model-chat" onclick="k8sDashboard.startChatWith('${this.escapeHtml(model.name)}')">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                            Chat
                        </button>
                        ${!isCloud ? `
                        <button class="k8s-model-delete" data-model="${this.escapeHtml(model.name)}">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>` : ''}
                    </div>
                </div>`;
        }).join('');

        container.innerHTML = html;
    }

    renderModelsError(message) {
        const container = document.getElementById('k8s-models-grid');
        if (container) {
            container.innerHTML = `
                <div class="k8s-models-error">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <p>Could not connect to Ollama</p>
                    <p class="k8s-hint">${this.escapeHtml(message)}</p>
                    <button onclick="k8sDashboard.openSettings()">Configure Endpoint</button>
                </div>`;
        }
    }

    updateModelSelector() {
        const selector = document.getElementById('k8s-chat-model');
        if (!selector) return;

        const currentValue = selector.value;
        selector.innerHTML = this.models.map(m =>
            `<option value="${this.escapeHtml(m.name)}">${this.escapeHtml(m.name)}</option>`
        ).join('');

        if (currentValue && this.models.some(m => m.name === currentValue)) {
            selector.value = currentValue;
        }
    }

    startChatWith(modelName) {
        const selector = document.getElementById('k8s-chat-model');
        const input = document.getElementById('k8s-chat-input');
        if (selector) selector.value = modelName;
        if (input) input.focus();
        document.getElementById('k8s-chat-section')?.scrollIntoView({ behavior: 'smooth' });
    }

    async sendChat() {
        const modelSelector = document.getElementById('k8s-chat-model');
        const input = document.getElementById('k8s-chat-input');
        const output = document.getElementById('k8s-chat-output');
        const sendBtn = document.getElementById('k8s-chat-send');
        const stopBtn = document.getElementById('k8s-chat-stop');
        const statsEl = document.getElementById('k8s-chat-stats');

        if (!modelSelector || !input || !output) return;

        const model = modelSelector.value;
        const prompt = input.value.trim();

        if (!prompt) {
            this.showToast('Enter a message', 'warning');
            return;
        }

        if (!model) {
            this.showToast('Select a model', 'warning');
            return;
        }

        // Add user message
        output.innerHTML += `<div class="k8s-chat-msg k8s-chat-user"><strong>You:</strong> ${this.escapeHtml(prompt)}</div>`;
        input.value = '';

        // Setup streaming
        this.chatAbortController = new AbortController();
        sendBtn.disabled = true;
        stopBtn.style.display = 'inline-flex';

        const assistantMsg = document.createElement('div');
        assistantMsg.className = 'k8s-chat-msg k8s-chat-assistant';
        assistantMsg.innerHTML = '<strong>Assistant:</strong> <span class="k8s-chat-response"></span>';
        output.appendChild(assistantMsg);
        output.scrollTop = output.scrollHeight;

        const responseSpan = assistantMsg.querySelector('.k8s-chat-response');
        let fullResponse = '';
        let tokenCount = 0;
        const startTime = Date.now();

        try {
            const response = await fetch(`${this.config.ollamaUrl}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ model, prompt, stream: true }),
                signal: this.chatAbortController.signal
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n').filter(l => l.trim());

                for (const line of lines) {
                    try {
                        const data = JSON.parse(line);
                        if (data.response) {
                            fullResponse += data.response;
                            tokenCount++;
                            responseSpan.textContent = fullResponse;
                            output.scrollTop = output.scrollHeight;
                        }
                        if (data.done) {
                            const elapsed = (Date.now() - startTime) / 1000;
                            const tokPerSec = (tokenCount / elapsed).toFixed(1);
                            if (statsEl) {
                                statsEl.textContent = `${tokenCount} tokens in ${elapsed.toFixed(1)}s (${tokPerSec} tok/s)`;
                            }
                        }
                    } catch {}
                }
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                responseSpan.textContent += ' [Stopped]';
            } else {
                responseSpan.innerHTML = `<span class="k8s-error">Error: ${this.escapeHtml(error.message)}</span>`;
            }
        } finally {
            sendBtn.disabled = false;
            stopBtn.style.display = 'none';
            this.chatAbortController = null;
        }
    }

    stopChat() {
        if (this.chatAbortController) {
            this.chatAbortController.abort();
        }
    }

    clearChat() {
        const output = document.getElementById('k8s-chat-output');
        const stats = document.getElementById('k8s-chat-stats');
        if (output) output.innerHTML = '';
        if (stats) stats.textContent = '';
    }

    async pullModel() {
        const input = document.getElementById('k8s-pull-input');
        const btn = document.getElementById('k8s-pull-btn');
        const progress = document.getElementById('k8s-pull-progress');

        if (!input) return;

        const modelName = input.value.trim();
        if (!modelName) {
            this.showToast('Enter a model name', 'warning');
            return;
        }

        btn.disabled = true;
        progress.style.display = 'block';
        progress.innerHTML = `<div class="k8s-pull-status">Pulling ${this.escapeHtml(modelName)}...</div><div class="k8s-pull-bar"><div class="k8s-pull-fill"></div></div>`;

        try {
            const response = await fetch(`${this.config.ollamaUrl}/api/pull`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: modelName, stream: true })
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            const fillEl = progress.querySelector('.k8s-pull-fill');
            const statusEl = progress.querySelector('.k8s-pull-status');

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n').filter(l => l.trim());

                for (const line of lines) {
                    try {
                        const data = JSON.parse(line);
                        if (data.status) {
                            statusEl.textContent = data.status;
                        }
                        if (data.completed && data.total) {
                            const pct = (data.completed / data.total * 100).toFixed(0);
                            fillEl.style.width = `${pct}%`;
                        }
                    } catch {}
                }
            }

            this.showToast(`Model ${modelName} pulled successfully`, 'success');
            input.value = '';
            await this.fetchModels();
        } catch (error) {
            this.showToast(`Failed to pull model: ${error.message}`, 'error');
        } finally {
            btn.disabled = false;
            progress.style.display = 'none';
        }
    }

    async deleteModel(modelName) {
        try {
            const response = await fetch(`${this.config.ollamaUrl}/api/delete`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: modelName })
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            this.showToast(`Model ${modelName} deleted`, 'success');
            await this.fetchModels();
        } catch (error) {
            this.showToast(`Failed to delete model: ${error.message}`, 'error');
        }
    }

    async checkAllHealth() {
        const endpoints = [
            { id: 'ollama', url: `${this.config.ollamaUrl}/api/tags`, name: 'Ollama API', localOnly: false },
            { id: 'webui', url: 'http://localhost:3000', name: 'Open WebUI', localOnly: true },
            { id: 'openai', url: `${this.config.ollamaUrl}/v1/models`, name: 'OpenAI API', localOnly: false }
        ];

        for (const endpoint of endpoints) {
            await this.checkEndpointHealth(endpoint);
        }
    }

    async checkEndpointHealth(endpoint) {
        const indicator = document.getElementById(`k8s-health-${endpoint.id}`);
        const latencyEl = document.getElementById(`k8s-latency-${endpoint.id}`);

        if (indicator) indicator.classList.remove('k8s-health-ok', 'k8s-health-error', 'k8s-health-local');

        // Skip localhost endpoints when accessed remotely
        if (endpoint.localOnly && !this.isLocalAccess) {
            if (indicator) indicator.classList.add('k8s-health-local');
            if (latencyEl) latencyEl.textContent = 'local only';
            return;
        }

        const startTime = Date.now();

        try {
            const response = await this.fetchWithTimeout(endpoint.url, { method: 'GET' }, 5000);
            const latency = Date.now() - startTime;

            if (indicator) indicator.classList.add('k8s-health-ok');
            if (latencyEl) latencyEl.textContent = `${latency}ms`;
        } catch {
            if (indicator) indicator.classList.add('k8s-health-error');
            if (latencyEl) latencyEl.textContent = 'timeout';
        }
    }

    async checkServiceHealth(url, btn) {
        btn.disabled = true;
        const startTime = Date.now();

        try {
            await this.fetchWithTimeout(url, { method: 'GET' }, 5000);
            const latency = Date.now() - startTime;
            this.showToast(`${url} OK (${latency}ms)`, 'success');
        } catch (error) {
            this.showToast(`${url} failed: ${error.message}`, 'error');
        } finally {
            btn.disabled = false;
        }
    }

    copyCommand(btn) {
        const code = btn.closest('.k8s-command-card')?.querySelector('code')?.textContent;
        if (code) {
            navigator.clipboard.writeText(code).then(() => {
                const originalText = btn.innerHTML;
                btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>';
                setTimeout(() => { btn.innerHTML = originalText; }, 1500);
            });
        }
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('k8s-toast-container') || this.createToastContainer();
        const toast = document.createElement('div');
        toast.className = `k8s-toast k8s-toast-${type}`;
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    createToastContainer() {
        const container = document.createElement('div');
        container.id = 'k8s-toast-container';
        document.body.appendChild(container);
        return container;
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize on DOM ready
let k8sDashboard;
document.addEventListener('DOMContentLoaded', () => {
    k8sDashboard = new K8sDashboard();
    k8sDashboard.init();
});
