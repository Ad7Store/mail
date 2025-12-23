// Dashboard JavaScript
document.addEventListener('DOMContentLoaded', async function() {
    await loadDashboard();
});

// Check authentication
function checkAuth() {
    const currentUser = sessionStorage.getItem('currentUser');
    if (!currentUser) {
        window.location.href = 'index.html';
        return null;
    }
    
    try {
        const user = JSON.parse(currentUser);
        
        // Verify user exists in storage
        const storedUsers = localStorage.getItem('kidwallet_users');
        if (!storedUsers) {
            sessionStorage.removeItem('currentUser');
            window.location.href = 'index.html';
            return null;
        }
        
        const users = JSON.parse(storedUsers);
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
        sessionStorage.removeItem('currentUser');
        window.location.href = 'index.html';
        return null;
    }
}

// Load dashboard data
async function loadDashboard() {
    const user = checkAuth();
    if (!user) return;
    
    // Update dashboard with user data
    document.getElementById('welcome-user').textContent = `Welcome, ${user.fullName}!`;
    document.getElementById('user-id-display').textContent = user.userId;
    document.getElementById('balance-amount').textContent = user.balance.toLocaleString();
    document.getElementById('user-level').textContent = user.level;
    document.getElementById('total-friends').textContent = user.totalFriends;
    document.getElementById('verified-friends').textContent = user.verifiedFriends;
    document.getElementById('pending-friends').textContent = user.pendingFriends;
    document.getElementById('declined-friends').textContent = user.declinedFriends;
    
    // Calculate next level progress
    const levelProgress = calculateLevelProgress(user);
    updateLevelProgress(levelProgress);
    
    // Show admin button if user is admin
    if (user.isAdmin) {
        document.getElementById('admin-btn').classList.remove('hidden');
    }
}

// Calculate level progress
function calculateLevelProgress(user) {
    const levelThresholds = {
        1: 0,
        2: 10,
        3: 30,
        4: 50,
        5: 100
    };
    
    const currentLevel = user.level;
    const nextLevel = currentLevel < 5 ? currentLevel + 1 : 5;
    const currentThreshold = levelThresholds[currentLevel];
    const nextThreshold = levelThresholds[nextLevel];
    
    const progress = user.verifiedFriends - currentThreshold;
    const totalNeeded = nextThreshold - currentThreshold;
    const percentage = Math.min(100, (progress / totalNeeded) * 100);
    
    return {
        currentLevel,
        nextLevel,
        progress,
        totalNeeded,
        percentage,
        currentFriends: user.verifiedFriends,
        nextLevelFriends: nextThreshold
    };
}

// Update level progress display
function updateLevelProgress(progress) {
    // You can add a progress bar element to your dashboard.html
    // For now, just log it
    console.log('Level Progress:', progress);
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
document.getElementById('admin-btn')?.addEventListener('click', function() {
    window.location.href = 'admin-dashboard.html';
});

// Support button
document.getElementById('support-btn')?.addEventListener('click', function() {
    window.location.href = 'mailto:dripmobiles@gmail.com';
});

// Add notification system
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close">&times;</button>
    `;
    
    // Add styles if not already added
    if (!document.querySelector('#notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: var(--dark-card);
                border-left: 4px solid var(--primary);
                padding: 15px 20px;
                border-radius: 8px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: space-between;
                min-width: 300px;
                max-width: 400px;
                z-index: 1000;
                animation: slideInRight 0.3s ease-out;
            }
            
            .notification-success {
                border-left-color: var(--success);
            }
            
            .notification-error {
                border-left-color: var(--error);
            }
            
            .notification-warning {
                border-left-color: var(--warning);
            }
            
            .notification-content {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .notification-close {
                background: none;
                border: none;
                color: var(--text-muted);
                font-size: 1.2rem;
                cursor: pointer;
                padding: 0;
                margin-left: 10px;
            }
            
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(styles);
    }
    
    // Add to body
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out forwards';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
    
    // Add close button functionality
    notification.querySelector('.notification-close').addEventListener('click', function() {
        notification.style.animation = 'slideOutRight 0.3s ease-out forwards';
        setTimeout(() => notification.remove(), 300);
    });
    
    // Add slideOutRight animation
    if (!document.querySelector('#slideOutRight')) {
        const slideOutStyle = document.createElement('style');
        slideOutStyle.id = 'slideOutRight';
        slideOutStyle.textContent = `
            @keyframes slideOutRight {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(slideOutStyle);
    }
}

// Update dashboard periodically
setInterval(async () => {
    const user = await checkAuth();
    if (user) {
        await loadDashboard();
    }
}, 30000); // Update every 30 seconds
