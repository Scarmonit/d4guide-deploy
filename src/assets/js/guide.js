function showTab(tabId) {
    // Hide all contents
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    // Deactivate all buttons
    document.querySelectorAll('.nav-tab').forEach(el => el.classList.remove('active'));
    
    // Show target
    const target = document.getElementById(tabId);
    if (target) target.classList.add('active');
    
    // Activate button (rough match - in a real app might need more precise selection)
    // We assume this function is called by the button click
    if (event && event.target) {
        event.target.classList.add('active');
    }
}
