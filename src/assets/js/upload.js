// Upload Page JavaScript - Enhanced with better UX
// Password Protection System
(function() {
    const CORRECT_PASSWORD = 'scarmonit123';
    const SESSION_KEY = 'scarmonit_upload_auth';

    const overlay = document.getElementById('password-overlay');
    const modal = document.getElementById('password-modal');
    const form = document.getElementById('password-form');
    const input = document.getElementById('password-input');
    const error = document.getElementById('password-error');
    const mainContent = document.getElementById('upload-content');

    // Check if already authenticated this session
    function isAuthenticated() {
        return sessionStorage.getItem(SESSION_KEY) === 'true';
    }

    // Show main content and hide overlay
    function grantAccess() {
        if (overlay) overlay.classList.add('hidden');
        if (mainContent) mainContent.classList.add('visible');
        sessionStorage.setItem(SESSION_KEY, 'true');
    }

    // Show error with shake animation
    function showError() {
        if (error) error.classList.add('visible');
        if (modal) modal.classList.add('shake');
        if (input) {
            input.value = '';
            input.focus();
        }

        setTimeout(function() {
            if (modal) modal.classList.remove('shake');
        }, 500);

        setTimeout(function() {
            if (error) error.classList.remove('visible');
        }, 3000);
    }

    // Handle form submission
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();

            if (input && input.value === CORRECT_PASSWORD) {
                grantAccess();
            } else {
                showError();
            }
        });
    }

    // Check authentication on page load
    if (isAuthenticated()) {
        grantAccess();
    } else {
        // Focus input when page loads
        if (input) input.focus();
    }
})();

// File type icons mapping - supports ALL file types
const fileIcons = {
    // Images
    'image/jpeg': '🖼️', 'image/jpg': '🖼️', 'image/png': '🖼️', 'image/gif': '🖼️',
    'image/webp': '🖼️', 'image/svg+xml': '🖼️', 'image/bmp': '🖼️', 'image/tiff': '🖼️',
    'image/ico': '🖼️', 'image/x-icon': '🖼️', 'image/heic': '🖼️', 'image/heif': '🖼️',
    // Videos
    'video/mp4': '🎬', 'video/webm': '🎬', 'video/avi': '🎬', 'video/quicktime': '🎬',
    'video/x-msvideo': '🎬', 'video/x-matroska': '🎬', 'video/x-flv': '🎬', 'video/mpeg': '🎬',
    // Audio
    'audio/mpeg': '🎵', 'audio/wav': '🎵', 'audio/ogg': '🎵', 'audio/mp3': '🎵',
    'audio/flac': '🎵', 'audio/aac': '🎵', 'audio/x-m4a': '🎵', 'audio/webm': '🎵',
    // Documents
    'application/pdf': '📄', 'application/msword': '📝', 'text/plain': '📄', 'text/html': '🌐',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📊',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': '📽️',
    'application/vnd.ms-excel': '📊', 'application/vnd.ms-powerpoint': '📽️',
    'text/csv': '📊', 'text/markdown': '📝', 'text/rtf': '📝',
    // Archives
    'application/zip': '📦', 'application/x-zip-compressed': '📦',
    'application/x-rar-compressed': '📦', 'application/x-7z-compressed': '📦',
    'application/gzip': '📦', 'application/x-tar': '📦', 'application/x-bzip2': '📦',
    // Code & Development
    'application/javascript': '⚡', 'text/javascript': '⚡', 'application/json': '📋',
    'text/css': '🎨', 'text/xml': '📋', 'application/xml': '📋',
    'application/x-python': '🐍', 'text/x-python': '🐍',
    'application/x-sh': '💻', 'application/x-powershell': '💻',
    'text/x-java-source': '☕', 'text/x-c': '💻', 'text/x-c++': '💻',
    // Executables & Installers
    'application/x-msdownload': '⚙️', 'application/x-executable': '⚙️',
    'application/vnd.microsoft.portable-executable': '⚙️',
    'application/x-msi': '⚙️', 'application/x-apple-diskimage': '⚙️',
    // Fonts
    'font/ttf': '🔤', 'font/otf': '🔤', 'font/woff': '🔤', 'font/woff2': '🔤',
    // 3D & Design
    'model/gltf-binary': '🎮', 'model/obj': '🎮', 'application/x-blender': '🎮',
    // Database
    'application/x-sqlite3': '🗄️', 'application/sql': '🗄️',
    // Default for any other type
    'default': '📁'
};

function getFileIcon(type) {
    return fileIcons[type] || fileIcons['default'];
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

// Format relative time (e.g., "2 hours ago")
function formatRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);

    if (diffSecs < 60) return 'Just now';
    if (diffMins < 60) return diffMins + ' min' + (diffMins > 1 ? 's' : '') + ' ago';
    if (diffHours < 24) return diffHours + ' hour' + (diffHours > 1 ? 's' : '') + ' ago';
    if (diffDays < 7) return diffDays + ' day' + (diffDays > 1 ? 's' : '') + ' ago';
    if (diffWeeks < 4) return diffWeeks + ' week' + (diffWeeks > 1 ? 's' : '') + ' ago';
    if (diffMonths < 12) return diffMonths + ' month' + (diffMonths > 1 ? 's' : '') + ' ago';
    return formatDate(dateString);
}

// Get file type category for badge coloring
function getFileTypeCategory(type, filename) {
    if (!type) type = '';
    const ext = filename.split('.').pop().toLowerCase();

    // Images
    if (type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'heic'].includes(ext)) {
        return 'image';
    }
    // Videos
    if (type.startsWith('video/') || ['mp4', 'webm', 'avi', 'mov', 'mkv', 'flv', 'wmv'].includes(ext)) {
        return 'video';
    }
    // Audio
    if (type.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma'].includes(ext)) {
        return 'audio';
    }
    // Documents
    if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf', 'odt', 'csv'].includes(ext)) {
        return 'document';
    }
    // Code
    if (['js', 'ts', 'py', 'java', 'cpp', 'c', 'h', 'css', 'html', 'json', 'xml', 'sh', 'rb', 'go', 'rs', 'php'].includes(ext)) {
        return 'code';
    }
    // Archives
    if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz', 'iso'].includes(ext)) {
        return 'archive';
    }
    return 'archive'; // Default
}

// Format upload speed
function formatSpeed(bytesPerSecond) {
    if (bytesPerSecond < 1024) return bytesPerSecond.toFixed(0) + ' B/s';
    if (bytesPerSecond < 1024 * 1024) return (bytesPerSecond / 1024).toFixed(1) + ' KB/s';
    return (bytesPerSecond / (1024 * 1024)).toFixed(1) + ' MB/s';
}

// Format time remaining
function formatTimeRemaining(seconds) {
    if (seconds < 60) return Math.ceil(seconds) + 's';
    if (seconds < 3600) return Math.ceil(seconds / 60) + 'm';
    return Math.floor(seconds / 3600) + 'h ' + Math.ceil((seconds % 3600) / 60) + 'm';
}

// Create confetti effect
function createConfetti() {
    const colors = ['#d4a84b', '#4ade80', '#3b82f6', '#a855f7', '#ec4899', '#22d3ee'];
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDuration = (2 + Math.random() * 2) + 's';
        confetti.style.animationDelay = Math.random() * 0.5 + 's';
        confetti.style.width = (5 + Math.random() * 10) + 'px';
        confetti.style.height = (5 + Math.random() * 10) + 'px';
        confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
        document.body.appendChild(confetti);
        setTimeout(() => confetti.remove(), 4000);
    }
}

// Copy to clipboard with feedback
async function copyToClipboard(text, button) {
    try {
        await navigator.clipboard.writeText(text);
        button.classList.add('copied');
        const originalText = button.innerHTML;
        button.innerHTML = '✓ Copied!';
        showToast('Link Copied', 'URL copied to clipboard', 'success');
        setTimeout(() => {
            button.classList.remove('copied');
            button.innerHTML = originalText;
        }, 2000);
    } catch (err) {
        showToast('Copy Failed', 'Could not copy to clipboard', 'error');
    }
}

function getFileExtension(filename) {
    return filename.split('.').pop().toUpperCase();
}

// Enhanced Toast Notification System
function showToast(title, message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };

    const iconSpan = document.createElement('span');
    iconSpan.className = 'toast-icon';
    iconSpan.textContent = icons[type] || icons.info;

    const content = document.createElement('div');
    content.className = 'toast-content';

    const titleEl = document.createElement('div');
    titleEl.className = 'toast-title';
    titleEl.textContent = title;

    const messageEl = document.createElement('div');
    messageEl.className = 'toast-message';
    messageEl.textContent = message;

    content.appendChild(titleEl);
    content.appendChild(messageEl);

    toast.appendChild(iconSpan);
    toast.appendChild(content);

    container.appendChild(toast);

    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);

    // Auto remove after 4 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 4000);
}

// Create SVG element helper
function createSvg(paths, width, height) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', width || '16');
    svg.setAttribute('height', height || '16');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    paths.forEach(function(d) {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', d);
        svg.appendChild(path);
    });
    return svg;
}

// Check if file is an image for preview
function isImageFile(type) {
    return type && type.startsWith('image/');
}

