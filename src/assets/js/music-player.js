'use strict';

// ==========================================================================
// SONG DATA
// ==========================================================================

const SONGS = [
    {
        id: 'd6724c9b-d471-4b22-9bcb-9d6666aa406c',
        title: 'Gospal',
        artist: 'scarmonit',
        album: 'Scarmonit Originals',
        duration: 479.36,
        file: '/music/songs/d6724c9b-d471-4b22-9bcb-9d6666aa406c.mp3',
        cover: '/music/covers/d6724c9b-d471-4b22-9bcb-9d6666aa406c.jpeg',
        genre: 'Original'
    },
    {
        id: 'e6c5195e-4062-4432-8812-faa209796caf',
        title: 'Static Crackle',
        artist: 'scarmonit',
        album: 'Scarmonit Originals',
        duration: 221,
        file: '/music/songs/e6c5195e-4062-4432-8812-faa209796caf.mp3',
        cover: '/music/covers/e6c5195e-4062-4432-8812-faa209796caf.jpeg',
        genre: 'Original'
    },
    {
        id: 'a7583d8f-61d4-4eae-afc2-e0990e2cbf37',
        title: 'Soft Intimate Delivery',
        artist: 'scarmonit',
        album: 'Scarmonit Originals',
        duration: 315,
        file: '/music/songs/a7583d8f-61d4-4eae-afc2-e0990e2cbf37.mp3',
        cover: '/music/covers/a7583d8f-61d4-4eae-afc2-e0990e2cbf37.jpeg',
        genre: 'Original'
    },
    {
        id: '12cf931f-b477-4e1c-b9a2-9127f110ece1',
        title: 'Heavy Breathing',
        artist: 'scarmonit',
        album: 'Scarmonit Originals',
        duration: 191,
        file: '/music/songs/12cf931f-b477-4e1c-b9a2-9127f110ece1.mp3',
        cover: '/music/covers/12cf931f-b477-4e1c-b9a2-9127f110ece1.jpeg',
        genre: 'Original'
    },
    {
        id: '5d8ddfe6-6bde-42b3-89af-d00d426df9e5',
        title: 'Chains Rattling I',
        artist: 'scarmonit',
        album: 'Chains Rattling',
        duration: 344,
        file: '/music/songs/5d8ddfe6-6bde-42b3-89af-d00d426df9e5.mp3',
        cover: '/music/covers/5d8ddfe6-6bde-42b3-89af-d00d426df9e5.jpeg',
        genre: 'Original'
    },
    {
        id: 'a97f6809-739f-4d03-906b-3ead87ddf564',
        title: 'Chains Rattling II',
        artist: 'scarmonit',
        album: 'Chains Rattling',
        duration: 138,
        file: '/music/songs/a97f6809-739f-4d03-906b-3ead87ddf564.mp3',
        cover: '/music/covers/a97f6809-739f-4d03-906b-3ead87ddf564.jpeg',
        genre: 'Original'
    },
    {
        id: '54e25645-1bc4-4a0a-9756-28c4890e5a10',
        title: 'Chains Rattling III',
        artist: 'scarmonit',
        album: 'Chains Rattling',
        duration: 379,
        file: '/music/songs/54e25645-1bc4-4a0a-9756-28c4890e5a10.mp3',
        cover: '/music/covers/54e25645-1bc4-4a0a-9756-28c4890e5a10.jpeg',
        genre: 'Original'
    },
    {
        id: 'd0040e0b-868b-49cd-b439-b9c87b5f4126',
        title: 'Kingdom Bells I',
        artist: 'scarmonit',
        album: 'Kingdom Bells',
        duration: 467,
        file: '/music/songs/d0040e0b-868b-49cd-b439-b9c87b5f4126.mp3',
        cover: '/music/covers/d0040e0b-868b-49cd-b439-b9c87b5f4126.jpeg',
        genre: 'Original'
    },
    {
        id: '06a780c2-9e84-4d0e-87a1-21e21cb181a2',
        title: 'Kingdom Bells II',
        artist: 'scarmonit',
        album: 'Kingdom Bells',
        duration: 219,
        file: '/music/songs/06a780c2-9e84-4d0e-87a1-21e21cb181a2.mp3',
        cover: '/music/covers/06a780c2-9e84-4d0e-87a1-21e21cb181a2.jpeg',
        genre: 'Original'
    },
    {
        id: '9f066cf9-3279-4387-ab24-5e6d58f549c5',
        title: 'Kingdom Bells III',
        artist: 'scarmonit',
        album: 'Kingdom Bells',
        duration: 124,
        file: '/music/songs/9f066cf9-3279-4387-ab24-5e6d58f549c5.mp3',
        cover: '/music/covers/9f066cf9-3279-4387-ab24-5e6d58f549c5.jpeg',
        genre: 'Original'
    },
    {
        id: 'ba193fe2-a351-4ae2-98a9-b5d4ee33df86',
        title: 'Acoustic Fingerpicking I',
        artist: 'scarmonit',
        album: 'Acoustic Fingerpicking',
        duration: 184,
        file: '/music/songs/ba193fe2-a351-4ae2-98a9-b5d4ee33df86.mp3',
        cover: '/music/covers/ba193fe2-a351-4ae2-98a9-b5d4ee33df86.jpeg',
        genre: 'Acoustic'
    },
    {
        id: '68a378d9-bbe6-4466-9078-5d8f651a2067',
        title: 'Acoustic Fingerpicking II',
        artist: 'scarmonit',
        album: 'Acoustic Fingerpicking',
        duration: 180,
        file: '/music/songs/68a378d9-bbe6-4466-9078-5d8f651a2067.mp3',
        cover: '/music/covers/68a378d9-bbe6-4466-9078-5d8f651a2067.jpeg',
        genre: 'Acoustic'
    },
    {
        id: '1c402a10-fa56-4f8c-b4cf-1ece202c8d6e',
        title: 'Betrayal',
        artist: 'scarmonit',
        album: 'Scarmonit Originals',
        duration: 259,
        file: '/music/songs/1c402a10-fa56-4f8c-b4cf-1ece202c8d6e.mp3',
        cover: '/music/covers/1c402a10-fa56-4f8c-b4cf-1ece202c8d6e.jpeg',
        genre: 'Original'
    },
    {
        id: '22b769cf-5711-4410-ba11-e4de9de7b997',
        title: 'Piano Rain',
        artist: 'scarmonit',
        album: 'Scarmonit Originals',
        duration: 240,
        file: '/music/songs/22b769cf-5711-4410-ba11-e4de9de7b997.mp3',
        cover: '/music/covers/22b769cf-5711-4410-ba11-e4de9de7b997.jpeg',
        genre: 'Original'
    },
    {
        id: '27c5313e-2f69-4f4a-b359-924a4f290b8f',
        title: 'Skrrrt',
        artist: 'scarmonit',
        album: 'Scarmonit Originals',
        duration: 200,
        file: '/music/songs/27c5313e-2f69-4f4a-b359-924a4f290b8f.mp3',
        cover: '/music/covers/27c5313e-2f69-4f4a-b359-924a4f290b8f.jpeg',
        genre: 'Original'
    },
    {
        id: '242e7901-7af2-4f8c-926a-207e28397e4d',
        title: 'Velvet Nights',
        artist: 'scarmonit',
        album: 'Scarmonit Originals',
        duration: 274,
        file: '/music/songs/242e7901-7af2-4f8c-926a-207e28397e4d.mp3',
        cover: '/music/covers/242e7901-7af2-4f8c-926a-207e28397e4d.jpeg',
        genre: 'Original'
    },
    {
        id: '53f5c867-5a87-4816-b5f8-d040027334c0',
        title: 'Unbreakable',
        artist: 'scarmonit',
        album: 'Scarmonit Originals',
        duration: 210,
        file: '/music/songs/53f5c867-5a87-4816-b5f8-d040027334c0.mp3',
        cover: '/music/covers/53f5c867-5a87-4816-b5f8-d040027334c0.jpeg',
        genre: 'Original'
    },
    {
        id: '0b5c423a-e32a-4002-9f5f-f141deb7ebeb',
        title: 'Disco Therapy',
        artist: 'scarmonit',
        album: 'Scarmonit Originals',
        duration: 214,
        file: '/music/songs/0b5c423a-e32a-4002-9f5f-f141deb7ebeb.mp3',
        cover: '/music/covers/0b5c423a-e32a-4002-9f5f-f141deb7ebeb.jpeg',
        genre: 'Original'
    },
    {
        id: 'e189ec99-377b-4423-bb50-cbb635a806bc',
        title: 'Fuego',
        artist: 'scarmonit',
        album: 'Scarmonit Originals',
        duration: 183,
        file: '/music/songs/e189ec99-377b-4423-bb50-cbb635a806bc.mp3',
        cover: '/music/covers/e189ec99-377b-4423-bb50-cbb635a806bc.jpeg',
        genre: 'Original'
    },
    {
        id: '58c7020e-933d-4ed6-9358-ea28d030053d',
        title: 'Overdrive',
        artist: 'scarmonit',
        album: 'Scarmonit Originals',
        duration: 206,
        file: '/music/songs/58c7020e-933d-4ed6-9358-ea28d030053d.mp3',
        cover: '/music/covers/58c7020e-933d-4ed6-9358-ea28d030053d.jpeg',
        genre: 'Original'
    },
    {
        id: '61f7aa4d-4945-446b-99f8-46851f882721',
        title: 'Mmm Mmm I',
        artist: 'scarmonit',
        album: 'Mmm Mmm',
        duration: 240,
        file: '/music/songs/61f7aa4d-4945-446b-99f8-46851f882721.mp3',
        cover: '/music/covers/61f7aa4d-4945-446b-99f8-46851f882721.jpeg',
        genre: 'Original'
    },
    {
        id: '56844c22-faa0-4400-83a3-fe63009c0ed3',
        title: 'Mmm Mmm II',
        artist: 'scarmonit',
        album: 'Mmm Mmm',
        duration: 236,
        file: '/music/songs/56844c22-faa0-4400-83a3-fe63009c0ed3.mp3',
        cover: '/music/covers/56844c22-faa0-4400-83a3-fe63009c0ed3.jpeg',
        genre: 'Original'
    },
    {
        id: '734125a7-d04e-40bb-930e-9fb19f564b33',
        title: 'Mmm Mmm III',
        artist: 'scarmonit',
        album: 'Mmm Mmm',
        duration: 267,
        file: '/music/songs/734125a7-d04e-40bb-930e-9fb19f564b33.mp3',
        cover: '/music/covers/734125a7-d04e-40bb-930e-9fb19f564b33.jpeg',
        genre: 'Original'
    },
    {
        id: '6af637d8-aa0f-4ada-8a86-9ee66874fb44',
        title: 'Cerca de Ti',
        artist: 'scarmonit',
        album: 'Scarmonit Originals',
        duration: 187,
        file: '/music/songs/6af637d8-aa0f-4ada-8a86-9ee66874fb44.mp3',
        cover: '/music/covers/6af637d8-aa0f-4ada-8a86-9ee66874fb44.jpeg',
        genre: 'Original'
    },
    {
        id: '4d481550-5dc6-48d3-8841-056651b56005',
        title: 'Mmm Mmm IV',
        artist: 'scarmonit',
        album: 'Mmm Mmm',
        duration: 281,
        file: '/music/songs/4d481550-5dc6-48d3-8841-056651b56005.mp3',
        cover: '/music/covers/4d481550-5dc6-48d3-8841-056651b56005.jpeg',
        genre: 'Original'
    },
    {
        id: '857e8032-2f32-48d7-ba64-97a74c0e8c9f',
        title: 'Sweater in the Closet',
        artist: 'scarmonit',
        album: 'Scarmonit Originals',
        duration: 257,
        file: '/music/songs/857e8032-2f32-48d7-ba64-97a74c0e8c9f.mp3',
        cover: '/music/covers/857e8032-2f32-48d7-ba64-97a74c0e8c9f.jpeg',
        genre: 'Original'
    },
    {
        id: 'd2037eb6-4ca8-433f-9ba2-d1722afcb2c2',
        title: 'Between the Glow and the Cold',
        artist: 'scarmonit',
        album: 'Scarmonit Originals',
        duration: 348,
        file: '/music/songs/d2037eb6-4ca8-433f-9ba2-d1722afcb2c2.mp3',
        cover: '/music/covers/d2037eb6-4ca8-433f-9ba2-d1722afcb2c2.jpeg',
        genre: 'Original'
    },
    {
        id: 'c7a48e8e-dfe3-48b7-967e-a4b1ed4f1cad',
        title: 'Ringmaster Voice',
        artist: 'scarmonit',
        album: 'Scarmonit Originals',
        duration: 316,
        file: '/music/songs/c7a48e8e-dfe3-48b7-967e-a4b1ed4f1cad.mp3',
        cover: '/music/covers/c7a48e8e-dfe3-48b7-967e-a4b1ed4f1cad.jpeg',
        genre: 'Original'
    },
    {
        id: 'e6e59e91-b3ba-4daf-991a-bf75e6e8f5c7',
        title: 'Spoken Cold',
        artist: 'scarmonit',
        album: 'Scarmonit Originals',
        duration: 250,
        file: '/music/songs/e6e59e91-b3ba-4daf-991a-bf75e6e8f5c7.mp3',
        cover: '/music/covers/e6e59e91-b3ba-4daf-991a-bf75e6e8f5c7.jpeg',
        genre: 'Original'
    },
    {
        id: '11c5b3e6-bfa1-4bd0-a4cb-cf4d66c2c28e',
        title: 'Soft Spoken',
        artist: 'scarmonit',
        album: 'Scarmonit Originals',
        duration: 200,
        file: '/music/songs/11c5b3e6-bfa1-4bd0-a4cb-cf4d66c2c28e.mp3',
        cover: '/music/covers/11c5b3e6-bfa1-4bd0-a4cb-cf4d66c2c28e.jpeg',
        genre: 'Original'
    },
    {
        id: 'ff01e4a1-a9a1-45e7-9b86-6eb8971e11bf',
        title: 'Mmm Yeah',
        artist: 'scarmonit',
        album: 'Mmm Mmm',
        duration: 243,
        file: '/music/songs/ff01e4a1-a9a1-45e7-9b86-6eb8971e11bf.mp3',
        cover: '/music/covers/ff01e4a1-a9a1-45e7-9b86-6eb8971e11bf.jpeg',
        genre: 'Original'
    },
    {
        id: 'e73b9965-1f5b-410e-ad39-aa7a1e2e4caf',
        title: 'Stomp It Out',
        artist: 'scarmonit',
        album: 'Scarmonit Originals',
        duration: 430,
        file: '/music/songs/e73b9965-1f5b-410e-ad39-aa7a1e2e4caf.mp3',
        cover: '/music/covers/e73b9965-1f5b-410e-ad39-aa7a1e2e4caf.jpeg',
        genre: 'Original'
    },
    {
        id: 'acf4e3e3-dcd2-4fa7-b2d3-3e7e1b6e7949',
        title: 'Holding My Breath',
        artist: 'scarmonit',
        album: 'Scarmonit Originals',
        duration: 279,
        file: '/music/songs/acf4e3e3-dcd2-4fa7-b2d3-3e7e1b6e7949.mp3',
        cover: '/music/covers/acf4e3e3-dcd2-4fa7-b2d3-3e7e1b6e7949.jpeg',
        genre: 'Original'
    },
    {
        id: 'f7fb9cd2-a18c-4b3f-955f-6be7f23bc57e',
        title: 'Falling Awake',
        artist: 'scarmonit',
        album: 'Scarmonit Originals',
        duration: 462,
        file: '/music/songs/f7fb9cd2-a18c-4b3f-955f-6be7f23bc57e.mp3',
        cover: '/music/covers/f7fb9cd2-a18c-4b3f-955f-6be7f23bc57e.jpeg',
        genre: 'Original'
    },
    {
        id: '90c66be8-88b9-454c-9e86-4dc0e51e7f2e',
        title: 'Gospal (Remix)',
        artist: 'scarmonit',
        album: 'Scarmonit Originals',
        duration: 197,
        file: '/music/songs/90c66be8-88b9-454c-9e86-4dc0e51e7f2e.mp3',
        cover: '/music/covers/90c66be8-88b9-454c-9e86-4dc0e51e7f2e.jpeg',
        genre: 'Original'
    },
    {
        id: '3edf6268-07b0-470d-bc1e-33317f0aa3b2',
        title: 'Heavy Drum Beat',
        artist: 'scarmonit',
        album: 'Scarmonit Originals',
        duration: 206,
        file: '/music/songs/3edf6268-07b0-470d-bc1e-33317f0aa3b2.mp3',
        cover: '/music/covers/3edf6268-07b0-470d-bc1e-33317f0aa3b2.jpeg',
        genre: 'Original'
    },
    {
        id: 'df2ddf7e-6ac1-4411-8b86-c25e1f82e4a3',
        title: 'Mmm Mmm V',
        artist: 'scarmonit',
        album: 'Mmm Mmm',
        duration: 399,
        file: '/music/songs/df2ddf7e-6ac1-4411-8b86-c25e1f82e4a3.mp3',
        cover: '/music/covers/df2ddf7e-6ac1-4411-8b86-c25e1f82e4a3.jpeg',
        genre: 'Original'
    },
    {
        id: 'aa74f51f-ca3e-4501-beec-e63c9e2c8a22',
        title: 'Mmm Mmm VI',
        artist: 'scarmonit',
        album: 'Mmm Mmm',
        duration: 241,
        file: '/music/songs/aa74f51f-ca3e-4501-beec-e63c9e2c8a22.mp3',
        cover: '/music/covers/aa74f51f-ca3e-4501-beec-e63c9e2c8a22.jpeg',
        genre: 'Original'
    }
];

