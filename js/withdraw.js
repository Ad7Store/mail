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

async function getFile(path) {
    try {
        const file = await githubRequest(`/repos/${GITHUB_REPO}/contents/${path}`);
        const content = JSON.parse(atob(file.content));
        return content;
    } catch (error) {
        return [];
    }
}

async function createOrUpdateFile(path, content, message) {
    try {
        let sha = null;
        try {
            const file = await githubRequest(`/repos/${GITHUB_REPO}/contents/${path}`);
            sha = file.sha;
        } catch (error) {
            // File doesn't exist
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

async function updateFile(path, content, message) {
    try {
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
        const users = await getFile('data/users.json');
        const latestUser = users.find(u => u.userId === user.userId);
        
        if (!latestUser) {
            sessionStorage.removeItem('currentUser');
            window.location.href = 'index.html';
            return null;
        }
        
        sessionStorage.setItem('currentUser', JSON.stringify(latestUser));
        return latestUser;
    } catch (error) {
        window.location.href = 'index.html';
        return null;
    }
}

// Load user data and withdrawals
async function loadUserData() {
    const user = await checkAuth();
    if (!user) return;
    
    // Update user info
    document.getElementById('current-user-id').textContent = `User ID: ${user.userId}`;
    document.getElementById('balance-amount').textContent = user.balance;
    document.getElementById('user-balance').textContent = `Rs. ${user.balance}`;
    document.getElementById('verified-friends').textContent = user.verifiedFriends;
    
    // Check eligibility
    const isEligible = user.balance >= 1550 && user.verifiedFriends > 10;
    const statusElement = document.getElementById('withdrawal-status');
    statusElement.textContent = isEligible ? 'Eligible' : 'Not Eligible';
    statusElement.style.color = isEligible ? 'var(--success)' : 'var(--error)';
    
    // Set max withdrawal amount
    const amountInput = document.getElementById('withdraw-amount');
    amountInput.max = user.balance;
    amountInput.value = Math.max(1550, user.balance);
    
    // Load withdrawal history
    try {
        const userData = await getFile(`data/users/${user.userId}.json`);
        const withdrawals = userData.withdrawals || [];
        
        const withdrawalsList = document.getElementById('withdrawals-list');
        withdrawalsList.innerHTML = '';
        
        if (withdrawals.length === 0) {
            withdrawalsList.innerHTML = '<p style="color: var(--text-muted); text-align: center;">No withdrawal requests yet</p>';
        } else {
            const recentWithdrawals = withdrawals.slice(-5).reverse();
            
            recentWithdrawals.forEach(withdrawal => {
                const withdrawalElement = document.createElement('div');
                withdrawalElement.className = 'rate-item';
                withdrawalElement.style.marginBottom = '10px';
                withdrawalElement.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span>Rs. ${withdrawal.amount} via ${withdrawal.method}</span>
                        <span class="status-${withdrawal.status}">${withdrawal.status}</span>
                    </div>
                    <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 5px;">
                        Requested: ${new Date(withdrawal.requestedAt).toLocaleDateString()}
                        ${withdrawal.processedAt ? ` | Processed: ${new Date(withdrawal.processedAt).toLocaleDateString()}` : ''}
                    </div>
                    ${withdrawal.notes ? `<div style="font-size: 0.8rem; margin-top: 5px;">${withdrawal.notes}</div>` : ''}
                `;
                withdrawalsList.appendChild(withdrawalElement);
            });
        }
    } catch (error) {
        console.error('Failed to load withdrawals:', error);
    }
}

// Handle withdrawal form
document.getElementById('withdraw-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const method = document.getElementById('withdraw-method').value;
    const accountNumber = document.getElementById('account-number').value.trim();
    const accountTitle = document.getElementById('account-title').value.trim();
    const amount = parseInt(document.getElementById('withdraw-amount').value);
    
    const user = await checkAuth();
    if (!user) return;
    
    // Validate inputs
    if (!method || !accountNumber || !accountTitle || !amount) {
        showMessage('withdraw-message', 'Please fill in all fields!', 'error');
        return;
    }
    
    // Check rules
    if (user.balance < 1550) {
        showMessage('withdraw-message', 'Withdrawal failed! Balance must be at least Rs. 1550.', 'error');
        return;
    }
    
    if (user.verifiedFriends < 10) {
        showMessage('withdraw-message', 'Withdrawal failed! You need at least 10 verified friends.', 'error');
        return;
    }
    
    if (amount < 1550) {
        showMessage('withdraw-message', 'Withdrawal failed! Minimum withdrawal is Rs. 1550.', 'error');
        return;
    }
    
    if (amount > user.balance) {
        showMessage('withdraw-message', 'Withdrawal failed! Amount exceeds your balance.', 'error');
        return;
    }
    
    try {
        // Create withdrawal object
        const newWithdrawal = {
            id: Date.now().toString(),
            userId: user.userId,
            username: user.username,
            amount: amount,
            method: method,
            accountNumber: accountNumber,
            accountTitle: accountTitle,
            status: 'pending',
            requestedAt: new Date().toISOString()
        };
        
        // Update user's data file
        const userDataPath = `data/users/${user.userId}.json`;
        let userData = await getFile(userDataPath);
        
        if (!userData.withdrawals) userData.withdrawals = [];
        userData.withdrawals.push(newWithdrawal);
        
        // Update user's balance in main users file
        const users = await getFile('data/users.json');
        const userIndex = users.findIndex(u => u.userId === user.userId);
        
        if (userIndex !== -1) {
            // Don't deduct balance yet - wait for admin approval
            // users[userIndex].balance -= amount;
            
            await updateFile('data/users.json', users, `Withdrawal request by ${user.username}`);
            
            // Update session storage
            sessionStorage.setItem('currentUser', JSON.stringify(users[userIndex]));
        }
        
        // Update user's data file
        await createOrUpdateFile(userDataPath, userData, `Withdrawal request: Rs. ${amount}`);
        
        // Add to global withdrawals file for admin access
        const allWithdrawals = await getFile('data/all_withdrawals.json');
        allWithdrawals.push(newWithdrawal);
        await createOrUpdateFile('data/all_withdrawals.json', allWithdrawals, `New withdrawal request by ${user.username}`);
        
        showMessage('withdraw-message', 'Withdrawal request submitted! You will receive payment within 72 hours.', 'success');
        
        // Reset form
        document.getElementById('withdraw-form').reset();
        
        // Reload data
        setTimeout(() => {
            loadUserData();
        }, 1000);
        
    } catch (error) {
        console.error('Failed to submit withdrawal:', error);
        showMessage('withdraw-message', 'Failed to submit withdrawal. Please try again.', 'error');
    }
});

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

// Back button
document.getElementById('back-btn').addEventListener('click', function() {
    window.location.href = 'dashboard.html';
});

// Initialize page
window.addEventListener('DOMContentLoaded', async function() {
    await loadUserData();
});