// Create file card using safe DOM methods
function createFileCard(file, isRecent = false, cardIndex = 0) {
    const card = document.createElement('div');
    card.className = 'file-card' + (isRecent ? ' recent' : '');
    card.setAttribute('data-key', file.key);
    card.setAttribute('data-index', cardIndex);

    // Checkbox for bulk selection
    const checkbox = document.createElement('label');
    checkbox.className = 'file-checkbox';
    checkbox.innerHTML = '<input type="checkbox"><span class="checkmark"></span>';
    checkbox.style.display = bulkModeEnabled ? 'flex' : 'none';
    const checkboxInput = checkbox.querySelector('input');
    checkboxInput.addEventListener('change', function(e) {
        e.stopPropagation();
        toggleFileSelection(file.key, cardIndex, e.shiftKey);
    });
    // Prevent label click from double-firing
    checkbox.addEventListener('click', function(e) {
        e.stopPropagation();
    });
    card.appendChild(checkbox);

    // Get file type category
    const fileCategory = getFileTypeCategory(file.type, file.name);

    // Check if file is previewable
    const canPreview = isPreviewable(file.type, file.name);

    // Preview area for image/video/audio files
    if (isImageFile(file.type) || file.type?.startsWith('video/')) {
        const preview = document.createElement('div');
        preview.className = 'file-preview' + (canPreview ? ' clickable' : '');
        if (canPreview) {
            preview.title = 'Click to preview';
            preview.onclick = function(e) {
                e.stopPropagation();
                openPreviewModal(file, cardIndex);
            };
        }

        if (isImageFile(file.type)) {
            const img = document.createElement('img');
            img.src = '/api/download?key=' + encodeURIComponent(file.key);
            img.alt = file.name;
            img.loading = 'lazy';
            img.onerror = function() {
                this.parentElement.innerHTML = '<span class="file-preview-icon">' + getFileIcon(file.type) + '</span>';
            };
            preview.appendChild(img);
        } else {
            // Video thumbnail placeholder
            preview.innerHTML = '<span class="file-preview-icon">🎬</span><span class="preview-play-btn">▶</span>';
        }

        const overlay = document.createElement('div');
        overlay.className = 'file-preview-overlay';
        preview.appendChild(overlay);
        card.appendChild(preview);
    } else if (canPreview) {
        // Audio or PDF - show preview icon
        const preview = document.createElement('div');
        preview.className = 'file-preview clickable';
        preview.title = 'Click to preview';
        preview.innerHTML = '<span class="file-preview-icon">' + getFileIcon(file.type) + '</span>';
        preview.onclick = function(e) {
            e.stopPropagation();
            openPreviewModal(file, cardIndex);
        };
        card.appendChild(preview);
    }

    // Header
    const header = document.createElement('div');
    header.className = 'file-header';

    const icon = document.createElement('span');
    icon.className = 'file-icon';
    icon.textContent = getFileIcon(file.type);

    const info = document.createElement('div');
    info.className = 'file-info';

    const name = document.createElement('div');
    name.className = 'file-name';
    name.textContent = file.name;
    name.title = file.name; // Show full filename on hover

    const meta = document.createElement('div');
    meta.className = 'file-meta';

    const sizeSpan = document.createElement('span');
    sizeSpan.textContent = '📦 ' + formatFileSize(file.size);

    const dateSpan = document.createElement('span');
    const relativeTime = formatRelativeTime(file.uploadedAt);
    dateSpan.innerHTML = '🕐 <span class="file-time-relative">' + relativeTime + '</span>';
    dateSpan.title = formatDate(file.uploadedAt);

    meta.appendChild(sizeSpan);
    meta.appendChild(dateSpan);

    // IP address - shown only if authenticated
    if (isIPVisible() && file.uploaderIP) {
        const ipSpan = document.createElement('span');
        ipSpan.className = 'file-ip';
        ipSpan.textContent = '🌐 ' + file.uploaderIP;
        ipSpan.title = 'Uploader IP address';
        meta.appendChild(ipSpan);
    }

    info.appendChild(name);
    info.appendChild(meta);
    header.appendChild(icon);
    header.appendChild(info);

    // Type badge with category-specific class
    const badge = document.createElement('span');
    badge.className = 'file-type-badge ' + fileCategory;
    badge.textContent = getFileExtension(file.name);

    // Actions
    const actions = document.createElement('div');
    actions.className = 'file-actions';

    // Copy Link Button (icon only with native tooltip and ARIA)
    const copyBtn = document.createElement('button');
    copyBtn.className = 'file-btn copy';
    copyBtn.title = 'Copy Link';
    copyBtn.setAttribute('aria-label', 'Copy link for ' + file.name);
    copyBtn.onclick = function() {
        const url = window.location.origin + '/api/download?key=' + encodeURIComponent(file.key);
        copyToClipboard(url, copyBtn);
    };
    const copySvg = createSvg(['M8 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1', 'M8 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2', 'M8 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2']);
    copyBtn.appendChild(copySvg);

    // Download Button (icon only with native tooltip and ARIA)
    const downloadBtn = document.createElement('a');
    downloadBtn.className = 'file-btn download';
    downloadBtn.title = 'Download';
    downloadBtn.setAttribute('aria-label', 'Download ' + file.name);
    downloadBtn.href = '/api/download?key=' + encodeURIComponent(file.key);
    downloadBtn.setAttribute('download', file.name);
    const dlSvg = createSvg(['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'M7 10l5 5 5-5', 'M12 15V3']);
    downloadBtn.appendChild(dlSvg);

    // Rename Button (icon only with native tooltip and ARIA)
    const renameBtn = document.createElement('button');
    renameBtn.className = 'file-btn rename';
    renameBtn.title = 'Rename';
    renameBtn.setAttribute('aria-label', 'Rename ' + file.name);
    renameBtn.onclick = function() { openRenameModal(file.key, file.name); };
    const renameSvg = createSvg(['M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7', 'M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z']);
    renameBtn.appendChild(renameSvg);

    // Delete Button (icon only with native tooltip and ARIA)
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'file-btn delete';
    deleteBtn.title = 'Delete';
    deleteBtn.setAttribute('aria-label', 'Delete ' + file.name);
    deleteBtn.onclick = function() { confirmDelete(file.key, file.name); };
    const delSvg = createSvg(['M3 6h18', 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2']);
    deleteBtn.appendChild(delSvg);

    actions.appendChild(copyBtn);
    actions.appendChild(downloadBtn);
    actions.appendChild(renameBtn);
    actions.appendChild(deleteBtn);

    card.appendChild(header);
    card.appendChild(badge);
    card.appendChild(actions);

    return card;
}

// Delete Confirmation Modal
let pendingDeleteKey = null;

function confirmDelete(key, name) {
    pendingDeleteKey = key;
    const overlay = document.getElementById('confirm-overlay');
    const filename = document.getElementById('confirm-filename');

    if (filename) filename.textContent = name;
    if (overlay) overlay.classList.add('active');
}

function closeConfirmModal() {
    const overlay = document.getElementById('confirm-overlay');
    if (overlay) overlay.classList.remove('active');
    pendingDeleteKey = null;
}

// Rename Modal
let pendingRenameKey = null;
let pendingRenameOriginalName = null;

function openRenameModal(key, name) {
    pendingRenameKey = key;
    pendingRenameOriginalName = name;
    const overlay = document.getElementById('rename-overlay');
    const input = document.getElementById('rename-input');
    const currentName = document.getElementById('rename-current-name');

    if (currentName) currentName.textContent = name;
    if (input) {
        // Set value to filename without extension, or full name if no extension
        const lastDot = name.lastIndexOf('.');
        if (lastDot > 0) {
            input.value = name.substring(0, lastDot);
            input.setAttribute('data-extension', name.substring(lastDot));
        } else {
            input.value = name;
            input.setAttribute('data-extension', '');
        }
        input.select();
    }
    if (overlay) overlay.classList.add('active');
    if (input) input.focus();
}

function closeRenameModal() {
    const overlay = document.getElementById('rename-overlay');
    if (overlay) overlay.classList.remove('active');
    pendingRenameKey = null;
    pendingRenameOriginalName = null;
}

async function executeRename() {
    const input = document.getElementById('rename-input');
    if (!input || !pendingRenameKey) return;

    const extension = input.getAttribute('data-extension') || '';
    const newName = input.value.trim() + extension;

    if (!newName || newName === pendingRenameOriginalName) {
        closeRenameModal();
        return;
    }

    // Validate filename length (max 255 characters)
    if (newName.length > 255) {
        showToast('Filename Too Long', 'Filename must be 255 characters or less', 'error');
        return;
    }

    const renameBtn = document.getElementById('rename-confirm');
    if (renameBtn) {
        renameBtn.disabled = true;
        renameBtn.textContent = 'Renaming...';
    }

    try {
        const response = await fetch('/api/rename', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                key: pendingRenameKey,
                newName: newName
            })
        });

        const result = await response.json();

        if (result.success) {
            showToast('File Renamed', pendingRenameOriginalName + ' → ' + result.name, 'success');
            closeRenameModal();
            loadFiles();
        } else {
            showToast('Rename Failed', result.error, 'error');
        }
    } catch (error) {
        showToast('Rename Error', error.message, 'error');
    } finally {
        if (renameBtn) {
            renameBtn.disabled = false;
            renameBtn.textContent = 'Rename';
        }
    }
}

// Set up confirm modal buttons
document.addEventListener('DOMContentLoaded', function() {
    const cancelBtn = document.getElementById('confirm-cancel');
    const deleteBtn = document.getElementById('confirm-delete');
    const overlay = document.getElementById('confirm-overlay');

    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeConfirmModal);
    }

    if (deleteBtn) {
        deleteBtn.addEventListener('click', async function() {
            if (pendingDeleteKey) {
                await deleteFile(pendingDeleteKey);
                closeConfirmModal();
            }
        });
    }

    // Close on overlay click
    if (overlay) {
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                closeConfirmModal();
            }
        });
    }

    // Set up rename modal buttons
    const renameCancelBtn = document.getElementById('rename-cancel');
    const renameConfirmBtn = document.getElementById('rename-confirm');
    const renameOverlay = document.getElementById('rename-overlay');
    const renameInput = document.getElementById('rename-input');

    if (renameCancelBtn) {
        renameCancelBtn.addEventListener('click', closeRenameModal);
    }

    if (renameConfirmBtn) {
        renameConfirmBtn.addEventListener('click', executeRename);
    }

    // Close on overlay click
    if (renameOverlay) {
        renameOverlay.addEventListener('click', function(e) {
            if (e.target === renameOverlay) {
                closeRenameModal();
            }
        });
    }

    // Submit on Enter key
    if (renameInput) {
        renameInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                executeRename();
            } else if (e.key === 'Escape') {
                closeRenameModal();
            }
        });
    }
});

// Upload Zone Drag & Drop
const uploadZone = document.getElementById('upload-zone');
const fileInput = document.getElementById('file-input');
const selectBtn = document.getElementById('select-btn');

if (uploadZone && fileInput && selectBtn) {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(function(eventName) {
        uploadZone.addEventListener(eventName, function(e) {
            e.preventDefault();
            e.stopPropagation();
        }, false);
    });

    ['dragenter', 'dragover'].forEach(function(eventName) {
        uploadZone.addEventListener(eventName, function() {
            uploadZone.classList.add('dragover');
        }, false);
    });

    ['dragleave', 'drop'].forEach(function(eventName) {
        uploadZone.addEventListener(eventName, function() {
            uploadZone.classList.remove('dragover');
        }, false);
    });

    uploadZone.addEventListener('drop', function(e) {
        var dt = e.dataTransfer;
        var files = dt.files;
        handleFiles({ target: { files: files } });
    }, false);

    uploadZone.addEventListener('click', function(e) {
        var urlSection = document.querySelector('.url-upload-section');
        var isUrlSection = urlSection && urlSection.contains(e.target);
        if (e.target !== selectBtn && !selectBtn.contains(e.target) && !isUrlSection) {
            fileInput.click();
        }
    });

    selectBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        fileInput.click();
    });

    fileInput.addEventListener('change', handleFiles);
}

// Size threshold for multipart upload (95MB to be safe under 100MB limit)
const MULTIPART_THRESHOLD = 95 * 1024 * 1024;
// Chunk size for multipart upload (10MB per part)
const CHUNK_SIZE = 10 * 1024 * 1024;
// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const PART_TIMEOUT_MS = 120000; // 2 minutes per part

// Global abort controller for canceling uploads
let currentUploadController = null;
let currentMultipartInfo = null; // Track current multipart upload for abort

// Create queue item element
function createQueueItem(file) {
    const item = document.createElement('div');
    item.className = 'queue-item';
    item.id = 'queue-' + file.name.replace(/[^a-zA-Z0-9]/g, '_');

    const icon = document.createElement('span');
    icon.className = 'queue-item-icon';
    icon.textContent = getFileIcon(file.type);

    const info = document.createElement('div');
    info.className = 'queue-item-info';

    const name = document.createElement('div');
    name.className = 'queue-item-name';
    name.textContent = file.name;

    const size = document.createElement('div');
    size.className = 'queue-item-size';
    size.textContent = formatFileSize(file.size);

    info.appendChild(name);
    info.appendChild(size);

    const progress = document.createElement('div');
    progress.className = 'queue-item-progress';

    const progressFill = document.createElement('div');
    progressFill.className = 'queue-item-progress-fill';
    progressFill.style.width = '0%';

    progress.appendChild(progressFill);

    const status = document.createElement('span');
    status.className = 'queue-item-status';
    status.textContent = '⏳';

    item.appendChild(icon);
    item.appendChild(info);
    item.appendChild(progress);
    item.appendChild(status);

    return item;
}