const DEFAULT_PLAYLISTS = [
    { id: 'all', name: 'All Songs', icon: 'music', songs: [] },
    { id: 'favorites', name: 'Favorites', icon: 'heart', songs: [] }
];

// ==========================================================================
// MUSIC PLAYER CLASS
// ==========================================================================

class MusicPlayer {
    constructor() {
        this.audio = new Audio();
        this.audio.preload = 'metadata';
        this.songs = [...SONGS];
        this.queue = [];
        this.originalQueue = [];
        this.currentIndex = -1;
        this.isPlaying = false;
        this.isShuffled = false;
        this.repeatMode = 'off'; // off, all, one
        this.volume = 0.8;
        this.favorites = [];
        this.customPlaylists = [];
        this.currentPlaylistId = 'all';
        this.contextMenu = null;
        this.sortField = null;
        this.sortDir = 'asc';

        this.loadState();
        this.bindElements();
        this.bindEvents();
        this.resolveDurations();
        this.renderSidebar();
        this.loadPlaylist('all');
        this.restoreLastPlayed();
    }

    // ==========================================================================
    // STATE PERSISTENCE
    // ==========================================================================

    loadState() {
        try {
            const fav = localStorage.getItem('music_favorites');
            if (fav) this.favorites = JSON.parse(fav);

            const vol = localStorage.getItem('music_volume');
            if (vol !== null) this.volume = parseFloat(vol);

            const rep = localStorage.getItem('music_repeat');
            if (rep) this.repeatMode = rep;

            const shuf = localStorage.getItem('music_shuffle');
            if (shuf !== null) this.isShuffled = shuf === 'true';

            const cp = localStorage.getItem('music_custom_playlists');
            if (cp) this.customPlaylists = JSON.parse(cp);
        } catch (e) {
            // Silently fail on storage read errors
        }
    }

