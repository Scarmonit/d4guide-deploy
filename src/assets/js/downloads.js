// Search functionality
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const query = this.value.toLowerCase().trim();
            const cards = document.querySelectorAll('.download-card');
            const noResults = document.getElementById('no-results');
            let visibleCount = 0;

            cards.forEach(card => {
                const text = card.textContent.toLowerCase();
                if (query === '' || text.includes(query)) {
                    card.classList.remove('hidden');
                    visibleCount++;
                } else {
                    card.classList.add('hidden');
                }
            });

            // Show/hide no results message
            if (noResults) {
                noResults.style.display = visibleCount === 0 && query !== '' ? 'block' : 'none';
            }
        });
    }
});