// Cancel upload function
async function cancelUpload() {
    if (currentUploadController) {
        currentUploadController.abort();
        showToast('Upload Cancelled', 'Upload has been cancelled', 'warning');
    }

    // If there's an active multipart upload, abort it on the server
    if (currentMultipartInfo) {
        try {
            await fetch('/api/upload-abort', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    uploadId: currentMultipartInfo.uploadId,
                    key: currentMultipartInfo.key
                })
            });
            console.log('Multipart upload aborted on server');
        } catch (err) {
            console.error('Failed to abort multipart upload:', err);
        }
        currentMultipartInfo = null;
    }
}

// Fetch with timeout and abort signal
async function fetchWithTimeout(url, options, timeoutMs = PART_TIMEOUT_MS) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    // Merge abort signals if parent signal exists
    if (options.signal) {
        options.signal.addEventListener('abort', () => controller.abort());
    }

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            // Check if it was user cancellation (parent signal) vs our timeout
            if (options.signal && options.signal.aborted) {
                throw new Error('Upload cancelled by user');
            }
            throw new Error('Request timed out');
        }
        throw error;
    }
}

// Retry wrapper with exponential backoff
async function retryOperation(operation, maxRetries = MAX_RETRIES, delayMs = RETRY_DELAY_MS) {
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;
            // Don't retry if it was explicitly cancelled by the user
            if (error.message === 'Upload cancelled by user' || error.message === 'Upload cancelled') {
                throw error;
            }
            if (attempt < maxRetries) {
                const delay = delayMs * Math.pow(2, attempt - 1); // Exponential backoff
                console.log(`Retry attempt ${attempt}/${maxRetries} after ${delay}ms for: ${error.message}`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    throw lastError;
}

// Update queue item progress
function updateQueueItem(file, percent, statusIcon) {
    const itemId = 'queue-' + file.name.replace(/[^a-zA-Z0-9]/g, '_');
    const item = document.getElementById(itemId);
    if (!item) return;

    const progressFill = item.querySelector('.queue-item-progress-fill');
    const status = item.querySelector('.queue-item-status');

    if (progressFill) progressFill.style.width = percent + '%';
    if (status && statusIcon) status.textContent = statusIcon;
}

async function handleFiles(e) {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Create new abort controller for this upload session
    currentUploadController = new AbortController();
    const signal = currentUploadController.signal;

    const progressContainer = document.getElementById('upload-progress');
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    const uploadQueue = document.getElementById('upload-queue');

    if (progressContainer) progressContainer.classList.add('active');

    // Clear and populate queue with cancel button
    if (uploadQueue) {
        uploadQueue.innerHTML = '';

        // Add cancel button at the top
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'cancel-upload-btn';
        cancelBtn.id = 'cancel-upload-btn';
        cancelBtn.innerHTML = '✕ Cancel Upload';
        cancelBtn.onclick = cancelUpload;
        uploadQueue.appendChild(cancelBtn);

        files.forEach(file => {
            uploadQueue.appendChild(createQueueItem(file));
        });
    }

    let successCount = 0;
    let failCount = 0;
    let cancelledCount = 0;
    const totalFiles = files.length;

    for (let i = 0; i < files.length; i++) {
        // Check if upload was cancelled
        if (signal.aborted) {
            cancelledCount = totalFiles - i;
            break;
        }

        const file = files[i];

        try {
            console.log('Uploading file:', file.name, 'Size:', formatFileSize(file.size), 'Type:', file.type);

            if (file.size >= MULTIPART_THRESHOLD) {
                // Use multipart upload for large files
                if (progressText) progressText.textContent = 'Uploading large file: ' + file.name + '...';
                const success = await uploadLargeFile(file, function(percent, status) {
                    const overallPercent = ((i / totalFiles) * 100 + (percent / totalFiles));
                    if (progressFill) progressFill.style.width = overallPercent + '%';
                    if (progressText) progressText.textContent = status;
                    updateQueueItem(file, percent, '⏳');
                }, signal);
                if (success) {
                    successCount++;
                    updateQueueItem(file, 100, '✅');
                    showToast('Upload Complete', file.name, 'success');
                } else if (signal.aborted) {
                    updateQueueItem(file, 0, '🚫');
                } else {
                    failCount++;
                    updateQueueItem(file, 0, '❌');
                }
            } else {
                // Use direct upload for smaller files
                if (progressText) progressText.textContent = 'Uploading ' + file.name + ' (' + (i + 1) + '/' + totalFiles + ')...';
                if (progressFill) progressFill.style.width = ((i / totalFiles) * 100) + '%';

                const response = await retryOperation(async () => {
                    return await fetchWithTimeout('/api/upload', {
                        method: 'POST',
                        headers: {
                            'X-File-Name': encodeURIComponent(file.name),
                            'X-File-Type': file.type || 'application/octet-stream',
                            'X-File-Size': file.size.toString()
                        },
                        body: file,
                        signal: signal
                    });
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Upload failed:', response.status, errorText);
                    showToast('Upload Failed', file.name + ': ' + response.status, 'error');
                    failCount++;
                    updateQueueItem(file, 0, '❌');
                    continue;
                }

                const result = await response.json();
                console.log('Upload result:', result);

                if (result.success) {
                    if (progressFill) progressFill.style.width = (((i + 1) / totalFiles) * 100) + '%';
                    successCount++;
                    updateQueueItem(file, 100, '✅');
                    showToast('Upload Complete', file.name, 'success');
                } else {
                    console.error('Upload returned error:', result.error);
                    showToast('Upload Failed', file.name + ': ' + result.error, 'error');
                    failCount++;
                    updateQueueItem(file, 0, '❌');
                }
            }
        } catch (error) {
            if (error.message.includes('cancelled') || error.name === 'AbortError' || signal.aborted) {
                console.log('Upload cancelled by user');
                updateQueueItem(file, 0, '🚫');
                break;
            }
            console.error('Upload error:', error);
            showToast('Upload Error', file.name + ': ' + error.message, 'error');
            failCount++;
            updateQueueItem(file, 0, '❌');
        }
    }

    // Hide cancel button
    const cancelBtn = document.getElementById('cancel-upload-btn');
    if (cancelBtn) cancelBtn.style.display = 'none';

    if (progressFill) progressFill.style.width = '100%';

    if (progressText) {
        if (signal.aborted || cancelledCount > 0) {
            progressText.textContent = '🚫 Upload cancelled' + (successCount > 0 ? ' (' + successCount + ' completed)' : '');
        } else if (successCount > 0 && failCount === 0) {
            progressText.textContent = '🎉 All ' + successCount + ' file(s) uploaded successfully!';
            // Trigger confetti for successful uploads
            createConfetti();
            // Add success animation to upload zone
            if (uploadZone) {
                uploadZone.classList.add('success');
                setTimeout(() => uploadZone.classList.remove('success'), 600);
            }
        } else if (successCount > 0) {
            progressText.textContent = '✅ ' + successCount + ' uploaded, ❌ ' + failCount + ' failed';
        } else {
            progressText.textContent = '❌ Upload failed - check console for details';
        }
    }

    // Reset controller
    currentUploadController = null;
    currentMultipartInfo = null;

    setTimeout(function() {
        if (progressContainer) progressContainer.classList.remove('active');
        if (progressFill) progressFill.style.width = '0%';
        if (fileInput) fileInput.value = '';
        if (uploadQueue) uploadQueue.innerHTML = '';
        loadFiles();
    }, 2500);
}

// Multipart upload for large files (>95MB) with retry and cancel support
async function uploadLargeFile(file, onProgress, signal) {
    let uploadId = null;
    let key = null;

    try {
        // Check if cancelled before starting
        if (signal && signal.aborted) {
            throw new Error('Upload cancelled');
        }

        // Step 1: Start multipart upload
        onProgress(0, 'Starting upload for ' + file.name + '...');

        const startResponse = await retryOperation(async () => {
            return await fetchWithTimeout('/api/upload-start', {
                method: 'POST',
                headers: {
                    'X-File-Name': encodeURIComponent(file.name),
                    'X-File-Type': file.type || 'application/octet-stream'
                },
                signal: signal
            }, 30000); // 30 second timeout for start
        });

        if (!startResponse.ok) {
            throw new Error('Failed to start multipart upload: ' + startResponse.status);
        }

        const startResult = await startResponse.json();
        if (!startResult.success) {
            throw new Error(startResult.error || 'Failed to start upload');
        }

        uploadId = startResult.uploadId;
        key = startResult.key;

        // Track current multipart info for potential cancellation
        currentMultipartInfo = { uploadId, key };

        console.log('Multipart upload started:', uploadId, key);

        // Step 2: Upload parts with retry
        const totalParts = Math.ceil(file.size / CHUNK_SIZE);
        const uploadedParts = [];

        for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
            // Check if cancelled
            if (signal && signal.aborted) {
                throw new Error('Upload cancelled');
            }

            const start = (partNumber - 1) * CHUNK_SIZE;
            const end = Math.min(start + CHUNK_SIZE, file.size);
            const chunk = file.slice(start, end);

            const percentComplete = Math.round(((partNumber - 1) / totalParts) * 100);
            onProgress(percentComplete, 'Uploading ' + file.name + ' - Part ' + partNumber + '/' + totalParts + ' (' + percentComplete + '%)');

            // Retry part upload with exponential backoff
            const partResult = await retryOperation(async () => {
                const partResponse = await fetchWithTimeout('/api/upload-part', {
                    method: 'POST',
                    headers: {
                        'X-Upload-Id': uploadId,
                        'X-Key': key,
                        'X-Part-Number': partNumber.toString()
                    },
                    body: chunk,
                    signal: signal
                }, PART_TIMEOUT_MS);

                if (!partResponse.ok) {
                    throw new Error('Failed to upload part ' + partNumber + ': ' + partResponse.status);
                }

                const result = await partResponse.json();
                if (!result.success) {
                    throw new Error(result.error || 'Part upload failed');
                }

                return result;
            });

            uploadedParts.push({
                partNumber: partResult.partNumber,
                etag: partResult.etag
            });

            console.log('Part ' + partNumber + ' uploaded, etag:', partResult.etag);
        }

        // Check if cancelled before completing
        if (signal && signal.aborted) {
            throw new Error('Upload cancelled');
        }

        // Step 3: Complete multipart upload
        onProgress(100, 'Finalizing ' + file.name + '...');

        const completeResponse = await retryOperation(async () => {
            return await fetchWithTimeout('/api/upload-complete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    uploadId: uploadId,
                    key: key,
                    parts: uploadedParts,
                    fileName: file.name,
                    fileType: file.type || 'application/octet-stream',
                    fileSize: file.size
                }),
                signal: signal
            }, 60000); // 60 second timeout for complete
        });

        if (!completeResponse.ok) {
            throw new Error('Failed to complete multipart upload: ' + completeResponse.status);
        }

        const completeResult = await completeResponse.json();
        if (!completeResult.success) {
            throw new Error(completeResult.error || 'Complete failed');
        }

        console.log('Multipart upload complete:', completeResult);
        onProgress(100, 'Completed: ' + file.name);
        currentMultipartInfo = null;
        return true;

    } catch (error) {
        console.error('Large file upload error:', error);

        // If cancelled or failed, try to abort the multipart upload to clean up
        if (uploadId && key) {
            try {
                await fetch('/api/upload-abort', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ uploadId, key })
                });
                console.log('Cleaned up incomplete multipart upload');
            } catch (abortErr) {
                console.error('Failed to cleanup multipart upload:', abortErr);
            }
        }

        currentMultipartInfo = null;

        // Don't show error toast if cancelled by user
        if (!error.message.includes('cancelled')) {
            showToast('Upload Error', file.name + ': ' + error.message, 'error');
        }

        return false;
    }
}

