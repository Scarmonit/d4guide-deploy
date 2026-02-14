/**
 * Screen Share - WebRTC P2P Screen Sharing
 * Uses PeerJS for signaling and WebRTC for peer-to-peer streaming
 * https://scarmonit.com/screen-share/
 */

(function() {
    'use strict';

    // Prevent double initialization
    if (window.__screenShareInitialized) return;
    window.__screenShareInitialized = true;

    // PeerJS CDN
    const PEERJS_CDN = 'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js';

    // TURN Credentials API endpoint
    const TURN_API_URL = '/api/turn-credentials';

    // TCP-capable TURN servers (always included for firewall/NAT traversal)
    // Cloudflare TURN only supports UDP relay, so we need TCP fallbacks
    const TCP_TURN_SERVERS = [
        {
            urls: 'turn:freestun.net:3478?transport=tcp',
            username: 'free',
            credential: 'free'
        },
        {
            urls: [
                'turn:freestun.net:3478?transport=udp',
                'turn:freestun.net:3478?transport=tcp'
            ],
            username: 'free',
            credential: 'free'
        }
    ];

    // Fallback ICE Servers (used if Cloudflare API fails completely)
    const FALLBACK_ICE_SERVERS = [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun.cloudflare.com:3478' },
        ...TCP_TURN_SERVERS
    ];

    // Cached ICE servers (fetched dynamically)
    let cachedIceServers = null;
    let iceServersFetchTime = 0;
    const ICE_SERVERS_CACHE_DURATION = 3600000; // 1 hour cache

    /**
     * Fetch TURN credentials from API
     * Always combines Cloudflare TURN (UDP) with TCP-capable fallback servers
     * This ensures connectivity even when UDP is blocked (mobile networks)
     */
    async function getIceServers() {
        const now = Date.now();

        // Return cached servers if still valid
        if (cachedIceServers && (now - iceServersFetchTime) < ICE_SERVERS_CACHE_DURATION) {
            console.log('Using cached ICE servers');
            return cachedIceServers;
        }

        let cloudflareServers = [];

        try {
            console.log('Fetching TURN credentials from API...');
            const response = await fetch(TURN_API_URL);

            if (!response.ok) {
                throw new Error(`API returned ${response.status}`);
            }

            const data = await response.json();
            console.log('TURN credentials source:', data.source);

            if (data.iceServers && data.iceServers.length > 0) {
                cloudflareServers = data.iceServers;
                console.log('Cloudflare ICE servers loaded:', cloudflareServers.length);
            }
        } catch (error) {
            console.warn('Failed to fetch Cloudflare TURN credentials:', error.message);
        }

        // IMPORTANT: Always combine Cloudflare servers with TCP-capable TURN servers
        // Cloudflare TURN only supports UDP relay, which mobile networks often block
        // TCP fallback servers ensure connectivity across all network types
        const combinedServers = [
            ...cloudflareServers,
            ...TCP_TURN_SERVERS
        ];

        // If no Cloudflare servers, use full fallback list
        if (cloudflareServers.length === 0) {
            console.log('Using fallback ICE servers only');
            cachedIceServers = FALLBACK_ICE_SERVERS;
        } else {
            cachedIceServers = combinedServers;
        }

        iceServersFetchTime = now;
        console.log('Total ICE servers configured:', cachedIceServers.length);
        return cachedIceServers;
    }

    // State
    let peer = null;
    let localStream = null;
    let currentCall = null;
    let viewerConnections = new Map();
    let shareCode = null;
    let isSharing = false;
    let isViewing = false;

    // DOM Elements cache
    let elements = {};

    /**
     * Load PeerJS library dynamically
     */
    function loadPeerJS() {
        return new Promise((resolve, reject) => {
            if (window.Peer) {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = PEERJS_CDN;
            script.onload = resolve;
            script.onerror = () => reject(new Error('Failed to load PeerJS'));
            document.head.appendChild(script);
        });
    }

    /**
     * Initialize DOM element references
     */
    function initializeElements() {
        elements = {
            modeBroadcast: document.getElementById('mode-broadcast'),
            modeViewer: document.getElementById('mode-viewer'),
            broadcastPanel: document.getElementById('broadcast-panel'),
            viewerPanel: document.getElementById('viewer-panel'),
            broadcastStart: document.getElementById('broadcast-start'),
            broadcastActive: document.getElementById('broadcast-active'),
            viewerConnect: document.getElementById('viewer-connect'),
            viewerWatching: document.getElementById('viewer-watching'),
            localPreview: document.getElementById('local-preview'),
            remoteVideo: document.getElementById('remote-video'),
            shareCodeDisplay: document.getElementById('share-code'),
            viewerCountNum: document.getElementById('viewer-count-num'),
            joinCodeInput: document.getElementById('join-code'),
            connectStatus: document.getElementById('connect-status'),
            streamCodeDisplay: document.getElementById('stream-code-display'),
            copyFeedback: document.getElementById('copy-feedback'),
            pipBtn: document.getElementById('pip-btn'),
            fullscreenBtn: document.getElementById('fullscreen-btn'),
            streamContainer: document.getElementById('stream-container')
        };
    }

    /**
     * Setup event listeners
     */
    function setupEventListeners() {
        // Keyboard shortcuts for fullscreen
        if (elements.streamContainer) {
            elements.streamContainer.addEventListener('keydown', function(e) {
                if (e.key === 'f' || e.key === 'F') {
                    toggleFullscreen();
                }
            });
            elements.streamContainer.addEventListener('dblclick', toggleFullscreen);
        }

        // Enter key to connect
        if (elements.joinCodeInput) {
            elements.joinCodeInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter' && elements.joinCodeInput.value.length === 6) {
                    connectToStream();
                }
            });
        }

        // Fullscreen change events
        document.addEventListener('fullscreenchange', updateFullscreenIcon);
        document.addEventListener('webkitfullscreenchange', updateFullscreenIcon);

        // PiP events
        if (elements.remoteVideo) {
            elements.remoteVideo.addEventListener('enterpictureinpicture', function() {
                if (elements.pipBtn) elements.pipBtn.classList.add('active');
            });
            elements.remoteVideo.addEventListener('leavepictureinpicture', function() {
                if (elements.pipBtn) elements.pipBtn.classList.remove('active');
            });
        }
    }

    /**
     * Generate a random 6-character alphanumeric code
     */
    function generateShareCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    /**
     * Switch between broadcast and viewer modes
     */
    function switchMode(mode) {
        if (mode === 'broadcast' && isViewing) {
            disconnectFromStream();
        } else if (mode === 'viewer' && isSharing) {
            stopSharing();
        }

        if (mode === 'broadcast') {
            if (elements.modeBroadcast) elements.modeBroadcast.classList.add('active');
            if (elements.modeViewer) elements.modeViewer.classList.remove('active');
            if (elements.broadcastPanel) elements.broadcastPanel.classList.remove('hidden');
            if (elements.viewerPanel) elements.viewerPanel.classList.add('hidden');
        } else {
            if (elements.modeBroadcast) elements.modeBroadcast.classList.remove('active');
            if (elements.modeViewer) elements.modeViewer.classList.add('active');
            if (elements.broadcastPanel) elements.broadcastPanel.classList.add('hidden');
            if (elements.viewerPanel) elements.viewerPanel.classList.remove('hidden');
        }
    }

    /**
     * Start screen sharing (broadcaster)
     */
    async function startSharing() {
        try {
            // Request screen capture
            localStream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    cursor: 'always',
                    displaySurface: 'monitor'
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true
                }
            });

            // Show preview
            if (elements.localPreview) {
                elements.localPreview.srcObject = localStream;
            }

            // Handle stream end (user clicks "Stop sharing" in browser)
            localStream.getVideoTracks()[0].onended = function() {
                stopSharing();
            };

            // Generate share code and fetch TURN credentials
            shareCode = generateShareCode();

            // Fetch dynamic TURN credentials
            const iceServers = await getIceServers();
            console.log('Using', iceServers.length, 'ICE servers for broadcast');

            // Create peer with the share code as ID
            // Force TURN relay to ensure cross-network connectivity
            peer = new Peer(shareCode, {
                debug: 2,
                config: {
                    iceServers: iceServers,
                    iceTransportPolicy: 'all',
                    iceCandidatePoolSize: 10
                }
            });

            peer.on('open', function(id) {
                console.log('Broadcaster peer ID:', id);
                isSharing = true;

                if (elements.shareCodeDisplay) {
                    elements.shareCodeDisplay.textContent = shareCode;
                }
                if (elements.broadcastStart) elements.broadcastStart.classList.add('hidden');
                if (elements.broadcastActive) elements.broadcastActive.classList.remove('hidden');
                updateViewerCount();
            });

            peer.on('call', function(call) {
                console.log('Incoming viewer call:', call.peer);
                call.answer(localStream);
                viewerConnections.set(call.peer, call);
                updateViewerCount();

                // Monitor ICE connection state for this viewer
                if (call.peerConnection) {
                    call.peerConnection.oniceconnectionstatechange = function() {
                        const state = call.peerConnection.iceConnectionState;
                        console.log('Viewer', call.peer, 'ICE state:', state);

                        if (state === 'failed') {
                            console.error('ICE connection failed for viewer:', call.peer);
                            // Try ICE restart
                            if (call.peerConnection.restartIce) {
                                console.log('Attempting ICE restart for viewer:', call.peer);
                                call.peerConnection.restartIce();
                            }
                        }
                    };
                }

                call.on('close', function() {
                    console.log('Viewer disconnected:', call.peer);
                    viewerConnections.delete(call.peer);
                    updateViewerCount();
                });

                call.on('error', function(err) {
                    console.error('Call error for viewer', call.peer, ':', err);
                    viewerConnections.delete(call.peer);
                    updateViewerCount();
                });
            });

            peer.on('error', function(err) {
                console.error('Peer error:', err);
                if (err.type === 'unavailable-id') {
                    shareCode = generateShareCode();
                    peer.destroy();
                    startSharing();
                }
            });

            peer.on('disconnected', function() {
                console.log('Peer disconnected, attempting reconnect...');
                peer.reconnect();
            });

        } catch (err) {
            console.error('Error starting screen share:', err);
            if (err.name === 'NotAllowedError') {
                alert('Screen sharing permission denied. Please allow screen sharing to continue.');
            } else {
                alert('Error starting screen share: ' + err.message);
            }
        }
    }

    /**
     * Stop screen sharing (broadcaster)
     */
    function stopSharing() {
        if (localStream) {
            localStream.getTracks().forEach(function(track) { track.stop(); });
            localStream = null;
        }

        viewerConnections.forEach(function(call) { call.close(); });
        viewerConnections.clear();

        if (peer) {
            peer.destroy();
            peer = null;
        }

        isSharing = false;
        shareCode = null;

        if (elements.localPreview) {
            elements.localPreview.srcObject = null;
        }
        if (elements.shareCodeDisplay) {
            elements.shareCodeDisplay.textContent = '------';
        }
        if (elements.broadcastStart) elements.broadcastStart.classList.remove('hidden');
        if (elements.broadcastActive) elements.broadcastActive.classList.add('hidden');
        updateViewerCount();
    }

    /**
     * Copy share code to clipboard
     */
    async function copyShareCode() {
        if (!shareCode) return;

        try {
            await navigator.clipboard.writeText(shareCode);
            showCopyFeedback();
        } catch (err) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = shareCode;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showCopyFeedback();
        }
    }

    function showCopyFeedback() {
        if (elements.copyFeedback) {
            elements.copyFeedback.classList.add('show');
            setTimeout(function() {
                elements.copyFeedback.classList.remove('show');
            }, 2000);
        }
    }

    /**
     * Connect to a stream as viewer
     */
    async function connectToStream() {
        const code = elements.joinCodeInput ? elements.joinCodeInput.value.toUpperCase().trim() : '';

        if (!code || code.length !== 6) {
            setConnectStatus('Please enter a valid 6-character code', 'error');
            return;
        }

        setConnectStatus('Fetching connection servers...', '');

        try {
            // Fetch dynamic TURN credentials
            const iceServers = await getIceServers();
            console.log('Using', iceServers.length, 'ICE servers for viewing');

            setConnectStatus('Connecting to signaling server...', '');

            // Force TURN relay to ensure cross-network connectivity
            peer = new Peer({
                debug: 2,
                config: {
                    iceServers: iceServers,
                    iceTransportPolicy: 'all',
                    iceCandidatePoolSize: 10
                }
            });

            peer.on('open', function(myId) {
                console.log('Viewer peer ID:', myId);
                setConnectStatus('Finding stream...', '');

                currentCall = peer.call(code, new MediaStream());

                if (!currentCall) {
                    setConnectStatus('Failed to connect. Invalid code?', 'error');
                    return;
                }

                // Monitor ICE connection state
                if (currentCall.peerConnection) {
                    currentCall.peerConnection.oniceconnectionstatechange = function() {
                        const state = currentCall.peerConnection.iceConnectionState;
                        console.log('ICE connection state:', state);

                        switch(state) {
                            case 'checking':
                                setConnectStatus('Establishing connection...', '');
                                break;
                            case 'connected':
                            case 'completed':
                                console.log('ICE connection established');
                                break;
                            case 'failed':
                                console.error('ICE connection failed');
                                setConnectStatus('Connection failed. Try again or check network.', 'error');
                                break;
                            case 'disconnected':
                                console.warn('ICE connection disconnected, may reconnect...');
                                break;
                        }
                    };

                    // Monitor ICE gathering state
                    currentCall.peerConnection.onicegatheringstatechange = function() {
                        console.log('ICE gathering state:', currentCall.peerConnection.iceGatheringState);
                    };

                    // Log ICE candidates for debugging
                    currentCall.peerConnection.onicecandidate = function(event) {
                        if (event.candidate) {
                            console.log('ICE candidate:', event.candidate.type, event.candidate.protocol);
                        }
                    };
                }

                currentCall.on('stream', function(remoteStream) {
                    console.log('Received remote stream with', remoteStream.getTracks().length, 'tracks');
                    isViewing = true;

                    if (elements.remoteVideo) {
                        elements.remoteVideo.srcObject = remoteStream;
                        // Ensure video plays
                        elements.remoteVideo.play().catch(function(e) {
                            console.log('Autoplay prevented, user interaction needed');
                        });
                    }

                    if (elements.streamCodeDisplay) {
                        elements.streamCodeDisplay.textContent = 'Code: ' + code;
                    }
                    if (elements.viewerConnect) elements.viewerConnect.classList.add('hidden');
                    if (elements.viewerWatching) elements.viewerWatching.classList.remove('hidden');
                    setConnectStatus('', '');
                });

                currentCall.on('close', function() {
                    console.log('Call closed');
                    // Only show "stream ended" if we were actually viewing
                    if (isViewing) {
                        disconnectFromStream();
                        setConnectStatus('Stream ended by broadcaster', 'error');
                    }
                });

                currentCall.on('error', function(err) {
                    console.error('Call error:', err);
                    setConnectStatus('Connection error: ' + (err.message || err.type || 'Unknown'), 'error');
                });

                // Connection timeout - extended to 30 seconds for slow connections
                setTimeout(function() {
                    if (!isViewing && currentCall) {
                        const iceState = currentCall.peerConnection ?
                            currentCall.peerConnection.iceConnectionState : 'unknown';
                        console.log('Connection timeout. ICE state:', iceState);

                        if (iceState === 'checking' || iceState === 'new') {
                            setConnectStatus('Connection timed out. Network may be blocking WebRTC.', 'error');
                        } else {
                            setConnectStatus('Connection timed out. Check the code and try again.', 'error');
                        }

                        if (peer) {
                            peer.destroy();
                            peer = null;
                        }
                    }
                }, 30000);
            });

            peer.on('error', function(err) {
                console.error('Peer error:', err);
                if (err.type === 'peer-unavailable') {
                    setConnectStatus('Stream not found. Check the code and try again.', 'error');
                } else {
                    setConnectStatus('Connection error: ' + err.message, 'error');
                }
            });

        } catch (err) {
            console.error('Error connecting to stream:', err);
            setConnectStatus('Error: ' + err.message, 'error');
        }
    }

    /**
     * Disconnect from stream (viewer)
     */
    function disconnectFromStream() {
        if (currentCall) {
            currentCall.close();
            currentCall = null;
        }

        if (peer && !isSharing) {
            peer.destroy();
            peer = null;
        }

        if (document.pictureInPictureElement) {
            document.exitPictureInPicture().catch(function() {});
        }

        isViewing = false;

        if (elements.remoteVideo) {
            elements.remoteVideo.srcObject = null;
        }
        if (elements.joinCodeInput) {
            elements.joinCodeInput.value = '';
        }
        if (elements.streamCodeDisplay) {
            elements.streamCodeDisplay.textContent = 'Code: ------';
        }
        if (elements.viewerConnect) elements.viewerConnect.classList.remove('hidden');
        if (elements.viewerWatching) elements.viewerWatching.classList.add('hidden');
        setConnectStatus('', '');
    }

    /**
     * Toggle Picture-in-Picture mode
     */
    async function togglePictureInPicture() {
        const video = elements.remoteVideo;
        if (!video) return;

        try {
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
            } else if (document.pictureInPictureEnabled) {
                await video.requestPictureInPicture();
            }
        } catch (err) {
            console.error('PiP error:', err);
        }
    }

    /**
     * Toggle fullscreen mode
     */
    function toggleFullscreen() {
        const container = elements.streamContainer;
        if (!container) return;

        try {
            if (document.fullscreenElement || document.webkitFullscreenElement) {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                } else if (document.webkitExitFullscreen) {
                    document.webkitExitFullscreen();
                }
            } else {
                if (container.requestFullscreen) {
                    container.requestFullscreen();
                } else if (container.webkitRequestFullscreen) {
                    container.webkitRequestFullscreen();
                }
            }
        } catch (err) {
            console.error('Fullscreen error:', err);
        }
    }

    /**
     * Update fullscreen button icon
     */
    function updateFullscreenIcon() {
        const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement;
        const expandIcon = elements.fullscreenBtn ? elements.fullscreenBtn.querySelector('.icon-expand') : null;
        const compressIcon = elements.fullscreenBtn ? elements.fullscreenBtn.querySelector('.icon-compress') : null;

        if (isFullscreen) {
            if (expandIcon) expandIcon.classList.add('hidden');
            if (compressIcon) compressIcon.classList.remove('hidden');
        } else {
            if (expandIcon) expandIcon.classList.remove('hidden');
            if (compressIcon) compressIcon.classList.add('hidden');
        }
    }

    /**
     * Update viewer count display
     */
    function updateViewerCount() {
        if (elements.viewerCountNum) {
            elements.viewerCountNum.textContent = viewerConnections.size;
        }
    }

    /**
     * Set connection status message
     */
    function setConnectStatus(message, type) {
        if (elements.connectStatus) {
            elements.connectStatus.textContent = message;
            elements.connectStatus.className = 'status-text' + (type ? ' ' + type : '');
        }
    }

    /**
     * Initialize the application
     */
    async function init() {
        try {
            await loadPeerJS();
            initializeElements();
            setupEventListeners();
            console.log('Screen share initialized successfully');
        } catch (err) {
            console.error('Failed to initialize screen share:', err);
        }
    }

    // Expose functions to global scope for onclick handlers
    window.switchMode = switchMode;
    window.startSharing = startSharing;
    window.stopSharing = stopSharing;
    window.copyShareCode = copyShareCode;
    window.connectToStream = connectToStream;
    window.disconnectFromStream = disconnectFromStream;
    window.togglePictureInPicture = togglePictureInPicture;
    window.toggleFullscreen = toggleFullscreen;

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // DOM already ready, initialize now
        init();
    }

    // Cleanup on page unload
    window.addEventListener('beforeunload', function() {
        if (isSharing) stopSharing();
        if (isViewing) disconnectFromStream();
    });

})();
