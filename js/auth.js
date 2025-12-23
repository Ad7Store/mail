// GitHub API Configuration
const GITHUB_TOKEN = 'YOUR_GITHUB_TOKEN'; // Will be replaced with Vercel environment variable
const GITHUB_REPO = 'username/repo-name'; // Your GitHub repository
const GITHUB_OWNER = 'username'; // Your GitHub username

// Base URL for GitHub API
const GITHUB_API = 'https://api.github.com';

// Generate 8-digit user ID
function generateUserId() {
    return Math.floor(10000000 + Math.random() * 90000000).toString();
}

// Show message
function showMessage(elementId, message, type) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.className = `message ${type}`;
    element.classList.remove('hidden');
    
    setTimeout(() => {
        element.classList.add('hidden');
    }, 5000);
}

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

// Create or update file in GitHub
async function createOrUpdateFile(path, content, message) {
    try {
        // First try to get the file to check if it exists
        let sha = null;
        try {
            const file = await githubRequest(`/repos/${GITHUB_REPO}/contents/${path}`);
            sha = file.sha;
        } catch (error) {
            // File doesn't exist, that's okay
        }
        
        const data = {
            message,
            content: btoa(JSON.stringify(content, null, 2)),
            sha
        };
        
        return await githubRequest(`/repos/${GITHUB_REPO}/contents/${path}`, 'PUT', data);
    } catch (error) {
        console.error('Failed to create/update file:', error);
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
        // Return empty array if file doesn't exist
        return [];
    }
}

// Switch between login and signup tabs
document.getElementById('login-tab').addEventListener('click', function() {
    document.getElementById('login-tab').classList.add('active');
    document.getElementById('signup-tab').classList.remove('active');
    document.getElementById('login-form').classList.remove('hidden');
    document.getElementById('signup-form').classList.add('hidden');
});

document.getElementById('signup-tab').addEventListener('click', function() {
    document.getElementById('signup-tab').classList.add('active');
    document.getElementById('login-tab').classList.remove('active');
    document.getElementById('signup-form').classList.remove('hidden');
    document.getElementById('login-form').classList.add('hidden');
});

// Handle signup
document.getElementById('signup-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const fullName = document.getElementById('full-name').value.trim();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const whatsapp = document.getElementById('whatsapp').value.trim();
    
    // Validation
    if (password !== confirmPassword) {
        showMessage('signup-message', 'Passwords do not match!', 'error');
        return;
    }
    
    if (password.length < 6) {
        showMessage('signup-message', 'Password must be at least 6 characters!', 'error');
        return;
    }
    
    if (whatsapp.length < 10) {
        showMessage('signup-message', 'Please enter a valid WhatsApp number!', 'error');
        return;
    }
    
    try {
        // Check if users file exists and get existing users
        const existingUsers = await getFile('data/users.json');
        
        // Check if username already exists
        if (existingUsers.find(u => u.username === username)) {
            showMessage('signup-message', 'Username already exists!', 'error');
            return;
        }
        
        // Create new user
        const userId = generateUserId();
        const newUser = {
            id: userId,
            userId: userId,
            username: username,
            password: password,
            fullName: fullName,
            whatsapp: whatsapp,
            balance: 0,
            level: 1,
            totalFriends: 0,
            verifiedFriends: 0,
            pendingFriends: 0,
            declinedFriends: 0,
            isAdmin: false,
            joined: new Date().toISOString()
        };
        
        // Add new user to array
        existingUsers.push(newUser);
        
        // Save to GitHub
        await createOrUpdateFile('data/users.json', existingUsers, `New user signup: ${username}`);
        
        // Create user-specific file
        await createOrUpdateFile(`data/users/${userId}.json`, {
            user: newUser,
            friends: [],
            withdrawals: []
        }, `User profile created for ${userId}`);
        
        showMessage('signup-message', `Account created successfully! Your User ID: ${userId}`, 'success');
        
        // Clear form
        document.getElementById('signup-form').reset();
        
        // Switch to login tab after 2 seconds
        setTimeout(() => {
            document.getElementById('login-tab').click();
            document.getElementById('login-identifier').value = username;
        }, 2000);
    } catch (error) {
        showMessage('signup-message', 'Failed to create account. Please try again.', 'error');
        console.error(error);
    }
});

// Handle login
document.getElementById('login-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const identifier = document.getElementById('login-identifier').value.trim();
    const password = document.getElementById('login-password').value;
    
    try {
        // Get all users
        const users = await getFile('data/users.json');
        
        // Find user by username or userId
        const user = users.find(u => 
            u.username === identifier || u.userId === identifier
        );
        
        if (!user) {
            showMessage('login-message', 'User not found!', 'error');
            return;
        }
        
        if (user.password !== password) {
            showMessage('login-message', 'Incorrect password!', 'error');
            return;
        }
        
        // Login successful - store user in session
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        
        // Show success message
        showMessage('login-message', 'Login successful! Redirecting...', 'success');
        
        // Redirect to dashboard after 1 second
        setTimeout(() => {
            if (user.isAdmin) {
                window.location.href = 'admin-dashboard.html';
            } else {
                window.location.href = 'dashboard.html';
            }
        }, 1000);
    } catch (error) {
        showMessage('login-message', 'Login failed. Please try again.', 'error');
        console.error(error);
    }
});

// Check if user is already logged in
window.addEventListener('DOMContentLoaded', function() {
    const currentUser = sessionStorage.getItem('currentUser');
    if (currentUser) {
        const user = JSON.parse(currentUser);
        if (user.isAdmin) {
            window.location.href = 'admin-dashboard.html';
        } else {
            window.location.href = 'dashboard.html';
        }
    }
});