// Global state for files
let allFiles = [];
let currentSort = 'date-desc';
let currentFilter = 'all';
let currentView = 'grid';
let searchQuery = '';

// IP visibility state
let showIPAddresses = false;
const IP_VISIBILITY_KEY = 'scarmonit_ip_visible';

// Check if IP visibility is already authenticated
function isIPVisible() {
    return sessionStorage.getItem(IP_VISIBILITY_KEY) === 'true';
}

// Show IP password modal
function showIPPasswordModal() {
    let overlay = document.getElementById('ip-password-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'ip-password-overlay';
        overlay.className = 'confirm-overlay';
        overlay.innerHTML = `
            <div class="confirm-modal">
                <div class="confirm-icon">🔐</div>
                <h3 class="confirm-title">Show IP Addresses</h3>
                <p class="confirm-text">Enter password to reveal uploader IPs</p>
                <div class="rename-input-wrapper">
                    <input type="password" class="rename-input" id="ip-password-input" placeholder="Enter password" autocomplete="off">
                </div>
                <p class="password-error" id="ip-password-error" style="display: none; color: #ef4444; margin-top: 8px;">Incorrect password</p>
                <div class="confirm-actions">
                    <button class="confirm-btn cancel" id="ip-password-cancel">Cancel</button>
                    <button class="confirm-btn rename" id="ip-password-confirm">Unlock</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        // Event listeners
        overlay.querySelector('#ip-password-cancel').addEventListener('click', closeIPPasswordModal);
        overlay.querySelector('#ip-password-confirm').addEventListener('click', verifyIPPassword);
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) closeIPPasswordModal();
        });
        overlay.querySelector('#ip-password-input').addEventListener('keydown', function(e) {
            if (e.key === 'Enter') verifyIPPassword();
            if (e.key === 'Escape') closeIPPasswordModal();
        });
    }

    overlay.classList.add('active');
    overlay.querySelector('#ip-password-input').value = '';
    overlay.querySelector('#ip-password-input').focus();
    overlay.querySelector('#ip-password-error').style.display = 'none';
}

function closeIPPasswordModal() {
    const overlay = document.getElementById('ip-password-overlay');
    if (overlay) overlay.classList.remove('active');
}

function verifyIPPassword() {
    const input = document.getElementById('ip-password-input');
    const error = document.getElementById('ip-password-error');

    if (input.value === 'scarmonit123') {
        sessionStorage.setItem(IP_VISIBILITY_KEY, 'true');
        showIPAddresses = true;
        closeIPPasswordModal();
        showToast('IP Addresses Visible', 'Uploader IPs are now shown', 'success');
        // Re-render files to show IPs
        renderFiles(allFiles, document.getElementById('files-container'));
        // Update toggle button state
        updateIPToggleButton();
    } else {
        error.style.display = 'block';
        input.value = '';
        input.focus();
        // Shake animation
        const modal = document.querySelector('#ip-password-overlay .confirm-modal');
        if (modal) {
            modal.classList.add('shake');
            setTimeout(() => modal.classList.remove('shake'), 500);
        }
    }
}

function toggleIPVisibility() {
    if (isIPVisible()) {
        // Already authenticated - toggle off
        sessionStorage.removeItem(IP_VISIBILITY_KEY);
        showIPAddresses = false;
        showToast('IP Addresses Hidden', 'Uploader IPs are now hidden', 'info');
        renderFiles(allFiles, document.getElementById('files-container'));
        updateIPToggleButton();
    } else {
        // Need password to show
        showIPPasswordModal();
    }
}

function updateIPToggleButton() {
    const btn = document.getElementById('ip-toggle-btn');
    if (btn) {
        const isVisible = isIPVisible();
        btn.classList.toggle('active', isVisible);
        btn.innerHTML = isVisible ? '👁️ HIDE IPS' : '👁️‍🗨️ SHOW IPS';
        btn.title = isVisible ? 'Hide uploader IP addresses' : 'Show uploader IP addresses (requires password)';
    }
}

// ============================================
// STORAGE DASHBOARD WITH ANIMATED COUNTERS
// ============================================

function animateValue(element, start, end, duration, formatter = (v) => v) {
    if (start === end) {
        element.textContent = formatter(end);
        return;
    }

    const range = end - start;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function (ease-out cubic)
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(start + (range * eased));

        element.textContent = formatter(current);
        element.classList.add('counting');

        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            element.textContent = formatter(end);
            element.classList.remove('counting');
        }
    }

    requestAnimationFrame(update);
}

function updateStorageDashboard(files) {
    const dashboard = document.getElementById('storage-dashboard');
    if (!dashboard) return;

    // Calculate stats
    const totalFiles = files.length;
    const totalSize = files.reduce((sum, f) => sum + (f.size || 0), 0);
    const imageCount = files.filter(f => getFileTypeCategory(f.type, f.name) === 'image').length;
    const videoCount = files.filter(f => getFileTypeCategory(f.type, f.name) === 'video').length;

    // Get most recent upload
    let recentText = '--';
    if (files.length > 0) {
        const sorted = [...files].sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
        recentText = formatRelativeTime(sorted[0].uploadedAt);
    }

    // Animate counters
    const totalFilesEl = document.getElementById('stat-total-files');
    const totalSizeEl = document.getElementById('stat-total-size');
    const imagesEl = document.getElementById('stat-images');
    const videosEl = document.getElementById('stat-videos');
    const recentEl = document.getElementById('stat-recent');

    if (totalFilesEl) {
        const prevTotal = parseInt(totalFilesEl.textContent) || 0;
        animateValue(totalFilesEl, prevTotal, totalFiles, 500);
    }

    if (totalSizeEl) {
        totalSizeEl.textContent = formatFileSize(totalSize);
    }

    if (imagesEl) {
        const prevImages = parseInt(imagesEl.textContent) || 0;
        animateValue(imagesEl, prevImages, imageCount, 400);
    }

    if (videosEl) {
        const prevVideos = parseInt(videosEl.textContent) || 0;
        animateValue(videosEl, prevVideos, videoCount, 400);
    }

    if (recentEl) {
        recentEl.textContent = recentText;
    }

    // Remove loading states
    dashboard.querySelectorAll('.dashboard-card').forEach(card => {
        card.classList.remove('loading');
    });
}

// ============================================
// URL UPLOAD FEATURE
// ============================================

async function uploadFromUrl(url) {
    const urlInput = document.getElementById('url-input');
    const urlBtn = document.getElementById('url-upload-btn');

    if (!url || !url.trim()) {
        showToast('Invalid URL', 'Please enter a valid URL', 'error');
        return;
    }

    // Validate URL format
    try {
        new URL(url);
    } catch (e) {
        showToast('Invalid URL', 'Please enter a valid URL format', 'error');
        return;
    }

    // Update button state
    const originalBtnContent = urlBtn.innerHTML;
    urlBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle></svg> Fetching...';
    urlBtn.disabled = true;
    urlBtn.classList.add('loading');

    try {
        showToast('Fetching File', 'Downloading from URL...', 'info');

        const response = await fetch('/api/upload-url', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url: url.trim() })
        });

        const result = await response.json();

        if (result.success) {
            showToast('Upload Complete', result.name || 'File uploaded successfully', 'success');
            createConfetti();
            urlInput.value = '';
            loadFiles();
        } else {
            showToast('Upload Failed', result.error || 'Failed to upload from URL', 'error');
        }
    } catch (error) {
        console.error('URL upload error:', error);
        showToast('Upload Error', error.message || 'Failed to fetch file from URL', 'error');
    } finally {
        urlBtn.innerHTML = originalBtnContent;
        urlBtn.disabled = false;
        urlBtn.classList.remove('loading');
    }
}

// Set up URL upload handlers
document.addEventListener('DOMContentLoaded', function() {
    const urlInput = document.getElementById('url-input');
    const urlBtn = document.getElementById('url-upload-btn');

    if (urlBtn) {
        urlBtn.addEventListener('click', function() {
            const url = urlInput?.value;
            uploadFromUrl(url);
        });
    }

    if (urlInput) {
        urlInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                uploadFromUrl(urlInput.value);
            }
        });
    }
});

// Sort functions
const sortFunctions = {
    'date-desc': (a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt),
    'date-asc': (a, b) => new Date(a.uploadedAt) - new Date(b.uploadedAt),
    'name-asc': (a, b) => a.name.localeCompare(b.name),
    'name-desc': (a, b) => b.name.localeCompare(a.name),
    'size-desc': (a, b) => b.size - a.size,
    'size-asc': (a, b) => a.size - b.size
};

// Filter files based on current filter and search
function filterFiles(files) {
    let filtered = files;

    // Apply type filter
    if (currentFilter !== 'all') {
        filtered = filtered.filter(file => {
            const category = getFileTypeCategory(file.type, file.name);
            return category === currentFilter;
        });
    }

    // Apply search (case-insensitive)
    if (searchQuery) {
        const query = searchQuery.trim().toLowerCase();
        filtered = filtered.filter(file =>
            file.name.toLowerCase().includes(query)
        );
    }

    // Apply sort
    filtered.sort(sortFunctions[currentSort]);

    return filtered;
}

// Render files with current filters
function renderFiles(files, container) {
    // Remove existing grid but keep header
    const existingGrid = container.querySelector('.files-grid');
    const existingEmpty = container.querySelector('.empty-state');
    if (existingGrid) existingGrid.remove();
    if (existingEmpty) existingEmpty.remove();

    const filteredFiles = filterFiles(files);

    if (filteredFiles.length > 0) {
        const grid = document.createElement('div');
        grid.className = 'files-grid' + (currentView === 'list' ? ' list-view' : '');

        filteredFiles.forEach(function(file, index) {
            const isRecent = new Date() - new Date(file.uploadedAt) < 5000;
            const isNew = new Date() - new Date(file.uploadedAt) < 86400000; // 24 hours
            const card = createFileCard(file, isRecent, index);
            if (isNew && !isRecent) card.classList.add('new');
            // Restore selection state if bulk mode is active
            if (selectedFiles.has(file.key)) {
                card.classList.add('selected');
                const cb = card.querySelector('.file-checkbox input');
                if (cb) cb.checked = true;
            }
            grid.appendChild(card);
        });

        container.appendChild(grid);
    } else {
        const empty = document.createElement('div');
        empty.className = 'empty-state';

        const emptyIcon = document.createElement('div');
        emptyIcon.className = 'empty-icon';
        emptyIcon.textContent = searchQuery ? '🔍' : '📭';

        const emptyTitle = document.createElement('h3');
        emptyTitle.textContent = searchQuery ? 'No Files Found' : 'No Files Yet';

        const emptyText = document.createElement('p');
        emptyText.textContent = searchQuery
            ? 'Try a different search term'
            : 'Drag and drop files above or click to upload!';

        empty.appendChild(emptyIcon);
        empty.appendChild(emptyTitle);
        empty.appendChild(emptyText);
        container.appendChild(empty);
    }
}

// Create files header with search, filter, sort, and view controls
function createFilesHeader(files) {
    const header = document.createElement('div');
    header.className = 'files-header';

    // Search box
    const searchBox = document.createElement('div');
    searchBox.className = 'search-files';

    const searchIcon = document.createElement('span');
    searchIcon.className = 'search-icon';
    searchIcon.textContent = '🔍';

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.className = 'search-input';
    searchInput.placeholder = 'Search files...';
    searchInput.value = searchQuery;
    searchInput.addEventListener('input', function(e) {
        searchQuery = e.target.value;
        renderFiles(allFiles, document.getElementById('files-container').querySelector('.files-grid')?.parentElement || document.getElementById('files-container'));
    });

    searchBox.appendChild(searchIcon);
    searchBox.appendChild(searchInput);

    // Filter buttons
    const filterDiv = document.createElement('div');
    filterDiv.className = 'filter-buttons';

    const filters = [
        { id: 'all', label: 'All', icon: '📁' },
        { id: 'image', label: 'Images', icon: '🖼️' },
        { id: 'video', label: 'Videos', icon: '🎬' },
        { id: 'document', label: 'Docs', icon: '📄' },
        { id: 'archive', label: 'Archives', icon: '📦' }
    ];

    filters.forEach(filter => {
        const btn = document.createElement('button');
        btn.className = 'filter-btn' + (currentFilter === filter.id ? ' active' : '');
        btn.textContent = filter.icon + ' ' + filter.label;
        btn.onclick = function() {
            currentFilter = filter.id;
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderFiles(allFiles, document.getElementById('files-container'));
        };
        filterDiv.appendChild(btn);
    });

    // Sort dropdown
    const sortBtn = document.createElement('button');
    sortBtn.className = 'sort-btn';
    sortBtn.innerHTML = '↕️ Sort';
    sortBtn.onclick = function() {
        // Cycle through sort options
        const sortOptions = ['date-desc', 'date-asc', 'name-asc', 'name-desc', 'size-desc', 'size-asc'];
        const currentIndex = sortOptions.indexOf(currentSort);
        currentSort = sortOptions[(currentIndex + 1) % sortOptions.length];
        const labels = {
            'date-desc': '📅 Newest',
            'date-asc': '📅 Oldest',
            'name-asc': '🔤 A-Z',
            'name-desc': '🔤 Z-A',
            'size-desc': '📊 Largest',
            'size-asc': '📊 Smallest'
        };
        sortBtn.innerHTML = labels[currentSort];
        renderFiles(allFiles, document.getElementById('files-container'));
    };

    // View toggle
    const viewToggle = document.createElement('div');
    viewToggle.className = 'view-toggle';

    const gridBtn = document.createElement('button');
    gridBtn.className = 'view-btn' + (currentView === 'grid' ? ' active' : '');
    gridBtn.innerHTML = '⊞';
    gridBtn.title = 'Grid View';
    gridBtn.onclick = function() {
        currentView = 'grid';
        gridBtn.classList.add('active');
        listBtn.classList.remove('active');
        const grid = document.querySelector('.files-grid');
        if (grid) grid.classList.remove('list-view');
    };

    const listBtn = document.createElement('button');
    listBtn.className = 'view-btn' + (currentView === 'list' ? ' active' : '');
    listBtn.innerHTML = '☰';
    listBtn.title = 'List View';
    listBtn.onclick = function() {
        currentView = 'list';
        listBtn.classList.add('active');
        gridBtn.classList.remove('active');
        const grid = document.querySelector('.files-grid');
        if (grid) grid.classList.add('list-view');
    };

    viewToggle.appendChild(gridBtn);
    viewToggle.appendChild(listBtn);

    // Bulk select toggle
    const bulkBtn = document.createElement('button');
    bulkBtn.className = 'bulk-toggle-btn' + (bulkModeEnabled ? ' active' : '');
    bulkBtn.innerHTML = '☑️ SELECT';
    bulkBtn.title = 'Enable bulk selection mode (Ctrl+A to select all)';
    bulkBtn.onclick = function() {
        bulkModeEnabled = !bulkModeEnabled;
        bulkBtn.classList.toggle('active', bulkModeEnabled);
        toggleBulkMode(bulkModeEnabled);
    };

    // IP visibility toggle
    const ipToggleBtn = document.createElement('button');
    ipToggleBtn.id = 'ip-toggle-btn';
    ipToggleBtn.className = 'bulk-toggle-btn' + (isIPVisible() ? ' active' : '');
    ipToggleBtn.innerHTML = isIPVisible() ? '👁️ HIDE IPS' : '👁️‍🗨️ SHOW IPS';
    ipToggleBtn.title = isIPVisible() ? 'Hide uploader IP addresses' : 'Show uploader IP addresses (requires password)';
    ipToggleBtn.onclick = toggleIPVisibility;

    // Create organized toolbar structure
    // Row 1: Search + Filters
    const topRow = document.createElement('div');
    topRow.className = 'toolbar-row toolbar-primary';
    topRow.appendChild(searchBox);
    topRow.appendChild(filterDiv);

    // Row 2: Actions (Sort, View, Select, Show IPs)
    const bottomRow = document.createElement('div');
    bottomRow.className = 'toolbar-row toolbar-actions';

    const leftActions = document.createElement('div');
    leftActions.className = 'toolbar-group';
    leftActions.appendChild(sortBtn);
    leftActions.appendChild(viewToggle);

    const rightActions = document.createElement('div');
    rightActions.className = 'toolbar-group';
    rightActions.appendChild(bulkBtn);
    rightActions.appendChild(ipToggleBtn);

    bottomRow.appendChild(leftActions);
    bottomRow.appendChild(rightActions);

    header.appendChild(topRow);
    header.appendChild(bottomRow);

    return header;
}

// Load and display files using safe DOM methods
async function loadFiles() {
    const container = document.getElementById('files-container');
    if (!container) return;

    // Show skeleton loading
    container.innerHTML = '<div class="files-grid">' +
        '<div class="skeleton-card skeleton"></div>'.repeat(6) +
        '</div>';

    try {
        const response = await fetch('/api/list');
        const result = await response.json();

        // Store all files globally
        allFiles = result.success ? result.files : [];

        // Update storage dashboard
        updateStorageDashboard(allFiles);

        // Clear container
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }

        if (result.success && allFiles.length > 0) {
            // Calculate total size
            const totalSize = allFiles.reduce((sum, f) => sum + (f.size || 0), 0);

            // Update section title with file count
            const sectionTitle = document.querySelector('.section-title');
            if (sectionTitle) {
                sectionTitle.innerHTML = '';
                const titleText = document.createTextNode('Uploaded Files');
                sectionTitle.appendChild(titleText);

                const countBadge = document.createElement('span');
                countBadge.className = 'file-count-badge';
                countBadge.innerHTML = '<strong>' + allFiles.length + '</strong> files · ' + formatFileSize(totalSize);
                sectionTitle.appendChild(countBadge);
            }

            // Add files header with search, filter, sort controls
            container.appendChild(createFilesHeader(allFiles));

            // Render files with current filters
            renderFiles(allFiles, container);
        } else {
            // Update section title
            const sectionTitle = document.querySelector('.section-title');
            if (sectionTitle) {
                sectionTitle.innerHTML = '';
                sectionTitle.appendChild(document.createTextNode('Uploaded Files'));
            }

            const empty = document.createElement('div');
            empty.className = 'empty-state';

            const emptyIcon = document.createElement('div');
            emptyIcon.className = 'empty-icon';
            emptyIcon.textContent = '📭';

            const emptyTitle = document.createElement('h3');
            emptyTitle.textContent = 'No Files Yet';

            const emptyText = document.createElement('p');
            emptyText.textContent = 'Drag and drop files above or click to upload!';

            const emptyHint = document.createElement('p');
            emptyHint.style.cssText = 'color: var(--upload-primary); font-size: 0.85rem; margin-top: 15px;';
            emptyHint.textContent = '💡 Supports ALL file types with NO size limits';

            empty.appendChild(emptyIcon);
            empty.appendChild(emptyTitle);
            empty.appendChild(emptyText);
            empty.appendChild(emptyHint);
            container.appendChild(empty);
        }
    } catch (error) {
        // Clear container
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }

        const empty = document.createElement('div');
        empty.className = 'empty-state';

        const emptyIcon = document.createElement('div');
        emptyIcon.className = 'empty-icon';
        emptyIcon.textContent = '⚠️';

        const emptyTitle = document.createElement('h3');
        emptyTitle.textContent = 'Error Loading Files';

        const emptyText = document.createElement('p');
        emptyText.textContent = error.message;

        empty.appendChild(emptyIcon);
        empty.appendChild(emptyTitle);
        empty.appendChild(emptyText);
        container.appendChild(empty);
    }
}

async function deleteFile(key) {
    try {
        const response = await fetch('/api/delete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ key: key })
        });

        const result = await response.json();

        if (result.success) {
            showToast('File Deleted', 'File removed successfully', 'success');
            loadFiles();
        } else {
            showToast('Delete Failed', result.error, 'error');
        }
    } catch (error) {
        showToast('Delete Error', error.message, 'error');
    }
}

// ============================================
// NEW FEATURES: Clipboard Paste, Preview, Bulk Actions, ZIP Download
// ============================================

// Global state for bulk selection
let selectedFiles = new Set();
let bulkModeEnabled = false;
let lastSelectedIndex = -1;

// Clipboard Paste Upload with Confirmation
let pendingPasteFiles = null;

document.addEventListener('paste', function(e) {
    // Only handle paste if authenticated
    if (!sessionStorage.getItem('scarmonit_upload_auth')) return;

    // Don't intercept paste in input fields
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    const items = e.clipboardData?.items;
    if (!items) return;

    const files = [];
    for (let i = 0; i < items.length; i++) {
        if (items[i].kind === 'file') {
            const file = items[i].getAsFile();
            if (file) {
                // Generate a meaningful name for pasted images
                const ext = file.type.split('/')[1] || 'png';
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
                const namedFile = new File([file], `pasted-${timestamp}.${ext}`, { type: file.type });
                files.push(namedFile);
            }
        }
    }

    if (files.length > 0) {
        e.preventDefault();
        // Show confirmation dialog instead of auto-uploading
        pendingPasteFiles = files;
        showPasteConfirmation(files);
    }
});

// Paste confirmation dialog
function showPasteConfirmation(files) {
    // Create modal if it doesn't exist
    let overlay = document.getElementById('paste-confirm-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'paste-confirm-overlay';
        overlay.className = 'confirm-overlay';
        overlay.innerHTML = `
            <div class="confirm-modal">
                <div class="confirm-icon">📋</div>
                <h3 class="confirm-title">Upload from Clipboard?</h3>
                <p class="confirm-text" id="paste-confirm-text"></p>
                <div class="confirm-actions">
                    <button class="confirm-btn cancel" id="paste-cancel">Cancel</button>
                    <button class="confirm-btn rename" id="paste-confirm">Upload</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        // Set up event listeners
        overlay.querySelector('#paste-cancel').addEventListener('click', closePasteConfirmation);
        overlay.querySelector('#paste-confirm').addEventListener('click', confirmPasteUpload);
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) closePasteConfirmation();
        });
    }

    // Update message
    const text = overlay.querySelector('#paste-confirm-text');
    const totalSize = files.reduce((sum, f) => sum + f.size, 0);
    text.innerHTML = `${files.length} file(s) detected (${formatFileSize(totalSize)})<br><small>from clipboard</small>`;

    overlay.classList.add('active');
}

