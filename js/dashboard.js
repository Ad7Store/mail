// GitHub API Configuration
const GITHUB_TOKEN = 'YOUR_GITHUB_TOKEN';
const GITHUB_REPO = 'username/repo-name';
const GITHUB_API = 'https://api.github.com';

// GitHub API Helper Functions
async function githubRequest(endpoint, method = 'GET', data = null) {
    const headers = {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
    };
    
    const options = {
        method,
        headers,
        body: data ? JSON.stringify(data) : null
    };
    
    try {
        const response = await fetch(`${GITHUB_API}${endpoint}`, options);
        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status}`);
        }
        
        if (method !== 'GET') {
            return await response.json();
        }
        return await response.json();
    } catch (error) {
        console.error('GitHub API request failed:', error);
        throw error;
    }
}

// Get file from GitHub
async function getFile(path) {
    try {
        const file = await githubRequest(`/repos/${GITHUB_REPO}/contents/${path}`);
        const content = JSON.parse(atob(file.content));
        return content;
    } catch (error) {
        return [];
    }
}

// Update file in GitHub
async function updateFile(path, content, message) {
    try {
        // First get the file to get its SHA
        const existingFile = await githubRequest(`/repos/${GITHUB_REPO}/contents/${path}`);
        
        const data = {
            message,
            content: btoa(JSON.stringify(content, null, 2)),
            sha: existingFile.sha
        };
        
        return await githubRequest(`/repos/${GITHUB_REPO}/contents/${path}`, 'PUT', data);
    } catch (error) {
        console.error('Failed to update file:', error);
        throw error;
    }
}

// Check authentication
async function checkAuth() {
    const currentUser = sessionStorage.getItem('currentUser');
    if (!currentUser) {
        window.location.href = 'index.html';
        return null;
    }
    
    try {
        const user = JSON.parse(currentUser);
        
        // Get latest user data from GitHub
        const users = await getFile('data/users.json');
        const latestUser = users.find(u => u.userId === user.userId);
        
        if (!latestUser) {
            sessionStorage.removeItem('currentUser');
            window.location.href = 'index.html';
            return null;
        }
        
        // Update session storage with latest data
        sessionStorage.setItem('currentUser', JSON.stringify(latestUser));
        return latestUser;
    } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = 'index.html';
        return null;
    }
}

// Load user data
async function loadUserData() {
    const user = await checkAuth();
    if (!user) return;
    
    // Update dashboard with user data
    document.getElementById('welcome-user').textContent = `Welcome, ${user.fullName}!`;
    document.getElementById('user-id-display').textContent = user.userId;
    document.getElementById('balance-amount').textContent = user.balance;
    document.getElementById('user-level').textContent = user.level;
    document.getElementById('total-friends').textContent = user.totalFriends;
    document.getElementById('verified-friends').textContent = user.verifiedFriends;
    document.getElementById('pending-friends').textContent = user.pendingFriends;
    document.getElementById('declined-friends').textContent = user.declinedFriends;
    
    // Show admin button if user is admin
    if (user.isAdmin) {
        document.getElementById('admin-btn').classList.remove('hidden');
    }
}

// Handle logout
document.getElementById('logout-btn').addEventListener('click', function() {
    sessionStorage.removeItem('currentUser');
    window.location.href = 'index.html';
});

// Redirect to withdraw page
document.getElementById('withdraw-btn').addEventListener('click', function() {
    window.location.href = 'withdraw.html';
});

// Redirect to task page
document.getElementById('task-btn').addEventListener('click', function() {
    window.location.href = 'task.html';
});

// Redirect to admin dashboard
document.getElementById('admin-btn').addEventListener('click', function() {
    window.location.href = 'admin-dashboard.html';
});

// Support button
document.getElementById('support-btn').addEventListener('click', function() {
    window.location.href = 'mailto:dripmobiles@gmail.com';
});

// Initialize dashboard
window.addEventListener('DOMContentLoaded', async function() {
    await loadUserData();
});
