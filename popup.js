// Update statistics when popup opens
document.addEventListener('DOMContentLoaded', function() {
    updateStats();
    
    // Add event listener for clear data button
    document.getElementById('clearData').addEventListener('click', clearData);
});

// Update statistics from storage
function updateStats() {
    chrome.storage.local.get(['dataset', 'stats'], function(result) {
        const dataset = result.dataset || {};
        const stats = result.stats || { sitesChecked: 0, phishingBlocked: 0 };
        
        // Count total sites and phishing sites
        const totalSites = Object.keys(dataset).length;
        const phishingSites = Object.values(dataset).filter(label => label === 'phishing').length;
        
        // Update display
        document.getElementById('sitesChecked').textContent = totalSites;
        document.getElementById('phishingBlocked').textContent = phishingSites;
    });
}

// Clear all stored data
function clearData() {
    chrome.storage.local.clear(function() {
        // Update display
        document.getElementById('sitesChecked').textContent = '0';
        document.getElementById('phishingBlocked').textContent = '0';
        
        // Show confirmation
        const status = document.querySelector('.status');
        status.textContent = 'History Cleared';
        status.style.backgroundColor = '#c6f6d5';
        status.style.color = '#2f855a';
        
        // Reset status after 2 seconds
        setTimeout(() => {
            status.textContent = 'Protection Active';
        }, 2000);
    });
} 