function closePasteConfirmation() {
    const overlay = document.getElementById('paste-confirm-overlay');
    if (overlay) overlay.classList.remove('active');
    pendingPasteFiles = null;
}

function confirmPasteUpload() {
    if (pendingPasteFiles && pendingPasteFiles.length > 0) {
        showToast('Uploading', `${pendingPasteFiles.length} file(s) from clipboard`, 'info');
        handleFiles({ target: { files: pendingPasteFiles } });
    }
    closePasteConfirmation();
}

// File Preview Modal System
function createPreviewModal() {
    // Check if modal already exists
    if (document.getElementById('preview-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'preview-modal';
    modal.className = 'preview-overlay';
    modal.innerHTML = `
        <div class="preview-container">
            <button class="preview-close" title="Close (Esc)">&times;</button>
            <button class="preview-nav prev" title="Previous (←)">‹</button>
            <button class="preview-nav next" title="Next (→)">›</button>
            <div class="preview-content" id="preview-content"></div>
            <div class="preview-info">
                <span class="preview-filename" id="preview-filename"></span>
                <span class="preview-filesize" id="preview-filesize"></span>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Close on overlay click
    modal.addEventListener('click', function(e) {
        if (e.target === modal) closePreviewModal();
    });

    // Close button
    modal.querySelector('.preview-close').addEventListener('click', closePreviewModal);

    // Navigation buttons
    modal.querySelector('.preview-nav.prev').addEventListener('click', () => navigatePreview(-1));
    modal.querySelector('.preview-nav.next').addEventListener('click', () => navigatePreview(1));
}

let currentPreviewIndex = -1;
let previewableFiles = [];

function openPreviewModal(file, index) {
    createPreviewModal();

    // Build list of previewable files
    previewableFiles = allFiles.filter(f => isPreviewable(f.type, f.name));
    currentPreviewIndex = previewableFiles.findIndex(f => f.key === file.key);

    showPreview(file);

    const modal = document.getElementById('preview-modal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Show/hide nav buttons based on previewable files
    const prevBtn = modal.querySelector('.preview-nav.prev');
    const nextBtn = modal.querySelector('.preview-nav.next');
    prevBtn.style.display = previewableFiles.length > 1 ? 'flex' : 'none';
    nextBtn.style.display = previewableFiles.length > 1 ? 'flex' : 'none';
}

function showPreview(file) {
    const content = document.getElementById('preview-content');
    const filename = document.getElementById('preview-filename');
    const filesize = document.getElementById('preview-filesize');

    filename.textContent = file.name;
    filesize.textContent = formatFileSize(file.size);

    const url = '/api/download?key=' + encodeURIComponent(file.key);
    const type = file.type || '';
    const ext = file.name.split('.').pop().toLowerCase();

    content.innerHTML = '';

    if (type.startsWith('image/')) {
        const img = document.createElement('img');
        img.src = url;
        img.alt = file.name;
        img.className = 'preview-image';
        content.appendChild(img);
    } else if (type.startsWith('video/')) {
        const video = document.createElement('video');
        video.src = url;
        video.controls = true;
        video.autoplay = true;
        video.className = 'preview-video';
        content.appendChild(video);
    } else if (type.startsWith('audio/')) {
        const audio = document.createElement('audio');
        audio.src = url;
        audio.controls = true;
        audio.autoplay = true;
        audio.className = 'preview-audio';
        content.appendChild(audio);

        // Add audio visualization
        const visualizer = document.createElement('div');
        visualizer.className = 'audio-visualizer';
        visualizer.innerHTML = '🎵';
        content.insertBefore(visualizer, audio);
    } else if (type === 'application/pdf' || ext === 'pdf') {
        const iframe = document.createElement('iframe');
        iframe.src = url;
        iframe.className = 'preview-pdf';
        content.appendChild(iframe);
    } else {
        content.innerHTML = '<div class="preview-unsupported">Preview not available<br><a href="' + url + '" download>Download File</a></div>';
    }
}

function navigatePreview(direction) {
    if (previewableFiles.length <= 1) return;

    currentPreviewIndex = (currentPreviewIndex + direction + previewableFiles.length) % previewableFiles.length;
    showPreview(previewableFiles[currentPreviewIndex]);
}

function closePreviewModal() {
    const modal = document.getElementById('preview-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';

        // Stop any playing media
        const video = modal.querySelector('video');
        const audio = modal.querySelector('audio');
        if (video) video.pause();
        if (audio) audio.pause();
    }
}

function isPreviewable(type, filename) {
    if (!type) type = '';
    const ext = filename.split('.').pop().toLowerCase();
    return type.startsWith('image/') ||
           type.startsWith('video/') ||
           type.startsWith('audio/') ||
           type === 'application/pdf' ||
           ext === 'pdf';
}

// Bulk Selection System
function toggleBulkMode(enabled) {
    bulkModeEnabled = enabled;
    selectedFiles.clear();
    lastSelectedIndex = -1;

    // Update UI
    const filesGrid = document.querySelector('.files-grid');
    if (filesGrid) {
        filesGrid.classList.toggle('bulk-mode', enabled);
    }

    // Update checkboxes visibility
    document.querySelectorAll('.file-checkbox').forEach(cb => {
        cb.style.display = enabled ? 'flex' : 'none';
        cb.querySelector('input').checked = false;
    });

    // Update bulk actions bar
    updateBulkActionsBar();
}

function toggleFileSelection(key, index, shiftKey = false) {
    const card = document.querySelector(`.file-card[data-key="${CSS.escape(key)}"]`);
    const checkboxInput = card?.querySelector('.file-checkbox input');
    const isNowChecked = checkboxInput?.checked || false;

    if (shiftKey && lastSelectedIndex >= 0 && bulkModeEnabled) {
        // Shift+click: select range
        const start = Math.min(lastSelectedIndex, index);
        const end = Math.max(lastSelectedIndex, index);
        const cards = document.querySelectorAll('.file-card');

        for (let i = start; i <= end; i++) {
            const rangeCard = cards[i];
            if (rangeCard) {
                const fileKey = rangeCard.getAttribute('data-key');
                selectedFiles.add(fileKey);
                rangeCard.classList.add('selected');
                const cb = rangeCard.querySelector('.file-checkbox input');
                if (cb) cb.checked = true;
            }
        }
    } else {
        // Sync with checkbox state
        if (isNowChecked) {
            selectedFiles.add(key);
        } else {
            selectedFiles.delete(key);
        }
        lastSelectedIndex = index;
    }

    // Update card selected state
    if (card) {
        card.classList.toggle('selected', selectedFiles.has(key));
    }

    updateBulkActionsBar();
}

function selectAllFiles() {
    const cards = document.querySelectorAll('.file-card');
    cards.forEach(card => {
        const key = card.getAttribute('data-key');
        selectedFiles.add(key);
        card.classList.add('selected');
        const checkbox = card.querySelector('.file-checkbox input');
        if (checkbox) checkbox.checked = true;
    });
    updateBulkActionsBar();
}

function deselectAllFiles() {
    selectedFiles.clear();
    document.querySelectorAll('.file-card').forEach(card => {
        card.classList.remove('selected');
        const checkbox = card.querySelector('.file-checkbox input');
        if (checkbox) checkbox.checked = false;
    });
    updateBulkActionsBar();
}

function updateBulkActionsBar() {
    let bar = document.getElementById('bulk-actions-bar');

    if (selectedFiles.size > 0) {
        if (!bar) {
            bar = document.createElement('div');
            bar.id = 'bulk-actions-bar';
            bar.className = 'bulk-actions-bar';
            document.body.appendChild(bar);
        }

        const selectedSize = Array.from(selectedFiles).reduce((sum, key) => {
            const file = allFiles.find(f => f.key === key);
            return sum + (file?.size || 0);
        }, 0);

        bar.innerHTML = `
            <div class="bulk-info">
                <span class="bulk-count">${selectedFiles.size} selected</span>
                <span class="bulk-size">(${formatFileSize(selectedSize)})</span>
            </div>
            <div class="bulk-buttons">
                <button class="bulk-btn select-all" onclick="selectAllFiles()">Select All</button>
                <button class="bulk-btn download-zip" onclick="downloadSelectedAsZip()">📦 Download ZIP</button>
                <button class="bulk-btn delete-selected" onclick="confirmBulkDelete()">🗑️ Delete</button>
                <button class="bulk-btn cancel" onclick="deselectAllFiles()">✕ Cancel</button>
            </div>
        `;
        bar.classList.add('visible');
    } else if (bar) {
        bar.classList.remove('visible');
    }
}

// Bulk Delete
function confirmBulkDelete() {
    if (selectedFiles.size === 0) return;

    const count = selectedFiles.size;
    const overlay = document.getElementById('confirm-overlay');
    const filename = document.getElementById('confirm-filename');
    const title = document.querySelector('#confirm-overlay .confirm-title');

    if (title) title.textContent = 'Delete ' + count + ' Files?';
    if (filename) filename.textContent = count + ' files will be permanently deleted';

    // Store that this is a bulk delete
    pendingDeleteKey = 'BULK_DELETE';

    if (overlay) overlay.classList.add('active');
}

async function executeBulkDelete() {
    const keys = Array.from(selectedFiles);
    let successCount = 0;
    let failCount = 0;

    showToast('Deleting Files', `Deleting ${keys.length} files...`, 'info');

    for (const key of keys) {
        try {
            const response = await fetch('/api/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key })
            });
            const result = await response.json();
            if (result.success) {
                successCount++;
            } else {
                failCount++;
            }
        } catch (error) {
            failCount++;
        }
    }

    selectedFiles.clear();
    updateBulkActionsBar();

    if (failCount === 0) {
        showToast('Delete Complete', `${successCount} files deleted successfully`, 'success');
    } else {
        showToast('Delete Complete', `${successCount} deleted, ${failCount} failed`, 'warning');
    }

    loadFiles();
}

// Download as ZIP
async function downloadSelectedAsZip() {
    if (selectedFiles.size === 0) {
        showToast('No Files Selected', 'Select files to download as ZIP', 'warning');
        return;
    }

    // Check if JSZip is loaded
    if (typeof JSZip === 'undefined') {
        showToast('Loading...', 'Preparing ZIP functionality', 'info');
        await loadJSZip();
    }

    showToast('Creating ZIP', `Packaging ${selectedFiles.size} files...`, 'info');

    const zip = new JSZip();
    const keys = Array.from(selectedFiles);
    let downloadedCount = 0;

    for (const key of keys) {
        const file = allFiles.find(f => f.key === key);
        if (!file) continue;

        try {
            const response = await fetch('/api/download?key=' + encodeURIComponent(key));
            if (response.ok) {
                const blob = await response.blob();
                zip.file(file.name, blob);
                downloadedCount++;
            }
        } catch (error) {
            console.error('Failed to fetch file for ZIP:', file.name, error);
        }
    }

    if (downloadedCount === 0) {
        showToast('ZIP Failed', 'No files could be downloaded', 'error');
        return;
    }

    try {
        const content = await zip.generateAsync({
            type: 'blob',
            compression: 'DEFLATE',
            compressionOptions: { level: 6 }
        });

        // Create download link
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = `scarmonit-files-${new Date().toISOString().slice(0,10)}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast('ZIP Ready', `Downloaded ${downloadedCount} files`, 'success');
        createConfetti();
    } catch (error) {
        showToast('ZIP Error', error.message, 'error');
    }
}

function loadJSZip() {
    return new Promise((resolve, reject) => {
        if (typeof JSZip !== 'undefined') {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        script.integrity = 'sha512-XMVd28F1oH/O71fzwBnV7HucLxVwtxf26XV8P4wPk26EDxuGZ91N8bsOttmnomcCD3CS5ZMRL50H0GgOHvegtg==';
        script.crossOrigin = 'anonymous';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Keyboard Shortcuts
document.addEventListener('keydown', function(e) {
    // Only handle if authenticated
    if (!sessionStorage.getItem('scarmonit_upload_auth')) return;

    // Check if user is typing in an input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    // Escape - close modals/deselect
    if (e.key === 'Escape') {
        closePreviewModal();
        closeConfirmModal();
        closeRenameModal();
        if (selectedFiles.size > 0) {
            deselectAllFiles();
        }
    }

    // Arrow keys for preview navigation
    if (document.getElementById('preview-modal')?.classList.contains('active')) {
        if (e.key === 'ArrowLeft') {
            navigatePreview(-1);
        } else if (e.key === 'ArrowRight') {
            navigatePreview(1);
        }
    }

    // Delete key - delete selected files
    if (e.key === 'Delete' && selectedFiles.size > 0) {
        e.preventDefault();
        confirmBulkDelete();
    }

    // Ctrl/Cmd + A - select all (when bulk mode is active)
    if ((e.ctrlKey || e.metaKey) && e.key === 'a' && bulkModeEnabled) {
        e.preventDefault();
        selectAllFiles();
    }
});

// Override delete confirmation to handle bulk delete
const originalDeleteHandler = document.getElementById('confirm-delete')?.onclick;
document.addEventListener('DOMContentLoaded', function() {
    const deleteBtn = document.getElementById('confirm-delete');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', async function() {
            if (pendingDeleteKey === 'BULK_DELETE') {
                await executeBulkDelete();
                closeConfirmModal();
                pendingDeleteKey = null;
            }
        });
    }
});

// Initial load
document.addEventListener('DOMContentLoaded', loadFiles);

// ============================================
// NEW v16 FEATURES: Favorites, Stats Chart, Context Menu, Image Zoom
// ============================================

// Favorites System
const FAVORITES_KEY = 'scarmonit_favorites';

function getFavorites() {
    try {
        return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
    } catch {
        return [];
    }
}

function saveFavorites(favorites) {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}

function toggleFavorite(key) {
    const favorites = getFavorites();
    const index = favorites.indexOf(key);

    if (index === -1) {
        favorites.push(key);
        showToast('Added to Favorites', 'File starred', 'success');
    } else {
        favorites.splice(index, 1);
        showToast('Removed from Favorites', 'File unstarred', 'info');
    }

    saveFavorites(favorites);

    // Update UI
    const btn = document.querySelector(`.file-card[data-key="${CSS.escape(key)}"] .favorite-btn`);
    if (btn) {
        btn.classList.toggle('active', index === -1);
    }
}

function isFavorite(key) {
    return getFavorites().includes(key);
}

// File Type Statistics Chart
function createStatsChart(files) {
    const container = document.getElementById('files-container');
    if (!container || files.length === 0) return null;

    // Calculate stats by category
    const stats = {
        images: { count: 0, size: 0 },
        videos: { count: 0, size: 0 },
        documents: { count: 0, size: 0 },
        archives: { count: 0, size: 0 },
        other: { count: 0, size: 0 }
    };

    files.forEach(file => {
        const category = getFileTypeCategory(file.type, file.name);
        if (stats[category]) {
            stats[category].count++;
            stats[category].size += file.size || 0;
        } else {
            stats.other.count++;
            stats.other.size += file.size || 0;
        }
    });

    const totalSize = files.reduce((sum, f) => sum + (f.size || 0), 0);
    if (totalSize === 0) return null;

    const chart = document.createElement('div');
    chart.className = 'stats-chart-container';
    chart.innerHTML = `
        <div class="stats-chart-header">
            <span class="stats-chart-title">📊 Storage Breakdown</span>
        </div>
        <div class="stats-chart">
            ${stats.images.size > 0 ? `<div class="stats-bar images" style="width: ${(stats.images.size / totalSize * 100).toFixed(1)}%" title="Images: ${formatFileSize(stats.images.size)}"></div>` : ''}
            ${stats.videos.size > 0 ? `<div class="stats-bar videos" style="width: ${(stats.videos.size / totalSize * 100).toFixed(1)}%" title="Videos: ${formatFileSize(stats.videos.size)}"></div>` : ''}
            ${stats.documents.size > 0 ? `<div class="stats-bar documents" style="width: ${(stats.documents.size / totalSize * 100).toFixed(1)}%" title="Documents: ${formatFileSize(stats.documents.size)}"></div>` : ''}
            ${stats.archives.size > 0 ? `<div class="stats-bar archives" style="width: ${(stats.archives.size / totalSize * 100).toFixed(1)}%" title="Archives: ${formatFileSize(stats.archives.size)}"></div>` : ''}
            ${stats.other.size > 0 ? `<div class="stats-bar other" style="width: ${(stats.other.size / totalSize * 100).toFixed(1)}%" title="Other: ${formatFileSize(stats.other.size)}"></div>` : ''}
        </div>
        <div class="stats-legend">
            ${stats.images.count > 0 ? `<div class="stats-legend-item"><span class="stats-legend-color images"></span>Images (${stats.images.count})</div>` : ''}
            ${stats.videos.count > 0 ? `<div class="stats-legend-item"><span class="stats-legend-color videos"></span>Videos (${stats.videos.count})</div>` : ''}
            ${stats.documents.count > 0 ? `<div class="stats-legend-item"><span class="stats-legend-color documents"></span>Docs (${stats.documents.count})</div>` : ''}
            ${stats.archives.count > 0 ? `<div class="stats-legend-item"><span class="stats-legend-color archives"></span>Archives (${stats.archives.count})</div>` : ''}
            ${stats.other.count > 0 ? `<div class="stats-legend-item"><span class="stats-legend-color other"></span>Other (${stats.other.count})</div>` : ''}
        </div>
    `;

    return chart;
}

// Context Menu
let activeContextMenu = null;
let contextMenuOpenTime = 0;
let contextMenuLocked = false; // Hard lock that blocks ALL close attempts
let pendingCloseTimeout = null; // For debounced closing
let contextMenuInstanceId = 0; // Unique ID for each menu instance

function showContextMenu(e, file) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    // Cancel any pending close immediately
    if (pendingCloseTimeout) {
        clearTimeout(pendingCloseTimeout);
        pendingCloseTimeout = null;
    }

    // Generate a new unique instance ID for this menu
    const thisMenuId = ++contextMenuInstanceId;

    // Hard lock the menu - NO closing allowed for 1000ms (increased from 500ms)
    contextMenuLocked = true;

    // Hide any existing menu (this is safe because we're creating a new one)
    if (activeContextMenu) {
        activeContextMenu.remove();
        activeContextMenu = null;
    }

    // Track when menu was opened
    contextMenuOpenTime = Date.now();

    // Keep the lock for 1000ms to handle all possible event timing issues
    setTimeout(() => {
        // Only unlock if this is still the current menu
        if (contextMenuInstanceId === thisMenuId) {
            contextMenuLocked = false;
        }
    }, 1000);

    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.innerHTML = `
        <div class="context-menu-item" data-action="preview">
            <span class="context-menu-icon">👁️</span> Preview
        </div>
        <div class="context-menu-item" data-action="copy">
            <span class="context-menu-icon">📋</span> Copy Link
        </div>
        <div class="context-menu-item" data-action="download">
            <span class="context-menu-icon">⬇️</span> Download
        </div>
        <div class="context-menu-item" data-action="favorite">
            <span class="context-menu-icon">${isFavorite(file.key) ? '★' : '☆'}</span> ${isFavorite(file.key) ? 'Unfavorite' : 'Favorite'}
        </div>
        <div class="context-menu-divider"></div>
        <div class="context-menu-item" data-action="details">
            <span class="context-menu-icon">ℹ️</span> Details
        </div>
        <div class="context-menu-item" data-action="rename">
            <span class="context-menu-icon">✏️</span> Rename
        </div>
        <div class="context-menu-divider"></div>
        <div class="context-menu-item danger" data-action="delete">
            <span class="context-menu-icon">🗑️</span> Delete
        </div>
    `;

    document.body.appendChild(menu);
    activeContextMenu = menu;

    // Position menu
    const rect = menu.getBoundingClientRect();
    let x = e.clientX;
    let y = e.clientY;

    if (x + rect.width > window.innerWidth) x = window.innerWidth - rect.width - 10;
    if (y + rect.height > window.innerHeight) y = window.innerHeight - rect.height - 10;

    menu.style.left = x + 'px';
    menu.style.top = y + 'px';

    // Use double requestAnimationFrame for reliable rendering
    // This ensures the DOM has been painted before we add the active class
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            // Only add active class if this menu is still the current one
            if (activeContextMenu === menu && contextMenuInstanceId === thisMenuId) {
                menu.classList.add('active');
            }
        });
    });

    // Handle clicks
    menu.addEventListener('click', function(event) {
        const item = event.target.closest('.context-menu-item');
        if (!item) return;

        const action = item.dataset.action;

        switch (action) {
            case 'preview':
                if (isPreviewable(file.type, file.name)) {
                    openPreviewModal(file, 0);
                } else {
                    showToast('Preview Unavailable', 'This file type cannot be previewed', 'warning');
                }
                break;
            case 'copy':
                const url = window.location.origin + '/api/download?key=' + encodeURIComponent(file.key);
                navigator.clipboard.writeText(url);
                showToast('Link Copied', 'URL copied to clipboard', 'success');
                break;
            case 'download':
                const a = document.createElement('a');
                a.href = '/api/download?key=' + encodeURIComponent(file.key);
                a.download = file.name;
                a.click();
                break;
            case 'favorite':
                toggleFavorite(file.key);
                break;
            case 'details':
                showFileDetails(file);
                break;
            case 'rename':
                openRenameModal(file.key, file.name);
                break;
            case 'delete':
                confirmDelete(file.key, file.name);
                break;
        }

        hideContextMenu();
    });
}

