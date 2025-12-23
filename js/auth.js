// GitHub API Configuration
// For production, these should be set as environment variables in Vercel
const GITHUB_CONFIG = {
    REPO: 'username/reponame', // Change this to your GitHub repo
    OWNER: 'username' // Change this to your GitHub username
};

// Show message
function showMessage(elementId, message, type) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.className = `message ${type}`;
        element.classList.remove('hidden');
        
        setTimeout(() => {
            element.classList.add('hidden');
        }, 5000);
    }
}

// Generate 8-digit user ID
function generateUserId() {
    return Math.floor(10000000 + Math.random() * 90000000).toString();
}

// Format date for display
function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
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
    
    if (username.length < 3) {
        showMessage('signup-message', 'Username must be at least 3 characters!', 'error');
        return;
    }
    
    if (!whatsapp || whatsapp.length < 10) {
        showMessage('signup-message', 'Please enter a valid WhatsApp number!', 'error');
        return;
    }
    
    try {
        // Create user object
        const userId = generateUserId();
        const newUser = {
            id: userId,
            userId: userId,
            username: username.toLowerCase(),
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
            joined: new Date().toISOString(),
            lastLogin: new Date().toISOString()
        };
        
        // Get existing users from localStorage (for demo)
        // In production, this would be replaced with GitHub API call
        let users = [];
        const storedUsers = localStorage.getItem('kidwallet_users');
        if (storedUsers) {
            users = JSON.parse(storedUsers);
        }
        
        // Check if username already exists
        if (users.find(u => u.username === username.toLowerCase())) {
            showMessage('signup-message', 'Username already exists!', 'error');
            return;
        }
        
        // Check if user ID already exists (very unlikely but possible)
        if (users.find(u => u.userId === userId)) {
            showMessage('signup-message', 'User ID conflict. Please try again!', 'error');
            return;
        }
        
        // Add new user
        users.push(newUser);
        localStorage.setItem('kidwallet_users', JSON.stringify(users));
        
        // Create user-specific data file
        const userData = {
            user: newUser,
            friends: [],
            withdrawals: [],
            activities: [{
                type: 'account_created',
                date: new Date().toISOString(),
                message: 'Account created successfully'
            }]
        };
        localStorage.setItem(`kidwallet_user_${userId}`, JSON.stringify(userData));
        
        // Create admin if first user
        if (users.length === 1) {
            newUser.isAdmin = true;
            users[0] = newUser;
            localStorage.setItem('kidwallet_users', JSON.stringify(users));
        }
        
        // Show success message
        showMessage('signup-message', `🎉 Account created successfully! Your User ID: ${userId}`, 'success');
        
        // Clear form
        document.getElementById('signup-form').reset();
        
        // Switch to login tab after 3 seconds
        setTimeout(() => {
            document.getElementById('login-tab').click();
            document.getElementById('login-identifier').value = username;
        }, 3000);
        
    } catch (error) {
        console.error('Signup error:', error);
        showMessage('signup-message', 'Failed to create account. Please try again.', 'error');
    }
});

// Handle login
document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const identifier = document.getElementById('login-identifier').value.trim();
    const password = document.getElementById('login-password').value;
    
    // Get users from localStorage
    const storedUsers = localStorage.getItem('kidwallet_users');
    if (!storedUsers) {
        showMessage('login-message', 'No users found. Please sign up first!', 'error');
        return;
    }
    
    const users = JSON.parse(storedUsers);
    
    // Find user by username or userId
    const user = users.find(u => 
        u.username === identifier.toLowerCase() || u.userId === identifier
    );
    
    if (!user) {
        showMessage('login-message', 'User not found!', 'error');
        return;
    }
    
    if (user.password !== password) {
        showMessage('login-message', 'Incorrect password!', 'error');
        return;
    }
    
    // Update last login
    user.lastLogin = new Date().toISOString();
    const userIndex = users.findIndex(u => u.userId === user.userId);
    if (userIndex !== -1) {
        users[userIndex] = user;
        localStorage.setItem('kidwallet_users', JSON.stringify(users));
    }
    
    // Update user's data file
    const userDataStr = localStorage.getItem(`kidwallet_user_${user.userId}`);
    if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        userData.user = user;
        userData.activities.push({
            type: 'login',
            date: new Date().toISOString(),
            message: 'User logged in'
        });
        localStorage.setItem(`kidwallet_user_${user.userId}`, JSON.stringify(userData));
    }
    
    // Login successful - store user in session
    sessionStorage.setItem('currentUser', JSON.stringify(user));
    
    // Show success message
    showMessage('login-message', '✅ Login successful! Redirecting...', 'success');
    
    // Redirect to dashboard after 1 second
    setTimeout(() => {
        if (user.isAdmin) {
            window.location.href = 'admin-dashboard.html';
        } else {
            window.location.href = 'dashboard.html';
        }
    }, 1000);
});

// Initialize data on load
window.addEventListener('DOMContentLoaded', function() {
    // Check if user is already logged in
    const currentUser = sessionStorage.getItem('currentUser');
    if (currentUser) {
        const user = JSON.parse(currentUser);
        if (user.isAdmin) {
            window.location.href = 'admin-dashboard.html';
        } else {
            window.location.href = 'dashboard.html';
        }
        return;
    }
    
    // Initialize with sample admin if no users exist
    const storedUsers = localStorage.getItem('kidwallet_users');
    if (!storedUsers) {
        const adminUserId = '00000000';
        const adminUser = {
            id: adminUserId,
            userId: adminUserId,
            username: 'admin',
            password: 'admin123',
            fullName: 'Administrator',
            whatsapp: '03001234567',
            balance: 0,
            level: 10,
            totalFriends: 0,
            verifiedFriends: 0,
            pendingFriends: 0,
            declinedFriends: 0,
            isAdmin: true,
            joined: new Date().toISOString(),
            lastLogin: new Date().toISOString()
        };
        
        const users = [adminUser];
        localStorage.setItem('kidwallet_users', JSON.stringify(users));
        
        // Create admin user data file
        const adminData = {
            user: adminUser,
            friends: [],
            withdrawals: [],
            activities: [{
                type: 'account_created',
                date: new Date().toISOString(),
                message: 'Admin account created'
            }]
        };
        localStorage.setItem(`kidwallet_user_${adminUserId}`, JSON.stringify(adminData));
        
        // Initialize other data files if they don't exist
        if (!localStorage.getItem('kidwallet_all_friends')) {
            localStorage.setItem('kidwallet_all_friends', JSON.stringify([]));
        }
        
        if (!localStorage.getItem('kidwallet_all_withdrawals')) {
            localStorage.setItem('kidwallet_all_withdrawals', JSON.stringify([]));
        }
        
        console.log('Initialized with admin user:', adminUser);
    }
});
