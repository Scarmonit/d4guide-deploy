/**
 * Change Password - Scarmonit
 * Client-side password management for protected areas
 */

(function() {
    'use strict';

    // ===== AUTHENTICATION CONFIGURATION =====
    const DEFAULT_PASSWORD = 'scarmonit123';
    const PASSWORD_STORAGE_KEY = 'scarmonit_custom_password';
    const HINT_STORAGE_KEY = 'scarmonit_password_hint';

    // Session keys for all protected areas
    const SESSION_KEYS = [
        'scarmonit_kpass_auth',
        'scarmonit_base_auth',
        'scarmonit_upload_auth'
    ];

    // ===== DOM ELEMENTS =====
    let elements = {};

    // ===== INITIALIZATION =====
    document.addEventListener('DOMContentLoaded', function() {
        initElements();
        checkAuthenticationStatus();
        setupEventListeners();
    });

    function initElements() {
        elements = {
            // Auth overlay
            authOverlay: document.getElementById('authOverlay'),
            authPassword: document.getElementById('authPassword'),
            unlockBtn: document.getElementById('unlockBtn'),
            authError: document.getElementById('authError'),
            mainApp: document.getElementById('mainApp'),

            // Form elements
            form: document.getElementById('changeForm'),
            currentPassword: document.getElementById('currentPassword'),
            newPassword: document.getElementById('newPassword'),
            confirmPassword: document.getElementById('confirmPassword'),
            passwordHint: document.getElementById('passwordHint'),
            changeBtn: document.getElementById('changeBtn'),
            cancelBtn: document.getElementById('cancelBtn'),
            messageDiv: document.getElementById('message')
        };
    }

    // ===== PASSWORD MANAGEMENT =====
    function getCurrentPassword() {
        // Check if a custom password has been set
        const customPassword = localStorage.getItem(PASSWORD_STORAGE_KEY);
        return customPassword || DEFAULT_PASSWORD;
    }

    function setNewPassword(password, hint) {
        localStorage.setItem(PASSWORD_STORAGE_KEY, password);
        if (hint) {
            localStorage.setItem(HINT_STORAGE_KEY, hint);
        } else {
            localStorage.removeItem(HINT_STORAGE_KEY);
        }
    }

    function getPasswordHint() {
        return localStorage.getItem(HINT_STORAGE_KEY) || '';
    }

    function clearAllSessions() {
        SESSION_KEYS.forEach(key => {
            sessionStorage.removeItem(key);
        });
    }

    // ===== AUTHENTICATION =====
    function checkAuthenticationStatus() {
        // Check if any session is authenticated
        const isAuthenticated = SESSION_KEYS.some(key =>
            sessionStorage.getItem(key) === 'true'
        );

        if (isAuthenticated) {
            showMainApp();
        } else {
            showAuthOverlay();
        }
    }

    function showAuthOverlay() {
        if (elements.authOverlay) {
            elements.authOverlay.classList.remove('hidden');
            elements.authOverlay.style.display = 'flex';
        }
        if (elements.mainApp) {
            elements.mainApp.style.display = 'none';
        }

        // Show password hint if available
        const hint = getPasswordHint();
        if (hint && elements.authError) {
            elements.authError.textContent = 'Hint: ' + hint;
            elements.authError.style.color = 'rgba(212, 175, 55, 0.8)';
        }
    }

    function showMainApp() {
        if (elements.authOverlay) {
            elements.authOverlay.classList.add('hidden');
            elements.authOverlay.style.display = 'none';
        }
        if (elements.mainApp) {
            elements.mainApp.style.display = 'block';
        }
        // Focus the current password field
        if (elements.currentPassword) {
            elements.currentPassword.focus();
        }
    }

    function handleAuth() {
        const password = elements.authPassword ? elements.authPassword.value : '';
        const correctPassword = getCurrentPassword();

        if (password === correctPassword) {
            // Set session for all protected areas
            SESSION_KEYS.forEach(key => {
                sessionStorage.setItem(key, 'true');
            });
            if (elements.authError) {
                elements.authError.textContent = '';
                elements.authError.style.color = '#ff4757';
            }
            showMainApp();
        } else {
            if (elements.authError) {
                const hint = getPasswordHint();
                elements.authError.textContent = 'Invalid password. Please try again.' +
                    (hint ? '\nHint: ' + hint : '');
                elements.authError.style.color = '#ff4757';
            }
            if (elements.authPassword) {
                elements.authPassword.value = '';
                elements.authPassword.focus();
            }
        }
    }

    // ===== EVENT LISTENERS =====
    function setupEventListeners() {
        // Auth events
        if (elements.unlockBtn) {
            elements.unlockBtn.addEventListener('click', handleAuth);
        }
        if (elements.authPassword) {
            elements.authPassword.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') handleAuth();
            });
        }

        // Form events
        if (elements.form) {
            elements.form.addEventListener('submit', handlePasswordChange);
        }
        if (elements.cancelBtn) {
            elements.cancelBtn.addEventListener('click', handleCancel);
        }
    }

    // ===== PASSWORD CHANGE =====
    function showMessage(message, type) {
        if (!elements.messageDiv) return;
        elements.messageDiv.innerHTML = '<div class="alert alert-' + type + '">' + message + '</div>';
        elements.messageDiv.scrollIntoView({ behavior: 'smooth' });
    }

    function handlePasswordChange(e) {
        e.preventDefault();

        const currentPassword = elements.currentPassword?.value || '';
        const newPassword = elements.newPassword?.value || '';
        const confirmPassword = elements.confirmPassword?.value || '';
        const passwordHint = (elements.passwordHint?.value || '').trim();

        // Validate current password
        if (currentPassword !== getCurrentPassword()) {
            showMessage('Current password is incorrect', 'error');
            if (elements.currentPassword) {
                elements.currentPassword.value = '';
                elements.currentPassword.focus();
            }
            return;
        }

        // Validate new passwords match
        if (newPassword !== confirmPassword) {
            showMessage('New passwords do not match', 'error');
            if (elements.confirmPassword) {
                elements.confirmPassword.value = '';
                elements.confirmPassword.focus();
            }
            return;
        }

        // Validate password length
        if (newPassword.length < 8) {
            showMessage('New password must be at least 8 characters long', 'error');
            return;
        }

        // Validate hint length
        if (passwordHint && passwordHint.length > 254) {
            showMessage('Password hint must be 254 characters or less', 'error');
            return;
        }

        // Check if new password is same as current
        if (newPassword === currentPassword) {
            showMessage('New password must be different from current password', 'error');
            return;
        }

        // Disable form while processing
        if (elements.changeBtn) {
            elements.changeBtn.disabled = true;
            elements.changeBtn.textContent = 'CHANGING...';
        }

        // Simulate processing delay for UX
        setTimeout(() => {
            try {
                // Save new password
                setNewPassword(newPassword, passwordHint);

                // Clear all sessions (force re-login)
                clearAllSessions();

                // Show success message
                showMessage('Password changed successfully! You will be redirected to login.', 'success');

                // Clear form
                if (elements.form) elements.form.reset();

                // Redirect after delay
                setTimeout(() => {
                    window.location.href = '/kpass';
                }, 2000);

            } catch (error) {
                console.error('Password change error:', error);
                showMessage('An error occurred. Please try again.', 'error');

                if (elements.changeBtn) {
                    elements.changeBtn.disabled = false;
                    elements.changeBtn.textContent = 'CHANGE PASSWORD';
                }
            }
        }, 500);
    }

    function handleCancel() {
        if (confirm('Cancel password change and return to KPass?')) {
            window.location.href = '/kpass';
        }
    }
})();