function hideContextMenu() {
    if (activeContextMenu) {
        const menuToRemove = activeContextMenu;
        menuToRemove.classList.remove('active');
        activeContextMenu = null;
        // Remove after the CSS transition completes
        setTimeout(() => {
            if (menuToRemove && menuToRemove.parentNode) {
                menuToRemove.remove();
            }
        }, 150);
    }
}

// Debounced close function - schedules close and can be cancelled
function scheduleContextMenuClose() {
    // If locked, don't even schedule
    if (contextMenuLocked) return;

    // Cancel any existing pending close
    if (pendingCloseTimeout) {
        clearTimeout(pendingCloseTimeout);
    }

    // Schedule close with small delay to allow cancellation
    pendingCloseTimeout = setTimeout(() => {
        pendingCloseTimeout = null;
        // Double-check lock before closing
        if (!contextMenuLocked && activeContextMenu) {
            hideContextMenu();
        }
    }, 50);
}

// Helper function to check if we should allow closing the context menu
function canCloseContextMenu(e) {
    // Hard lock - absolutely no closing
    if (contextMenuLocked) return false;
    // No active menu to close
    if (!activeContextMenu) return false;
    // Don't close if interacting inside the menu
    if (e && e.target && e.target.closest('.context-menu')) return false;
    // Extra safety: check time elapsed (1000ms to match lock)
    if (Date.now() - contextMenuOpenTime < 1000) return false;
    return true;
}

