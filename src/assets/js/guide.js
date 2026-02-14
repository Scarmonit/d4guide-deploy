function showTab(tabId, evt) {
    // Hide all contents
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    // Deactivate all buttons
    document.querySelectorAll('.nav-tab').forEach(el => el.classList.remove('active'));

    // Show target
    const target = document.getElementById(tabId);
    if (target) target.classList.add('active');

    // Activate the clicked button
    const e = evt || window.event;
    if (e && e.target) {
        e.target.classList.add('active');
    }
}
