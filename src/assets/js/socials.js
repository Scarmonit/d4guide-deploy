// Socials Page JavaScript

document.addEventListener('DOMContentLoaded', () => {
    // Copy Link Button
    const copyBtn = document.getElementById('copyLinkBtn');
    const copyToast = document.getElementById('copyToast');

    if (copyBtn && copyToast) {
        copyBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(window.location.href);

                // Show toast
                copyToast.classList.add('show');

                // Update button text temporarily
                const btnText = copyBtn.querySelector('span');
                const originalText = btnText.textContent;
                btnText.textContent = 'Copied!';

                // Reset after 2 seconds
                setTimeout(() => {
                    copyToast.classList.remove('show');
                    btnText.textContent = originalText;
                }, 2000);
            } catch (err) {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = window.location.href;
                textArea.style.position = 'fixed';
                textArea.style.left = '-9999px';
                document.body.appendChild(textArea);
                textArea.select();

                try {
                    document.execCommand('copy');
                    copyToast.classList.add('show');
                    setTimeout(() => copyToast.classList.remove('show'), 2000);
                } catch (e) {
                    console.error('Copy failed:', e);
                }

                document.body.removeChild(textArea);
            }
        });
    }

    // Add ripple effect to social cards on click
    const socialCards = document.querySelectorAll('.social-card');
    socialCards.forEach(card => {
        card.addEventListener('click', function(e) {
            // Create ripple element
            const ripple = document.createElement('span');
            ripple.style.cssText = `
                position: absolute;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                transform: scale(0);
                animation: ripple-effect 0.6s ease-out;
                pointer-events: none;
            `;

            const rect = card.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
            ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';

            card.appendChild(ripple);

            setTimeout(() => ripple.remove(), 600);
        });
    });

    // Add CSS for ripple animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes ripple-effect {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
});