// Close context menu on left-click outside
document.addEventListener('click', function(e) {
    // Only close on explicit left-click (button 0)
    if (e.button !== 0) return;
    if (!canCloseContextMenu(e)) return;
    scheduleContextMenuClose();
}, false);

// Handle auxclick (middle/right click) - never close menu on right-click
document.addEventListener('auxclick', function(e) {
    // Right-click (button 2) should NEVER close the menu
    if (e.button === 2) return;
    if (!canCloseContextMenu(e)) return;
    scheduleContextMenuClose();
}, false);

// Handle mousedown - use capture phase to intercept early
document.addEventListener('mousedown', function(e) {
    // Ignore ALL right-click related mousedown
    if (e.button === 2) return;
    if (!canCloseContextMenu(e)) return;
    // Only left-click outside closes
    if (activeContextMenu && e.button === 0) {
        scheduleContextMenuClose();
    }
}, true); // Use capture phase

// Handle pointerdown - some browsers fire this instead of/before mousedown
document.addEventListener('pointerdown', function(e) {
    // Ignore right-click pointer events
    if (e.button === 2 || e.pointerType === 'touch') return;
    if (!canCloseContextMenu(e)) return;
    if (activeContextMenu && e.button === 0) {
        scheduleContextMenuClose();
    }
}, true); // Use capture phase