    saveState() {
        try {
            localStorage.setItem('music_favorites', JSON.stringify(this.favorites));
            localStorage.setItem('music_volume', String(this.volume));
            localStorage.setItem('music_repeat', this.repeatMode);
            localStorage.setItem('music_shuffle', String(this.isShuffled));
            localStorage.setItem('music_custom_playlists', JSON.stringify(this.customPlaylists));
        } catch (e) {
            // Silently fail on storage write errors
        }
    }

    saveLastPlayed() {
        try {
            if (this.currentIndex >= 0 && this.queue[this.currentIndex]) {
                localStorage.setItem('music_last_played', JSON.stringify({
                    songId: this.queue[this.currentIndex].id,
                    position: this.audio.currentTime || 0
                }));
            }
        } catch (e) {
            // Silently fail
        }
    }

    restoreLastPlayed() {
        try {
            const data = localStorage.getItem('music_last_played');
            if (!data) return;
            const { songId, position } = JSON.parse(data);
            const songIndex = this.songs.findIndex(s => s.id === songId);
            if (songIndex < 0) return;

            this.setQueue(this.songs, songIndex);
            this.audio.src = this.songs[songIndex].file;
            this.audio.setAttribute('data-song-id', songId);

            const seekWhenReady = () => {
                if (position > 0 && isFinite(position)) {
                    this.audio.currentTime = position;
                }
                this.audio.removeEventListener('loadedmetadata', seekWhenReady);
            };
            this.audio.addEventListener('loadedmetadata', seekWhenReady);
            this.audio.load();

            // Update UI without playing
            this.renderNowPlaying();
            this.updateActiveSong();
        } catch (e) {
            // Silently fail
        }
    }

    // ==========================================================================
    // DOM BINDING
    // ==========================================================================

    bindElements() {
        this.el = {
            app: document.getElementById('music-app'),
            sidebar: document.getElementById('music-sidebar'),
            sidebarToggle: document.getElementById('sidebar-toggle'),
            sidebarMobileToggle: document.getElementById('sidebar-mobile-toggle'),
            sidebarOverlay: document.getElementById('music-sidebar-overlay'),
            playlistList: document.getElementById('playlist-list'),
            createPlaylistBtn: document.getElementById('create-playlist-btn'),
            playlistTitle: document.getElementById('playlist-title'),
            playlistMeta: document.getElementById('playlist-meta'),
            playlistArt: document.getElementById('playlist-art'),
            playAllBtn: document.getElementById('play-all-btn'),
            shuffleAllBtn: document.getElementById('shuffle-all-btn'),
            songSearch: document.getElementById('song-search'),
            songListBody: document.getElementById('song-list-body'),
            emptyState: document.getElementById('music-empty-state'),
            emptySearch: document.getElementById('music-empty-search'),
            songList: document.getElementById('song-list'),
            // Now playing
            npAlbumArt: document.getElementById('np-album-art'),
            npTitle: document.getElementById('np-title'),
            npArtist: document.getElementById('np-artist'),
            npFavoriteBtn: document.getElementById('np-favorite-btn'),
            npShuffle: document.getElementById('np-shuffle'),
            npPrev: document.getElementById('np-prev'),
            npPlayPause: document.getElementById('np-play-pause'),
            npNext: document.getElementById('np-next'),
            npRepeat: document.getElementById('np-repeat'),
            repeatBadge: document.getElementById('repeat-badge'),
            npTimeCurrent: document.getElementById('np-time-current'),
            npTimeTotal: document.getElementById('np-time-total'),
            npProgressTrack: document.getElementById('np-progress-track'),
            npProgressFill: document.getElementById('np-progress-fill'),
            npProgressBar: document.getElementById('np-progress-bar'),
            npQueueBtn: document.getElementById('np-queue-btn'),
            npVolumeBtn: document.getElementById('np-volume-btn'),
            npVolumeFill: document.getElementById('np-volume-fill'),
            npVolumeSlider: document.getElementById('np-volume-slider'),
            // Queue
            queuePanel: document.getElementById('queue-panel'),
            queueOverlay: document.getElementById('queue-overlay'),
            queueClose: document.getElementById('queue-close'),
            queueNow: document.getElementById('queue-now'),
            queueNext: document.getElementById('queue-next'),
            // Shortcuts
            shortcutsOverlay: document.getElementById('shortcuts-overlay'),
            shortcutsClose: document.getElementById('shortcuts-close'),
            // Accessibility
            npAnnounce: document.getElementById('np-announce'),
            // Shortcuts hint
            shortcutsHintBtn: document.getElementById('shortcuts-hint-btn')
        };
    }

    // ==========================================================================
    // EVENT BINDING
    // ==========================================================================