// Handle pointerup - block during context menu operation
document.addEventListener('pointerup', function(e) {
    if (e.button === 2) return;
    // Don't do anything - just block
}, true);

// Close menu when right-clicking elsewhere (to show new menu or browser menu)
document.addEventListener('contextmenu', function(e) {
    // Only close if clicking outside both file cards and the menu itself
    if (!e.target.closest('.file-card') && !e.target.closest('.context-menu')) {
        // Use immediate close here since user is opening another context menu
        if (!contextMenuLocked) {
            hideContextMenu();
        }
    }
}, false);

// Also handle window blur - some browsers fire this on right-click
window.addEventListener('blur', function() {
    // Don't close on blur if menu is locked
    if (contextMenuLocked) return;
    // Don't close immediately - the user might just be switching focus temporarily
}, false);

// File Details Panel
function showFileDetails(file) {
    let panel = document.getElementById('file-details-panel');

    if (!panel) {
        panel = document.createElement('div');
        panel.id = 'file-details-panel';
        panel.className = 'file-details-panel';
        document.body.appendChild(panel);
    }

    const isImage = isImageFile(file.type);
    const previewUrl = '/api/download?key=' + encodeURIComponent(file.key);

    panel.innerHTML = `
        <button class="file-details-close">&times;</button>
        <div class="file-details-preview">
            ${isImage ? `<img src="${previewUrl}" alt="${file.name}">` : `<span class="icon">${getFileIcon(file.type)}</span>`}
        </div>
        <div class="file-details-name">${file.name}</div>
        <div class="file-details-meta">
            <div class="file-details-row">
                <span class="file-details-label">Size</span>
                <span class="file-details-value">${formatFileSize(file.size)}</span>
            </div>
            <div class="file-details-row">
                <span class="file-details-label">Type</span>
                <span class="file-details-value">${file.type || 'Unknown'}</span>
            </div>
            <div class="file-details-row">
                <span class="file-details-label">Uploaded</span>
                <span class="file-details-value">${formatDate(file.uploadedAt)}</span>
            </div>
            <div class="file-details-row">
                <span class="file-details-label">Extension</span>
                <span class="file-details-value">.${getFileExtension(file.name).toLowerCase()}</span>
            </div>
            ${isIPVisible() && file.uploaderIP ? `
            <div class="file-details-row">
                <span class="file-details-label">Uploader IP</span>
                <span class="file-details-value">${file.uploaderIP}</span>
            </div>
            ` : ''}
        </div>
        <div class="file-details-actions">
            <button class="file-details-btn" onclick="copyToClipboard('${window.location.origin}/api/download?key=${encodeURIComponent(file.key)}', this)">📋 Copy Link</button>
            <a class="file-details-btn" href="${previewUrl}" download="${file.name}">⬇️ Download</a>
            <button class="file-details-btn" onclick="openRenameModal('${file.key}', '${file.name.replace(/'/g, "\\'")}'); closeFileDetails();">✏️ Rename</button>
            <button class="file-details-btn danger" onclick="confirmDelete('${file.key}', '${file.name.replace(/'/g, "\\'")}'); closeFileDetails();">🗑️ Delete</button>
        </div>
    `;

    panel.querySelector('.file-details-close').onclick = closeFileDetails;

    setTimeout(() => panel.classList.add('active'), 10);
}

function closeFileDetails() {
    const panel = document.getElementById('file-details-panel');
    if (panel) {
        panel.classList.remove('active');
    }
}

// Image Zoom in Preview
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('preview-image')) {
        e.target.classList.toggle('zoomed');
    }
});

// Recent Files Section
function createRecentFilesSection(files) {
    // Get files from last 24 hours
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    const recentFiles = files
        .filter(f => new Date(f.uploadedAt).getTime() > oneDayAgo)
        .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
        .slice(0, 5);

    if (recentFiles.length === 0) return null;

    const section = document.createElement('div');
    section.className = 'recent-files-section';
    section.innerHTML = `
        <div class="recent-files-header">
            <span>⚡</span> Recently Uploaded
        </div>
        <div class="recent-files-grid">
            ${recentFiles.map(file => `
                <div class="recent-file-card" onclick="openPreviewModal(allFiles.find(f => f.key === '${file.key}'), 0)" title="${file.name}">
                    <div class="recent-file-icon">${getFileIcon(file.type)}</div>
                    <div class="recent-file-name">${file.name}</div>
                    <div class="recent-file-time">${formatRelativeTime(file.uploadedAt)}</div>
                </div>
            `).join('')}
        </div>
    `;

    return section;
}

// Enhance file cards with favorites and context menu
const originalCreateFileCard = createFileCard;
createFileCard = function(file, isRecent = false, cardIndex = 0) {
    const card = originalCreateFileCard(file, isRecent, cardIndex);

    // Add favorite button to actions row (not floating)
    const actionsDiv = card.querySelector('.file-actions');
    if (actionsDiv) {
        const favoriteBtn = document.createElement('button');
        favoriteBtn.className = 'file-btn favorite' + (isFavorite(file.key) ? ' active' : '');
        favoriteBtn.title = isFavorite(file.key) ? 'Remove from Favorites' : 'Add to Favorites';
        favoriteBtn.innerHTML = isFavorite(file.key) ? '★' : '☆';
        favoriteBtn.onclick = function(e) {
            e.stopPropagation();
            toggleFavorite(file.key);
            // Update button state
            const isNowFavorite = isFavorite(file.key);
            favoriteBtn.classList.toggle('active', isNowFavorite);
            favoriteBtn.innerHTML = isNowFavorite ? '★' : '☆';
            favoriteBtn.title = isNowFavorite ? 'Remove from Favorites' : 'Add to Favorites';
        };
        actionsDiv.appendChild(favoriteBtn);
    }

    // Add context menu
    card.addEventListener('contextmenu', function(e) {
        e.stopPropagation();
        showContextMenu(e, file);
    });

    // Add quick preview for images
    if (isImageFile(file.type)) {
        const quickPreview = document.createElement('div');
        quickPreview.className = 'quick-preview';
        quickPreview.innerHTML = `<img src="/api/download?key=${encodeURIComponent(file.key)}" alt="${file.name}" loading="lazy">`;
        card.appendChild(quickPreview);
    }

    return card;
};

// Add favorites filter to header
const originalCreateFilesHeader = createFilesHeader;
createFilesHeader = function(files) {
    const header = originalCreateFilesHeader(files);

    // Add favorites filter button
    const filterDiv = header.querySelector('.filter-buttons');
    if (filterDiv) {
        const favoritesBtn = document.createElement('button');
        favoritesBtn.className = 'filter-btn favorites' + (currentFilter === 'favorites' ? ' active' : '');
        favoritesBtn.textContent = '⭐ Favorites';
        favoritesBtn.onclick = function() {
            currentFilter = currentFilter === 'favorites' ? 'all' : 'favorites';
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            if (currentFilter === 'favorites') {
                favoritesBtn.classList.add('active');
            } else {
                filterDiv.querySelector('.filter-btn')?.classList.add('active');
            }
            renderFiles(allFiles, document.getElementById('files-container'));
        };
        filterDiv.appendChild(favoritesBtn);
    }

    return header;
};

// Update filter function to handle favorites
const originalFilterFiles = filterFiles;
filterFiles = function(files) {
    let filtered = files;

    // Apply favorites filter
    if (currentFilter === 'favorites') {
        const favorites = getFavorites();
        filtered = filtered.filter(file => favorites.includes(file.key));
    } else if (currentFilter !== 'all') {
        filtered = filtered.filter(file => {
            const category = getFileTypeCategory(file.type, file.name);
            return category === currentFilter;
        });
    }

    // Apply search (case-insensitive)
    if (searchQuery) {
        const query = searchQuery.trim().toLowerCase();
        filtered = filtered.filter(file =>
            file.name.toLowerCase().includes(query)
        );
    }

    // Apply sort
    filtered.sort(sortFunctions[currentSort]);

    return filtered;
};

// Update renderFiles to include stats chart and recent files
const originalRenderFiles = renderFiles;
renderFiles = function(files, container) {
    // Remove existing elements
    const existingGrid = container.querySelector('.files-grid');
    const existingEmpty = container.querySelector('.empty-state');
    const existingStats = container.querySelector('.stats-chart-container');
    const existingRecent = container.querySelector('.recent-files-section');
    if (existingGrid) existingGrid.remove();
    if (existingEmpty) existingEmpty.remove();
    if (existingStats) existingStats.remove();
    if (existingRecent) existingRecent.remove();

    const filteredFiles = filterFiles(files);

    // Add stats chart (only if showing all files)
    if (currentFilter === 'all' && !searchQuery && files.length > 0) {
        const statsChart = createStatsChart(files);
        if (statsChart) {
            container.appendChild(statsChart);
        }

        // Add recent files section
        const recentSection = createRecentFilesSection(files);
        if (recentSection) {
            container.appendChild(recentSection);
        }
    }

    if (filteredFiles.length > 0) {
        const grid = document.createElement('div');
        grid.className = 'files-grid' + (currentView === 'list' ? ' list-view' : '');

        filteredFiles.forEach(function(file, index) {
            const isRecentUpload = new Date() - new Date(file.uploadedAt) < 5000;
            const isNew = new Date() - new Date(file.uploadedAt) < 86400000;
            const card = createFileCard(file, isRecentUpload, index);
            if (isNew && !isRecentUpload) card.classList.add('new');
            if (selectedFiles.has(file.key)) {
                card.classList.add('selected');
                const cb = card.querySelector('.file-checkbox input');
                if (cb) cb.checked = true;
            }
            grid.appendChild(card);
        });

        container.appendChild(grid);
    } else {
        const empty = document.createElement('div');
        empty.className = 'empty-state';

        const emptyIcon = document.createElement('div');
        emptyIcon.className = 'empty-icon';
        emptyIcon.textContent = currentFilter === 'favorites' ? '⭐' : (searchQuery ? '🔍' : '📭');

        const emptyTitle = document.createElement('h3');
        emptyTitle.textContent = currentFilter === 'favorites' ? 'No Favorites Yet' : (searchQuery ? 'No Files Found' : 'No Files Yet');

        const emptyText = document.createElement('p');
        emptyText.textContent = currentFilter === 'favorites'
            ? 'Star some files to see them here!'
            : (searchQuery ? 'Try a different search term' : 'Drag and drop files above or click to upload!');

        empty.appendChild(emptyIcon);
        empty.appendChild(emptyTitle);
        empty.appendChild(emptyText);
        container.appendChild(empty);
    }
};

// Close file details on escape
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeFileDetails();
        hideContextMenu();
    }
});