    bindEvents() {
        // Audio events
        this.audio.addEventListener('timeupdate', () => {
            if (!this._lastSaveTime || Date.now() - this._lastSaveTime > 5000) {
                this.saveLastPlayed();
                this._lastSaveTime = Date.now();
            }
        });
        this.audio.addEventListener('ended', () => this.onSongEnd());
        this.audio.addEventListener('loadedmetadata', () => this.onMetadataLoaded());
        this.audio.addEventListener('error', (e) => this.onAudioError(e));

        // Transport controls
        this.el.npPlayPause.addEventListener('click', () => this.togglePlay());
        this.el.npPrev.addEventListener('click', () => this.prev());
        this.el.npNext.addEventListener('click', () => this.next());
        this.el.npShuffle.addEventListener('click', () => this.toggleShuffle());
        this.el.npRepeat.addEventListener('click', () => this.toggleRepeat());

        // Play all / shuffle all
        this.el.playAllBtn.addEventListener('click', () => this.playAll());
        this.el.shuffleAllBtn.addEventListener('click', () => this.shufflePlay());

        // Progress bar
        this.el.npProgressBar.addEventListener('input', (e) => this.onSeek(e));

        // Click-to-seek on progress track
        this.el.npProgressTrack.addEventListener('click', (e) => {
            if (!this.audio.duration) return;
            const rect = this.el.npProgressTrack.getBoundingClientRect();
            const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            this.seek(ratio * this.audio.duration);
        });

        // Volume
        this.el.npVolumeSlider.addEventListener('input', (e) => {
            this.onVolumeChange(e);
            this._showVolumeTooltip(parseFloat(e.target.value));
        });
        this.el.npVolumeSlider.addEventListener('change', () => {
            this._hideVolumeTooltip();
        });
        this.el.npVolumeBtn.addEventListener('click', () => this.toggleMute());
        this.audio.volume = this.volume;
        this.el.npVolumeSlider.value = this.volume * 100;
        this.el.npVolumeFill.style.width = (this.volume * 100) + '%';
        this.updateVolumeIcon();

        // Favorite in now-playing
        this.el.npFavoriteBtn.addEventListener('click', () => {
            if (this.currentIndex >= 0 && this.queue[this.currentIndex]) {
                this.toggleFavorite(this.queue[this.currentIndex].id);
            }
        });

        // Queue
        this.el.npQueueBtn.addEventListener('click', () => this.toggleQueue());
        this.el.queueClose.addEventListener('click', () => this.closeQueue());
        if (this.el.queueOverlay) {
            this.el.queueOverlay.addEventListener('click', () => this.closeQueue());
        }

        // Sidebar mobile
        this.el.sidebarMobileToggle.addEventListener('click', () => this.openSidebar());
        this.el.sidebarToggle.addEventListener('click', () => this.closeSidebar());
        this.el.sidebarOverlay.addEventListener('click', () => this.closeSidebar());

        // Create playlist
        this.el.createPlaylistBtn.addEventListener('click', () => this.showCreatePlaylistModal());

        // Song search (debounced)
        let searchTimeout;
        this.el.songSearch.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => this.filterSongs(e.target.value), 150);
        });
        this.el.songSearch.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                e.target.value = '';
                e.target.blur();
                this.loadPlaylist(this.currentPlaylistId);
            }
        });

        // Sort column headers
        document.querySelectorAll('.col-sortable').forEach(btn => {
            btn.addEventListener('click', () => this.onSortClick(btn.getAttribute('data-sort')));
        });

        // Shortcuts overlay
        if (this.el.shortcutsHintBtn) {
            this.el.shortcutsHintBtn.addEventListener('click', () => this.showShortcuts());
        }
        this.el.shortcutsClose.addEventListener('click', () => this.hideShortcuts());
        this.el.shortcutsOverlay.addEventListener('click', (e) => {
            if (e.target === this.el.shortcutsOverlay) this.hideShortcuts();
        });

        // Song list click delegation
        this.el.songListBody.addEventListener('click', (e) => this.onSongListClick(e));

        // Song list keyboard navigation
        this.el.songListBody.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                const row = e.target.closest('.song-row');
                if (row) {
                    e.preventDefault();
                    row.click();
                }
            }
        });

        // Song list right-click delegation
        this.el.songListBody.addEventListener('contextmenu', (e) => this.onSongContextMenu(e));

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.onKeyDown(e));

        // Close context menu on click outside
        document.addEventListener('click', () => this.closeContextMenu());

        // Shuffle/repeat initial state
        if (this.isShuffled) this.el.npShuffle.classList.add('active');
        this.updateRepeatUI();
    }

    // ==========================================================================
    // AUDIO ENGINE
    // ==========================================================================

    play(song) {
        if (song) {
            const idx = this.queue.findIndex(s => s.id === song.id);
            if (idx >= 0) this.currentIndex = idx;
        }

        const current = this.queue[this.currentIndex];
        if (!current) return;

        // Add loading indicator to the active song row
        const loadingRow = this.el.songListBody.querySelector('[data-song-id="' + current.id + '"]');
        if (loadingRow) loadingRow.classList.add('loading');

        // Remove loading on canplay/playing/error
        var removeLoading = () => {
            if (loadingRow) loadingRow.classList.remove('loading');
            this.audio.removeEventListener('canplay', removeLoading);
            this.audio.removeEventListener('playing', removeLoading);
            this.audio.removeEventListener('error', removeLoading);
        };
        this.audio.addEventListener('canplay', removeLoading);
        this.audio.addEventListener('playing', removeLoading);
        this.audio.addEventListener('error', removeLoading);

        try {
            if (this.audio.src !== window.location.origin + current.file &&
                this.audio.getAttribute('data-song-id') !== current.id) {
                this.audio.src = current.file;
                this.audio.setAttribute('data-song-id', current.id);
            }
            this.audio.play().then(() => {
                this.isPlaying = true;
                this._errorCount = 0;
                this.updatePlayPauseUI();
                this.updateNowPlaying();
                this.updateActiveSong();
                this.updateMediaSession();
                this.saveLastPlayed();
                this.startProgressLoop();
                this._preloadNext();
                this.el.npAlbumArt.classList.add('spinning');
                this.el.npAlbumArt.classList.remove('paused');
                if ('mediaSession' in navigator) {
                    navigator.mediaSession.playbackState = 'playing';
                }
            }).catch((err) => {
                removeLoading();
                if (err.name === 'NotAllowedError') {
                    this.showToast('Tap play to start - autoplay blocked by browser');
                    this.isPlaying = false;
                    this.updatePlayPauseUI();
                }
            });
        } catch (e) {
            // Audio source error
            removeLoading();
        }
    }

    pause() {
        try {
            this.audio.pause();
        } catch (e) {
            // Ignore
        }
        this.isPlaying = false;
        this.updatePlayPauseUI();
        this.updateActiveSong();
        this.saveLastPlayed();
        this.stopProgressLoop();
        this.el.npAlbumArt.classList.add('paused');
        if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'paused';
        }
    }

    togglePlay() {
        if (this.currentIndex < 0 && this.queue.length > 0) {
            this.currentIndex = 0;
            this.play();
            return;
        }
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    next() {
        if (this.queue.length === 0) return;

        this.currentIndex++;
        if (this.currentIndex >= this.queue.length) {
            if (this.repeatMode === 'all') {
                this.currentIndex = 0;
            } else {
                this.currentIndex = this.queue.length - 1;
                this.pause();
                return;
            }
        }

        this.audio.setAttribute('data-song-id', '');
        this.play();
    }

    prev() {
        if (this.queue.length === 0) return;

        // If more than 3 seconds in, restart current song
        if (this.audio.currentTime > 3) {
            this.audio.currentTime = 0;
            return;
        }

        this.currentIndex--;
        if (this.currentIndex < 0) {
            if (this.repeatMode === 'all') {
                this.currentIndex = this.queue.length - 1;
            } else {
                this.currentIndex = 0;
            }
        }

        this.audio.setAttribute('data-song-id', '');
        this.play();
    }

    seek(time) {
        try {
            if (isFinite(time) && this.audio.duration) {
                this.audio.currentTime = Math.max(0, Math.min(time, this.audio.duration));
            }
        } catch (e) {
            // Ignore
        }
    }

    setVolume(val) {
        this.volume = Math.max(0, Math.min(1, val));
        try {
            this.audio.volume = this.volume;
        } catch (e) {
            // Ignore
        }
        this.el.npVolumeFill.style.width = (this.volume * 100) + '%';
        this.el.npVolumeSlider.value = this.volume * 100;
        this.updateVolumeIcon();
        this.saveState();
    }

    toggleMute() {
        if (this.volume > 0) {
            this._preMuteVolume = this.volume;
            this.audio.volume = 0;
            this.volume = 0;
            this.el.npVolumeFill.style.transition = 'width 0.2s ease';
            this.el.npVolumeFill.style.width = '0%';
            this.el.npVolumeSlider.value = 0;
            this.updateVolumeIcon();
            this.saveState();
            setTimeout(() => { this.el.npVolumeFill.style.transition = 'none'; }, 200);
        } else {
            var vol = this._preMuteVolume || 0.8;
            this.audio.volume = vol;
            this.volume = vol;
            this.el.npVolumeFill.style.transition = 'width 0.2s ease';
            this.el.npVolumeFill.style.width = (vol * 100) + '%';
            this.el.npVolumeSlider.value = vol * 100;
            this.updateVolumeIcon();
            this.saveState();
            setTimeout(() => { this.el.npVolumeFill.style.transition = 'none'; }, 200);
        }
    }

    toggleShuffle() {
        this.isShuffled = !this.isShuffled;
        this.el.npShuffle.classList.toggle('active', this.isShuffled);
        this.el.npShuffle.setAttribute('aria-pressed', String(this.isShuffled));

        if (this.isShuffled) {
            this.shuffleQueue();
        } else {
            this.unshuffleQueue();
        }
        this.saveState();
        this.renderQueue();
    }

    toggleRepeat() {
        const modes = ['off', 'all', 'one'];
        const idx = modes.indexOf(this.repeatMode);
        this.repeatMode = modes[(idx + 1) % modes.length];
        this.updateRepeatUI();
        this.saveState();
    }

    // ==========================================================================
    // QUEUE MANAGEMENT
    // ==========================================================================

    setQueue(songs, startIndex) {
        this.queue = [...songs];
        this.originalQueue = [...songs];
        this.currentIndex = startIndex || 0;

        if (this.isShuffled) {
            this.shuffleQueue();
        }
    }

    addToQueue(song) {
        this.queue.push(song);
        this.originalQueue.push(song);
        this.renderQueue();
        this.showToast('Added to queue');
    }

    removeFromQueue(index) {
        if (index === this.currentIndex) {
            this.queue.splice(index, 1);
            if (this.queue.length === 0) {
                this.currentIndex = -1;
                this.pause();
                this.renderNowPlaying();
            } else {
                if (this.currentIndex >= this.queue.length) {
                    this.currentIndex = 0;
                }
                this.audio.setAttribute('data-song-id', '');
                this.play();
            }
        } else {
            if (index < this.currentIndex) {
                this.currentIndex--;
            }
            this.queue.splice(index, 1);
        }
        this.renderQueue();
    }

    shuffleQueue() {
        const current = this.queue[this.currentIndex];
        const rest = this.queue.filter((_, i) => i !== this.currentIndex);

        for (let i = rest.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [rest[i], rest[j]] = [rest[j], rest[i]];
        }

        this.queue = current ? [current, ...rest] : rest;
        this.currentIndex = current ? 0 : -1;
    }

    unshuffleQueue() {
        const current = this.queue[this.currentIndex];
        this.queue = [...this.originalQueue];
        if (current) {
            this.currentIndex = this.queue.findIndex(s => s.id === current.id);
            if (this.currentIndex < 0) this.currentIndex = 0;
        }
    }

    // ==========================================================================
    // PLAYLIST MANAGEMENT
    // ==========================================================================

    loadPlaylist(playlistId) {
        this.currentPlaylistId = playlistId;
        let songs = [];
        let title = 'All Songs';

        if (playlistId === 'all') {
            songs = [...this.songs];
            title = 'All Songs';
        } else if (playlistId === 'favorites') {
            songs = this.songs.filter(s => this.favorites.includes(s.id));
            title = 'Favorites';
        } else {
            const pl = this.customPlaylists.find(p => p.id === playlistId);
            if (pl) {
                songs = pl.songs.map(id => this.songs.find(s => s.id === id)).filter(Boolean);
                title = pl.name;
            }
        }

        this.el.playlistTitle.textContent = title;
        const totalSecs = songs.reduce((sum, s) => sum + (s.duration || 0), 0);
        const durStr = this.formatDurationLong(totalSecs);
        this.el.playlistMeta.textContent = songs.length + (songs.length === 1 ? ' song' : ' songs') + (durStr ? ', ' + durStr : '');
        this.renderSongList(songs);
        this.updateActivePlaylist();
    }

    showCreatePlaylistModal() {
        const overlay = document.createElement('div');
        overlay.className = 'playlist-modal-overlay';
        overlay.innerHTML =
            '<div class="playlist-modal">' +
                '<h3>Create Playlist</h3>' +
                '<input type="text" placeholder="Playlist name" maxlength="50" autofocus>' +
                '<div class="playlist-modal-actions">' +
                    '<button class="modal-cancel">Cancel</button>' +
                    '<button class="modal-confirm">Create</button>' +
                '</div>' +
            '</div>';

        document.body.appendChild(overlay);

        const input = overlay.querySelector('input');
        const cancel = overlay.querySelector('.modal-cancel');
        const confirm = overlay.querySelector('.modal-confirm');

        const close = () => overlay.remove();

        cancel.addEventListener('click', close);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) close();
        });

        const create = () => {
            const name = input.value.trim();
            if (name) {
                this.createPlaylist(name);
                close();
            }
        };

        confirm.addEventListener('click', create);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') create();
            if (e.key === 'Escape') close();
        });

        // Focus trap
        const focusableEls = overlay.querySelectorAll('input, button');
        const firstFocusable = focusableEls[0];
        const lastFocusable = focusableEls[focusableEls.length - 1];
        overlay.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstFocusable) {
                        e.preventDefault();
                        lastFocusable.focus();
                    }
                } else {
                    if (document.activeElement === lastFocusable) {
                        e.preventDefault();
                        firstFocusable.focus();
                    }
                }
            }
        });

        setTimeout(() => input.focus(), 50);
    }

    createPlaylist(name) {
        const id = 'custom-' + Date.now();
        this.customPlaylists.push({ id, name, songs: [] });
        this.saveState();
        this.renderSidebar();
    }

    deletePlaylist(id) {
        this.customPlaylists = this.customPlaylists.filter(p => p.id !== id);
        this.saveState();
        this.renderSidebar();
        if (this.currentPlaylistId === id) {
            this.loadPlaylist('all');
        }
    }

    addToPlaylist(playlistId, songId) {
        const pl = this.customPlaylists.find(p => p.id === playlistId);
        if (pl && !pl.songs.includes(songId)) {
            pl.songs.push(songId);
            this.saveState();
            this.showToast('Added to ' + pl.name);
            if (this.currentPlaylistId === playlistId) {
                this.loadPlaylist(playlistId);
            }
        }
    }

    // ==========================================================================
    // FAVORITES
    // ==========================================================================

    toggleFavorite(songId) {
        const idx = this.favorites.indexOf(songId);
        if (idx >= 0) {
            this.favorites.splice(idx, 1);
        } else {
            this.favorites.push(songId);
        }
        this.saveState();
        this.updateFavoriteUI(songId);

        const favAction = this.favorites.includes(songId) ? 'Added to favorites' : 'Removed from favorites';
        this.showToast(favAction);

        // Trigger heart pop animation on now-playing button
        const currentSong = this.queue[this.currentIndex];
        if (currentSong && currentSong.id === songId) {
            this.el.npFavoriteBtn.classList.add('heart-pop');
            setTimeout(() => this.el.npFavoriteBtn.classList.remove('heart-pop'), 300);
        }

        // Announce for screen readers
        if (this.el.npAnnounce) {
            const song = this.songs.find(s => s.id === songId);
            if (song) {
                const action = this.favorites.includes(songId) ? 'Added to' : 'Removed from';
                this.el.npAnnounce.textContent = action + ' favorites: ' + song.title;
            }
        }

        if (this.currentPlaylistId === 'favorites') {
            this.loadPlaylist('favorites');
        }
    }

    updateFavoriteUI(songId) {
        const isFav = this.favorites.includes(songId);

        // Update song row
        const row = this.el.songListBody.querySelector('[data-song-id="' + songId + '"]');
        if (row) {
            const btn = row.querySelector('.song-action-btn');
            if (btn) btn.classList.toggle('is-favorite', isFav);
        }

        // Update now-playing favorite
        const currentSong = this.queue[this.currentIndex];
        if (currentSong && currentSong.id === songId) {
            this.el.npFavoriteBtn.classList.toggle('is-favorite', isFav);
        }
    }

    // ==========================================================================
    // UI RENDERERS
    // ==========================================================================

    renderSongList(songs, isSearch) {
        if (songs.length === 0) {
            this.el.songList.classList.add('hidden');
            if (isSearch) {
                this.el.emptySearch.classList.remove('hidden');
                this.el.emptyState.classList.add('hidden');
            } else {
                this.el.emptyState.classList.remove('hidden');
                this.el.emptySearch.classList.add('hidden');
                // Context-specific empty state messages
                var h3 = this.el.emptyState.querySelector('h3');
                var p = this.el.emptyState.querySelector('p');
                if (h3 && p) {
                    if (this.currentPlaylistId === 'favorites') {
                        h3.textContent = 'No favorites yet';
                        p.textContent = 'Click the heart icon on any song to add it here';
                    } else if (this.currentPlaylistId.startsWith('custom-')) {
                        h3.textContent = 'Playlist is empty';
                        p.textContent = 'Right-click a song and choose "Add to playlist"';
                    } else {
                        h3.textContent = 'No songs yet';
                        p.textContent = 'Songs will appear here when available';
                    }
                }
            }
            return;
        }

        this.el.songList.classList.remove('hidden');
        this.el.emptyState.classList.add('hidden');
        this.el.emptySearch.classList.add('hidden');

        const fragment = document.createDocumentFragment();

        songs.forEach((song, i) => {
            const row = document.createElement('div');
            row.className = 'song-row';
            row.setAttribute('data-song-id', song.id);
            row.setAttribute('data-index', String(i));
            row.style.setProperty('--row-index', String(i));
            row.setAttribute('tabindex', '0');
            row.setAttribute('role', 'button');
            row.setAttribute('aria-label', 'Play ' + song.title + ' by ' + song.artist);

            const isFav = this.favorites.includes(song.id);
            const isActive = this.queue[this.currentIndex] && this.queue[this.currentIndex].id === song.id;
            if (isActive) {
                row.classList.add('active');
                row.setAttribute('aria-current', 'true');
            }

            const dur = song.duration > 0 ? this.formatTime(song.duration) : '--:--';

            row.innerHTML =
                '<div class="song-num">' +
                    '<span class="num-text">' + (i + 1) + '</span>' +
                    '<svg class="play-icon" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>' +
                    '<div class="playing-icon"><span class="playing-bar"></span><span class="playing-bar"></span><span class="playing-bar"></span><span class="playing-bar"></span></div>' +
                '</div>' +
                '<div class="song-title-col">' +
                    '<div class="song-thumb">' +
                        (song.cover
                            ? '<img src="' + this.escapeHtml(song.cover) + '" alt="" loading="lazy" onerror="this.outerHTML=\'<svg width=\\\'16\\\' height=\\\'16\\\' viewBox=\\\'0 0 24 24\\\' fill=\\\'rgba(255,255,255,0.3)\\\'><path d=\\\'M9 18V5l12-2v13M6 18a3 3 0 100-6 3 3 0 000 6zM18 16a3 3 0 100-6 3 3 0 000 6z\\\'/></svg>\'">'
                            : '<svg width="16" height="16" viewBox="0 0 24 24" fill="rgba(255,255,255,0.3)"><path d="M9 18V5l12-2v13M6 18a3 3 0 100-6 3 3 0 000 6zM18 16a3 3 0 100-6 3 3 0 000 6z"/></svg>') +
                    '</div>' +
                    '<div class="song-title-info">' +
                        '<div class="song-title-text">' + this.escapeHtml(song.title) + '</div>' +
                        '<div class="song-artist-mobile">' + this.escapeHtml(song.artist) + '</div>' +
                    '</div>' +
                '</div>' +
                '<span class="song-artist">' + this.escapeHtml(song.artist) + '</span>' +
                '<span class="song-album">' + this.escapeHtml(song.album) + '</span>' +
                '<div class="song-duration">' +
                    '<span class="song-duration-text">' + dur + '</span>' +
                    '<div class="song-row-actions">' +
                        '<button class="song-action-btn" data-action="add-to-queue" data-song-id="' + song.id + '" aria-label="Add to queue">' +
                            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>' +
                        '</button>' +
                        '<button class="song-action-btn' + (isFav ? ' is-favorite' : '') + '" data-action="favorite" data-song-id="' + song.id + '" aria-label="Toggle favorite">' +
                            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>' +
                        '</button>' +
                    '</div>' +
                '</div>';

            fragment.appendChild(row);
        });

        this.el.songListBody.innerHTML = '';
        this.el.songListBody.appendChild(fragment);
        this._displayedSongs = songs;
    }

    renderSidebar() {
        const list = this.el.playlistList;
        list.innerHTML = '';

        // Default playlists
        DEFAULT_PLAYLISTS.forEach(pl => {
            const btn = document.createElement('button');
            btn.className = 'playlist-item';
            if (this.currentPlaylistId === pl.id) btn.classList.add('active');
            btn.setAttribute('data-playlist', pl.id);

            let icon = '';
            if (pl.icon === 'music') {
                icon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>';
            } else if (pl.icon === 'heart') {
                icon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';
            }

            btn.innerHTML = icon + '<span>' + this.escapeHtml(pl.name) + '</span>';
            btn.addEventListener('click', () => this.loadPlaylist(pl.id));
            list.appendChild(btn);
        });

        // Custom playlists
        this.customPlaylists.forEach(pl => {
            const btn = document.createElement('button');
            btn.className = 'playlist-item';
            if (this.currentPlaylistId === pl.id) btn.classList.add('active');
            btn.setAttribute('data-playlist', pl.id);

            btn.innerHTML =
                '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>' +
                '<span>' + this.escapeHtml(pl.name) + '</span>';

            btn.addEventListener('click', () => this.loadPlaylist(pl.id));
            list.appendChild(btn);
        });
    }

    updateActivePlaylist() {
        const items = this.el.playlistList.querySelectorAll('.playlist-item');
        items.forEach(item => {
            item.classList.toggle('active', item.getAttribute('data-playlist') === this.currentPlaylistId);
        });
    }

    renderNowPlaying() {
        const song = this.queue[this.currentIndex];
        if (!song) {
            this.el.npTitle.textContent = 'No song playing';
            this.el.npTitle.classList.remove('has-song');
            this.el.npArtist.textContent = '--';
            this.el.npFavoriteBtn.classList.remove('is-favorite');
            this.el.npAlbumArt.classList.remove('spinning', 'paused');
            this.el.npAlbumArt.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="rgba(255,255,255,0.2)" stroke="none"><path d="M9 18V5l12-2v13M6 18a3 3 0 100-6 3 3 0 000 6zM18 16a3 3 0 100-6 3 3 0 000 6z"/></svg>';
            return;
        }

        this.el.npTitle.textContent = song.title;
        this.el.npTitle.classList.add('has-song');
        this.el.npArtist.textContent = song.artist;
        this.el.npFavoriteBtn.classList.toggle('is-favorite', this.favorites.includes(song.id));

        // Announce track change for screen readers
        if (this.el.npAnnounce) {
            this.el.npAnnounce.textContent = 'Now playing: ' + song.title + ' by ' + song.artist;
        }

        if (song.cover) {
            const img = new Image();
            img.src = song.cover;
            img.alt = song.title;
            img.style.opacity = '0';
            img.style.transition = 'opacity 0.3s ease';
            img.onload = () => {
                img.style.opacity = '1';
            };
            img.onerror = () => {
                this.el.npAlbumArt.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="rgba(255,255,255,0.2)" stroke="none"><path d="M9 18V5l12-2v13M6 18a3 3 0 100-6 3 3 0 000 6zM18 16a3 3 0 100-6 3 3 0 000 6z"/></svg>';
            };
            this.el.npAlbumArt.innerHTML = '';
            this.el.npAlbumArt.appendChild(img);
        }

        if (song.duration > 0) {
            this.el.npTimeTotal.textContent = this.formatTime(song.duration);
        }
    }

    updateNowPlaying() {
        var trackInfo = document.querySelector('.np-track-info');
        if (trackInfo) {
            trackInfo.classList.add('transitioning');
            var self = this;
            setTimeout(function() {
                self.renderNowPlaying();
                self.renderQueue();
                requestAnimationFrame(function() {
                    trackInfo.classList.remove('transitioning');
                });
            }, 150);
        } else {
            this.renderNowPlaying();
            this.renderQueue();
        }
    }

    renderQueue() {
        const current = this.queue[this.currentIndex];

        // Now playing
        if (current) {
            const currentArt = current.cover
                ? '<img src="' + this.escapeHtml(current.cover) + '" alt="" onerror="this.outerHTML=\'<svg width=\\\'16\\\' height=\\\'16\\\' viewBox=\\\'0 0 24 24\\\' fill=\\\'rgba(255,255,255,0.3)\\\'><path d=\\\'M9 18V5l12-2v13M6 18a3 3 0 100-6 3 3 0 000 6zM18 16a3 3 0 100-6 3 3 0 000 6z\\\'/></svg>\'">'
                : '<svg width="16" height="16" viewBox="0 0 24 24" fill="rgba(255,255,255,0.3)"><path d="M9 18V5l12-2v13M6 18a3 3 0 100-6 3 3 0 000 6zM18 16a3 3 0 100-6 3 3 0 000 6z"/></svg>';
            this.el.queueNow.innerHTML =
                '<div class="queue-song is-current">' +
                    '<div class="queue-song-art">' + currentArt + '</div>' +
                    '<div class="queue-song-info">' +
                        '<div class="queue-song-title">' + this.escapeHtml(current.title) + '</div>' +
                        '<div class="queue-song-artist">' + this.escapeHtml(current.artist) + '</div>' +
                    '</div>' +
                '</div>';
        } else {
            this.el.queueNow.innerHTML = '<p class="queue-empty">Nothing playing</p>';
        }

        // Next up
        const upcoming = this.queue.slice(this.currentIndex + 1);
        if (upcoming.length === 0) {
            this.el.queueNext.innerHTML = '<p class="queue-empty">Queue is empty</p>';
        } else {
            const fragment = document.createDocumentFragment();
            upcoming.forEach((song, i) => {
                const div = document.createElement('div');
                div.className = 'queue-song';
                const songArt = song.cover
                    ? '<img src="' + this.escapeHtml(song.cover) + '" alt="" onerror="this.outerHTML=\'<svg width=\\\'16\\\' height=\\\'16\\\' viewBox=\\\'0 0 24 24\\\' fill=\\\'rgba(255,255,255,0.3)\\\'><path d=\\\'M9 18V5l12-2v13M6 18a3 3 0 100-6 3 3 0 000 6zM18 16a3 3 0 100-6 3 3 0 000 6z\\\'/></svg>\'">'
                    : '<svg width="16" height="16" viewBox="0 0 24 24" fill="rgba(255,255,255,0.3)"><path d="M9 18V5l12-2v13M6 18a3 3 0 100-6 3 3 0 000 6zM18 16a3 3 0 100-6 3 3 0 000 6z"/></svg>';
                div.innerHTML =
                    '<div class="queue-song-art">' + songArt + '</div>' +
                    '<div class="queue-song-info">' +
                        '<div class="queue-song-title">' + this.escapeHtml(song.title) + '</div>' +
                        '<div class="queue-song-artist">' + this.escapeHtml(song.artist) + '</div>' +
                    '</div>' +
                    '<button class="queue-song-remove" data-queue-index="' + (this.currentIndex + 1 + i) + '" aria-label="Remove from queue">' +
                        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
                    '</button>';

                div.querySelector('.queue-song-remove').addEventListener('click', (e) => {
                    e.stopPropagation();
                    const idx = parseInt(e.currentTarget.getAttribute('data-queue-index'));
                    this.removeFromQueue(idx);
                });

                div.addEventListener('click', () => {
                    this.currentIndex = this.currentIndex + 1 + i;
                    this.audio.setAttribute('data-song-id', '');
                    this.play();
                });

                fragment.appendChild(div);
            });

            this.el.queueNext.innerHTML = '';
            this.el.queueNext.appendChild(fragment);
        }
    }

    updateActiveSong() {
        // Remove old active
        const oldActive = this.el.songListBody.querySelector('.song-row.active');
        if (oldActive) {
            oldActive.classList.remove('active');
            oldActive.removeAttribute('aria-current');
        }

        // Add new active
        const currentSong = this.queue[this.currentIndex];
        if (currentSong) {
            const newActive = this.el.songListBody.querySelector('[data-song-id="' + currentSong.id + '"]');
            if (newActive) {
                newActive.classList.add('active');
                newActive.setAttribute('aria-current', 'true');

                if (this.isPlaying) {
                    clearTimeout(this._scrollTimeout);
                    this._scrollTimeout = setTimeout(() => {
                        newActive.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }, 300);
                }
            }
        }
    }

    updatePlayPauseUI() {
        const playIcon = this.el.npPlayPause.querySelector('.icon-play');
        const pauseIcon = this.el.npPlayPause.querySelector('.icon-pause');

        if (this.isPlaying) {
            playIcon.style.display = 'none';
            pauseIcon.style.display = 'block';
            this.el.npPlayPause.setAttribute('aria-label', 'Pause');
        } else {
            playIcon.style.display = 'block';
            pauseIcon.style.display = 'none';
            this.el.npPlayPause.setAttribute('aria-label', 'Play');
        }
    }

    updateRepeatUI() {
        this.el.npRepeat.classList.toggle('active', this.repeatMode !== 'off');
        this.el.npRepeat.setAttribute('aria-pressed', String(this.repeatMode !== 'off'));
        this.el.npRepeat.setAttribute('aria-label', 'Repeat' + (this.repeatMode === 'off' ? '' : ': ' + this.repeatMode));
        if (this.repeatMode === 'one') {
            this.el.repeatBadge.classList.remove('hidden');
        } else {
            this.el.repeatBadge.classList.add('hidden');
        }
    }

    updateVolumeIcon() {
        const high = this.el.npVolumeBtn.querySelector('.icon-vol-high');
        const low = this.el.npVolumeBtn.querySelector('.icon-vol-low');
        const mute = this.el.npVolumeBtn.querySelector('.icon-vol-mute');

        high.style.display = 'none';
        low.style.display = 'none';
        mute.style.display = 'none';

        if (this.volume === 0) {
            mute.style.display = 'block';
        } else if (this.volume < 0.5) {
            low.style.display = 'block';
        } else {
            high.style.display = 'block';
        }
    }

    startProgressLoop() {
        this.stopProgressLoop();
        var self = this;
        var loop = function() {
            self.updateProgress();
            self._rafId = requestAnimationFrame(loop);
        };
        self._rafId = requestAnimationFrame(loop);
    }

    stopProgressLoop() {
        if (this._rafId) {
            cancelAnimationFrame(this._rafId);
            this._rafId = null;
        }
    }

    updateProgress() {
        if (!this.audio.duration || !isFinite(this.audio.duration)) return;

        var ratio = this.audio.currentTime / this.audio.duration;
        this.el.npProgressFill.style.transform = 'scaleX(' + ratio + ')';
        this.el.npProgressBar.value = ratio * 1000;
        this.el.npTimeCurrent.textContent = this.formatTime(this.audio.currentTime);
        this.el.npProgressBar.setAttribute('aria-valuetext',
            this.formatTime(this.audio.currentTime) + ' of ' + this.formatTime(this.audio.duration));
    }

    // ==========================================================================
    // MEDIA SESSION API
    // ==========================================================================

    updateMediaSession() {
        if (!('mediaSession' in navigator)) return;

        const song = this.queue[this.currentIndex];
        if (!song) return;

        try {
            const artworkList = song.cover
                ? [{ src: song.cover, sizes: '256x256', type: 'image/jpeg' }]
                : [{ src: '/assets/images/icon-512.png', sizes: '512x512', type: 'image/png' }];
            navigator.mediaSession.metadata = new MediaMetadata({
                title: song.title,
                artist: song.artist,
                album: song.album,
                artwork: artworkList
            });

            navigator.mediaSession.setActionHandler('play', () => this.togglePlay());
            navigator.mediaSession.setActionHandler('pause', () => this.pause());
            navigator.mediaSession.setActionHandler('previoustrack', () => this.prev());
            navigator.mediaSession.setActionHandler('nexttrack', () => this.next());
            navigator.mediaSession.setActionHandler('seekto', (details) => {
                if (details.seekTime !== undefined) this.seek(details.seekTime);
            });
        } catch (e) {
            // MediaSession not fully supported
        }
    }

    // ==========================================================================
    // EVENT HANDLERS
    // ==========================================================================


    onMetadataLoaded() {
        if (this.audio.duration && isFinite(this.audio.duration)) {
            this.el.npTimeTotal.textContent = this.formatTime(this.audio.duration);

            // Update stored duration
            const song = this.queue[this.currentIndex];
            if (song && song.duration === 0) {
                song.duration = Math.floor(this.audio.duration);
                const orig = this.songs.find(s => s.id === song.id);
                if (orig) orig.duration = song.duration;
                // Update displayed duration in song row
                const row = this.el.songListBody.querySelector('[data-song-id="' + song.id + '"]');
                if (row) {
                    const durText = row.querySelector('.song-duration-text');
                    if (durText) durText.textContent = this.formatTime(song.duration);
                }
            }
        }
    }

    onSongEnd() {
        if (this.repeatMode === 'one') {
            this.audio.currentTime = 0;
            this.play();
            return;
        }

        if (this.currentIndex < this.queue.length - 1) {
            this.currentIndex++;
            this.audio.setAttribute('data-song-id', '');
            this.play();
        } else if (this.repeatMode === 'all') {
            this.currentIndex = 0;
            this.audio.setAttribute('data-song-id', '');
            this.play();
        } else {
            this.pause();
        }
    }

    onAudioError() {
        const current = this.queue[this.currentIndex];
        if (current) {
            this.showToast('Could not play "' + current.title + '"');
        }

        this._errorCount = (this._errorCount || 0) + 1;
        if (this._errorCount >= 3) {
            this.showToast('Playback stopped - multiple errors');
            this._errorCount = 0;
            this.pause();
            return;
        }

        if (this.queue.length > 1) {
            setTimeout(() => this.next(), 1000);
        }
    }

    onSeek(e) {
        if (!this.audio.duration) return;
        const val = parseFloat(e.target.value);
        const time = (val / 1000) * this.audio.duration;
        this.seek(time);
    }

    onVolumeChange(e) {
        this.setVolume(parseFloat(e.target.value) / 100);
    }

    onSongListClick(e) {
        // Add to queue button
        const queueBtn = e.target.closest('[data-action="add-to-queue"]');
        if (queueBtn) {
            e.stopPropagation();
            const songId = queueBtn.getAttribute('data-song-id');
            const song = this.songs.find(s => s.id === songId);
            if (song) this.addToQueue(song);
            return;
        }

        // Favorite button
        const favBtn = e.target.closest('[data-action="favorite"]');
        if (favBtn) {
            e.stopPropagation();
            this.toggleFavorite(favBtn.getAttribute('data-song-id'));
            return;
        }

        // Song row click
        const row = e.target.closest('.song-row');
        if (row && this._displayedSongs) {
            const index = parseInt(row.getAttribute('data-index'));
            const song = this._displayedSongs[index];
            if (song) {
                this.setQueue(this._displayedSongs, index);
                this.audio.setAttribute('data-song-id', '');
                this.play();
            }
        }
    }

    onSongContextMenu(e) {
        e.preventDefault();
        const row = e.target.closest('.song-row');
        if (!row) return;

        const songId = row.getAttribute('data-song-id');
        const song = this.songs.find(s => s.id === songId);
        if (!song) return;

        this.showContextMenu(e.clientX, e.clientY, song);
    }

    showContextMenu(x, y, song) {
        this.closeContextMenu();

        const menu = document.createElement('div');
        menu.className = 'song-context-menu';

        const isFav = this.favorites.includes(song.id);

        let playlistItems = '';
        if (this.customPlaylists.length > 0) {
            playlistItems = '<div class="context-menu-divider"></div>';
            this.customPlaylists.forEach(pl => {
                playlistItems +=
                    '<button class="context-menu-item" data-action="add-to-playlist" data-playlist-id="' + pl.id + '">' +
                        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>' +
                        'Add to ' + this.escapeHtml(pl.name) +
                    '</button>';
            });
        }

        menu.innerHTML =
            '<button class="context-menu-item" data-action="play-next">' +
                '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 3l14 9-14 9V3z"/></svg>' +
                'Play Next' +
            '</button>' +
            '<button class="context-menu-item" data-action="add-queue">' +
                '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>' +
                'Add to Queue' +
            '</button>' +
            '<div class="context-menu-divider"></div>' +
            '<button class="context-menu-item" data-action="toggle-fav">' +
                '<svg width="14" height="14" viewBox="0 0 24 24" fill="' + (isFav ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="2"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>' +
                (isFav ? 'Remove from Favorites' : 'Add to Favorites') +
            '</button>' +
            playlistItems;

        menu.addEventListener('click', (e) => {
            const item = e.target.closest('.context-menu-item');
            if (!item) return;

            const action = item.getAttribute('data-action');
            if (action === 'play-next') {
                const insertIdx = this.currentIndex + 1;
                this.queue.splice(insertIdx, 0, song);
                this.renderQueue();
                this.showToast('"' + song.title + '" will play next');
            } else if (action === 'add-queue') {
                this.addToQueue(song);
            } else if (action === 'toggle-fav') {
                this.toggleFavorite(song.id);
            } else if (action === 'add-to-playlist') {
                const plId = item.getAttribute('data-playlist-id');
                this.addToPlaylist(plId, song.id);
            }

            this.closeContextMenu();
        });

        // Position
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        if (x + 200 > vw) x = vw - 210;
        if (y + 200 > vh) y = vh - 210;
        menu.style.left = x + 'px';
        menu.style.top = y + 'px';

        document.body.appendChild(menu);
        this.contextMenu = menu;
    }

    closeContextMenu() {
        if (this.contextMenu) {
            var menu = this.contextMenu;
            this.contextMenu = null;
            menu.style.opacity = '0';
            menu.style.transform = 'scale(0.95)';
            menu.style.transition = 'opacity 0.1s ease, transform 0.1s ease';
            setTimeout(function() { menu.remove(); }, 100);
        }
    }

    onKeyDown(e) {
        // Close shortcuts on Escape
        if (e.key === 'Escape') {
            this.hideShortcuts();
            return;
        }

        // Don't handle if user is typing in an input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        // ? to show shortcuts
        if (e.key === '?' || (e.shiftKey && e.code === 'Slash')) {
            e.preventDefault();
            this.showShortcuts();
            return;
        }

        switch (e.code) {
            case 'Space':
                e.preventDefault();
                this.togglePlay();
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.seek(this.audio.currentTime + 5);
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this.seek(this.audio.currentTime - 5);
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.setVolume(this.volume + 0.05);
                this._showVolumeTooltip(this.volume * 100);
                clearTimeout(this._volTooltipHide);
                this._volTooltipHide = setTimeout(() => this._hideVolumeTooltip(), 800);
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.setVolume(this.volume - 0.05);
                this._showVolumeTooltip(this.volume * 100);
                clearTimeout(this._volTooltipHide);
                this._volTooltipHide = setTimeout(() => this._hideVolumeTooltip(), 800);
                break;
            case 'KeyM':
                this.toggleMute();
                break;
            case 'KeyS':
                this.toggleShuffle();
                break;
            case 'KeyR':
                this.toggleRepeat();
                break;
            case 'KeyN':
                this.next();
                break;
            case 'KeyP':
                this.prev();
                break;
            case 'Slash':
                if (!e.shiftKey) {
                    e.preventDefault();
                    this.el.songSearch.focus();
                }
                break;
        }
    }

    // ==========================================================================
    // PLAYBACK HELPERS
    // ==========================================================================

    playAll() {
        const songs = this._displayedSongs || this.songs;
        if (songs.length === 0) return;
        this.isShuffled = false;
        this.el.npShuffle.classList.remove('active');
        this.setQueue(songs, 0);
        this.audio.setAttribute('data-song-id', '');
        this.play();
        this.saveState();
    }

    shufflePlay() {
        const songs = this._displayedSongs || this.songs;
        if (songs.length === 0) return;
        this.isShuffled = true;
        this.el.npShuffle.classList.add('active');
        this.setQueue(songs, 0);
        this.audio.setAttribute('data-song-id', '');
        this.play();
        this.saveState();
    }

    filterSongs(query) {
        const q = query.toLowerCase().trim();
        if (!q) {
            this.loadPlaylist(this.currentPlaylistId);
            return;
        }

        let songs;
        if (this.currentPlaylistId === 'all') {
            songs = this.songs;
        } else if (this.currentPlaylistId === 'favorites') {
            songs = this.songs.filter(s => this.favorites.includes(s.id));
        } else {
            const pl = this.customPlaylists.find(p => p.id === this.currentPlaylistId);
            songs = pl ? pl.songs.map(id => this.songs.find(s => s.id === id)).filter(Boolean) : [];
        }

        const filtered = songs.filter(s =>
            s.title.toLowerCase().includes(q) ||
            s.artist.toLowerCase().includes(q) ||
            s.album.toLowerCase().includes(q)
        );

        this.renderSongList(filtered, true);
    }

    // ==========================================================================
    // SIDEBAR (mobile)
    // ==========================================================================

    openSidebar() {
        this.el.sidebar.classList.add('open');
        this.el.sidebarOverlay.classList.add('active');
        this.el.sidebarMobileToggle.setAttribute('aria-expanded', 'true');
        this.el.sidebarMobileToggle.setAttribute('aria-label', 'Close library');
    }

    closeSidebar() {
        this.el.sidebar.classList.remove('open');
        this.el.sidebarOverlay.classList.remove('active');
        this.el.sidebarMobileToggle.setAttribute('aria-expanded', 'false');
        this.el.sidebarMobileToggle.setAttribute('aria-label', 'Open library');
    }

    // ==========================================================================
    // QUEUE PANEL
    // ==========================================================================

    toggleQueue() {
        const isOpen = this.el.queuePanel.classList.toggle('open');
        this.el.npQueueBtn.classList.toggle('active', isOpen);
        this.el.npQueueBtn.setAttribute('aria-expanded', String(isOpen));
        if (this.el.queueOverlay) this.el.queueOverlay.classList.toggle('active', isOpen);
    }

    closeQueue() {
        this.el.queuePanel.classList.remove('open');
        this.el.npQueueBtn.classList.remove('active');
        this.el.npQueueBtn.setAttribute('aria-expanded', 'false');
        if (this.el.queueOverlay) this.el.queueOverlay.classList.remove('active');
    }

    // ==========================================================================
    // SORTING
    // ==========================================================================

    onSortClick(field) {
        if (this.sortField === field) {
            this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortField = field;
            this.sortDir = 'asc';
        }

        // Update sort UI
        document.querySelectorAll('.col-sortable').forEach(btn => {
            btn.classList.remove('sort-active', 'sort-asc', 'sort-desc');
        });
        const activeBtn = document.querySelector('.col-sortable[data-sort="' + field + '"]');
        if (activeBtn) {
            activeBtn.classList.add('sort-active', 'sort-' + this.sortDir);
        }

        // Re-sort and re-render
        if (this._displayedSongs) {
            const sorted = [...this._displayedSongs].sort((a, b) => {
                let valA, valB;
                if (field === 'duration') {
                    valA = a.duration || 0;
                    valB = b.duration || 0;
                } else {
                    valA = (a[field] || '').toLowerCase();
                    valB = (b[field] || '').toLowerCase();
                }
                if (valA < valB) return this.sortDir === 'asc' ? -1 : 1;
                if (valA > valB) return this.sortDir === 'asc' ? 1 : -1;
                return 0;
            });
            this.renderSongList(sorted);
        }
    }

    // ==========================================================================
    // KEYBOARD SHORTCUTS OVERLAY
    // ==========================================================================

    showShortcuts() {
        this._preFocusShortcuts = document.activeElement;
        this.el.shortcutsOverlay.classList.add('open');
        var closeBtn = this.el.shortcutsClose;
        if (closeBtn) setTimeout(function() { closeBtn.focus(); }, 50);
    }

    hideShortcuts() {
        this.el.shortcutsOverlay.classList.remove('open');
        if (this._preFocusShortcuts) {
            this._preFocusShortcuts.focus();
            this._preFocusShortcuts = null;
        }
    }

    // ==========================================================================
    // UTILITIES
    // ==========================================================================

    formatTime(seconds) {
        if (!seconds || !isFinite(seconds)) return '0:00';
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return m + ':' + (s < 10 ? '0' : '') + s;
    }

    formatDurationLong(totalSecs) {
        if (!totalSecs || totalSecs <= 0) return '';
        const h = Math.floor(totalSecs / 3600);
        const m = Math.floor((totalSecs % 3600) / 60);
        if (h > 0) {
            return h + 'h ' + m + 'm';
        }
        return m + 'm';
    }

    escapeHtml(str) {
        if (!this._escapeEl) this._escapeEl = document.createElement('div');
        this._escapeEl.textContent = str;
        return this._escapeEl.innerHTML;
    }

    showToast(message, duration = 2000) {
        let container = document.querySelector('.music-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'music-toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = 'music-toast';
        toast.textContent = message;
        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('toast-out');
            toast.addEventListener('animationend', () => toast.remove());
        }, duration);
    }

    _showVolumeTooltip(val) {
        if (!this._volTooltip) {
            this._volTooltip = document.createElement('div');
            this._volTooltip.style.cssText = 'position:absolute;bottom:calc(100% + 8px);left:50%;transform:translateX(-50%);background:rgba(25,25,40,0.95);border:1px solid rgba(212,175,55,0.15);border-radius:4px;padding:2px 8px;font-size:0.7rem;color:#e8e8e8;white-space:nowrap;pointer-events:none;z-index:101;transition:opacity 0.15s ease;';
            this.el.npVolumeBtn.parentElement.style.position = 'relative';
            this.el.npVolumeBtn.parentElement.appendChild(this._volTooltip);
        }
        this._volTooltip.textContent = Math.round(val) + '%';
        this._volTooltip.style.opacity = '1';
    }

    _hideVolumeTooltip() {
        if (this._volTooltip) {
            this._volTooltip.style.opacity = '0';
        }
    }

    _preloadNext() {
        const nextIndex = this.currentIndex + 1;
        if (nextIndex < this.queue.length) {
            const next = this.queue[nextIndex];
            if (next && (!this._preloadedId || this._preloadedId !== next.id)) {
                const link = document.createElement('link');
                link.rel = 'prefetch';
                link.href = next.file;
                link.as = 'fetch';
                const old = document.querySelector('link[data-prefetch-track]');
                if (old) old.remove();
                link.setAttribute('data-prefetch-track', '');
                document.head.appendChild(link);
                this._preloadedId = next.id;
            }
        }
    }

    resolveDurations() {
        // Batch-load metadata to avoid too many simultaneous requests
        const pending = this.songs.filter(s => !s.duration || s.duration <= 0);
        const batchSize = 4;
        let index = 0;

        const loadNext = () => {
            if (index >= pending.length) return;
            const song = pending[index++];
            const tempAudio = new Audio();
            tempAudio.preload = 'metadata';
            tempAudio.addEventListener('loadedmetadata', () => {
                if (tempAudio.duration && isFinite(tempAudio.duration)) {
                    song.duration = Math.floor(tempAudio.duration);
                    const row = this.el.songListBody.querySelector('[data-song-id="' + song.id + '"]');
                    if (row) {
                        const durText = row.querySelector('.song-duration-text');
                        if (durText) durText.textContent = this.formatTime(song.duration);
                    }
                }
                tempAudio.src = '';
                tempAudio.load();
                loadNext();
            });
            tempAudio.addEventListener('error', () => {
                tempAudio.src = '';
                tempAudio.load();
                loadNext();
            });
            try {
                tempAudio.src = song.file;
            } catch (e) {
                loadNext();
            }
        };

        // Start batchSize concurrent loaders
        for (let i = 0; i < Math.min(batchSize, pending.length); i++) {
            loadNext();
        }
    }
}

// ==========================================================================
// INIT
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    window.musicPlayer = new MusicPlayer();

    // Dynamic MusicPlaylist JSON-LD from SONGS array
    const schemaEl = document.getElementById('music-schema');
    if (schemaEl) {
        const formatISO = (sec) => {
            const m = Math.floor(sec / 60);
            const s = Math.floor(sec % 60);
            return 'PT' + m + 'M' + s + 'S';
        };
        schemaEl.textContent = JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'MusicPlaylist',
            'name': 'Scarmonit Originals',
            'description': 'Original music tracks by scarmonit',
            'url': 'https://scarmonit.com/music/',
            'numTracks': SONGS.length,
            'creator': {
                '@type': 'MusicGroup',
                'name': 'scarmonit',
                'url': 'https://scarmonit.com'
            },
            'track': SONGS.slice(0, 12).map(s => ({
                '@type': 'MusicRecording',
                'name': s.title,
                'byArtist': { '@type': 'MusicGroup', 'name': s.artist },
                'inAlbum': { '@type': 'MusicAlbum', 'name': s.album },
                'duration': formatISO(s.duration),
                'url': 'https://scarmonit.com/music/'
            }))
        });
    }
});
