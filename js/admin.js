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

// Check admin authentication
async function checkAdminAuth() {
    const currentUser = sessionStorage.getItem('currentUser');
    if (!currentUser) {
        window.location.href = 'index.html';
        return null;
    }
    
    try {
        const user = JSON.parse(currentUser);
        
        if (!user.isAdmin) {
            window.location.href = 'dashboard.html';
            return null;
        }
        
        // Get latest user data
        const users = await getFile('data/users.json');
        const latestUser = users.find(u => u.userId === user.userId);
        
        if (!latestUser || !latestUser.isAdmin) {
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

// Load all data
async function loadAllData() {
    const admin = await checkAdminAuth();
    if (!admin) return;
    
    // Load users
    await loadUsers();
    
    // Load pending friends
    await loadPendingFriends();
    
    // Load withdrawal requests
    await loadWithdrawalRequests();
}

// Load users
async function loadUsers() {
    try {
        const users = await getFile('data/users.json');
        const tableBody = document.getElementById('users-table-body');
        tableBody.innerHTML = '';
        
        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.username} ${user.isAdmin ? '<i class="fas fa-crown" style="color: var(--warning); margin-left: 5px;"></i>' : ''}</td>
                <td>${user.userId}</td>
                <td>${user.fullName}</td>
                <td>Rs. ${user.balance}</td>
                <td>${user.verifiedFriends}/${user.totalFriends}</td>
                <td>${user.level}</td>
                <td>${new Date(user.joined).toLocaleDateString()}</td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Failed to load users:', error);
    }
}

// Load pending friends
async function loadPendingFriends() {
    try {
        const allFriends = await getFile('data/all_friends.json');
        const pendingFriends = allFriends.filter(friend => friend.status === 'pending');
        
        const tableBody = document.getElementById('friends-table-body');
        tableBody.innerHTML = '';
        
        pendingFriends.forEach((friend, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${friend.name}</td>
                <td>${friend.addedByUsername}</td>
                <td>${friend.addedBy}</td>
                <td>${friend.password}</td>
                <td>${friend.whatsapp || 'N/A'}</td>
                <td><span class="status-badge status-pending">${friend.status}</span></td>
                <td>${new Date(friend.addedAt).toLocaleDateString()}</td>
                <td class="action-btns">
                    <button class="btn-verify" onclick="verifyFriend('${friend.id}')">Verify</button>
                    <button class="btn-decline" onclick="declineFriend('${friend.id}')">Decline</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
        
        if (pendingFriends.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="8" style="text-align: center; color: var(--text-muted);">No pending friends</td>`;
            tableBody.appendChild(row);
        }
    } catch (error) {
        console.error('Failed to load friends:', error);
    }
}

// Load withdrawal requests
async function loadWithdrawalRequests() {
    try {
        const allWithdrawals = await getFile('data/all_withdrawals.json');
        const pendingWithdrawals = allWithdrawals.filter(w => w.status === 'pending');
        
        const tableBody = document.getElementById('withdrawals-table-body');
        tableBody.innerHTML = '';
        
        pendingWithdrawals.forEach((withdrawal, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${withdrawal.username} (${withdrawal.userId})</td>
                <td>Rs. ${withdrawal.amount}</td>
                <td>${withdrawal.method}</td>
                <td>${withdrawal.accountTitle} (${withdrawal.accountNumber})</td>
                <td><span class="status-badge status-${withdrawal.status}">${withdrawal.status}</span></td>
                <td>${new Date(withdrawal.requestedAt).toLocaleDateString()}</td>
                <td class="action-btns">
                    <button class="btn-verify" onclick="approveWithdrawal('${withdrawal.id}')">Approve</button>
                    <button class="btn-decline" onclick="declineWithdrawal('${withdrawal.id}')">Decline</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
        
        if (pendingWithdrawals.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="7" style="text-align: center; color: var(--text-muted);">No pending withdrawals</td>`;
            tableBody.appendChild(row);
        }
    } catch (error) {
        console.error('Failed to load withdrawals:', error);
    }
}

// Verify friend
window.verifyFriend = async function(friendId) {
    try {
        const allFriends = await getFile('data/all_friends.json');
        const friendIndex = allFriends.findIndex(f => f.id === friendId);
        
        if (friendIndex === -1) return;
        
        const friend = allFriends[friendIndex];
        friend.status = 'verified';
        friend.verifiedAt = new Date().toISOString();
        friend.verifiedBy = JSON.parse(sessionStorage.getItem('currentUser')).userId;
        
        // Calculate earnings based on friend count
        const users = await getFile('data/users.json');
        const userIndex = users.findIndex(u => u.userId === friend.addedBy);
        
        if (userIndex !== -1) {
            users[userIndex].verifiedFriends++;
            users[userIndex].pendingFriends--;
            
            // Calculate rate based on verified friends count
            let rate = 90;
            const verifiedCount = users[userIndex].verifiedFriends;
            
            if (verifiedCount >= 100) rate = 150;
            else if (verifiedCount >= 51) rate = 130;
            else if (verifiedCount >= 31) rate = 110;
            else if (verifiedCount >= 21) rate = 100;
            
            // Add earnings
            users[userIndex].balance += rate;
            
            // Update user level
            if (verifiedCount >= 100) users[userIndex].level = 5;
            else if (verifiedCount >= 50) users[userIndex].level = 4;
            else if (verifiedCount >= 30) users[userIndex].level = 3;
            else if (verifiedCount >= 10) users[userIndex].level = 2;
            
            await updateFile('data/users.json', users, `Friend verified for user ${users[userIndex].username}`);
            
            // Update user's specific file
            const userDataPath = `data/users/${friend.addedBy}.json`;
            const userData = await getFile(userDataPath);
            const userFriendIndex = userData.friends.findIndex(f => f.id === friendId);
            
            if (userFriendIndex !== -1) {
                userData.friends[userFriendIndex] = friend;
                await createOrUpdateFile(userDataPath, userData, `Friend verified: ${friend.name}`);
            }
        }
        
        // Update all friends file
        allFriends[friendIndex] = friend;
        await createOrUpdateFile('data/all_friends.json', allFriends, `Friend verified: ${friend.name}`);
        
        alert(`Friend ${friend.name} verified successfully! User earned Rs. ${rate}`);
        
        // Reload data
        await loadPendingFriends();
        await loadUsers();
        
    } catch (error) {
        console.error('Failed to verify friend:', error);
        alert('Failed to verify friend. Please try again.');
    }
};

// Decline friend
window.declineFriend = async function(friendId) {
    try {
        const allFriends = await getFile('data/all_friends.json');
        const friendIndex = allFriends.findIndex(f => f.id === friendId);
        
        if (friendIndex === -1) return;
        
        const friend = allFriends[friendIndex];
        friend.status = 'declined';
        friend.declinedAt = new Date().toISOString();
        friend.declinedBy = JSON.parse(sessionStorage.getItem('currentUser')).userId;
        
        // Update user stats
        const users = await getFile('data/users.json');
        const userIndex = users.findIndex(u => u.userId === friend.addedBy);
        
        if (userIndex !== -1) {
            users[userIndex].declinedFriends++;
            users[userIndex].pendingFriends--;
            
            await updateFile('data/users.json', users, `Friend declined for user ${users[userIndex].username}`);
            
            // Update user's specific file
            const userDataPath = `data/users/${friend.addedBy}.json`;
            const userData = await getFile(userDataPath);
            const userFriendIndex = userData.friends.findIndex(f => f.id === friendId);
            
            if (userFriendIndex !== -1) {
                userData.friends[userFriendIndex] = friend;
                await createOrUpdateFile(userDataPath, userData, `Friend declined: ${friend.name}`);
            }
        }
        
        // Update all friends file
        allFriends[friendIndex] = friend;
        await createOrUpdateFile('data/all_friends.json', allFriends, `Friend declined: ${friend.name}`);
        
        alert(`Friend ${friend.name} declined.`);
        
        // Reload data
        await loadPendingFriends();
        await loadUsers();
        
    } catch (error) {
        console.error('Failed to decline friend:', error);
        alert('Failed to decline friend. Please try again.');
    }
};

// Approve withdrawal
window.approveWithdrawal = async function(withdrawalId) {
    try {
        const allWithdrawals = await getFile('data/all_withdrawals.json');
        const withdrawalIndex = allWithdrawals.findIndex(w => w.id === withdrawalId);
        
        if (withdrawalIndex === -1) return;
        
        const withdrawal = allWithdrawals[withdrawalIndex];
        withdrawal.status = 'approved';
        withdrawal.processedAt = new Date().toISOString();
        withdrawal.processedBy = JSON.parse(sessionStorage.getItem('currentUser')).userId;
        withdrawal.notes = 'Payment will be sent within 72 hours';
        
        // Deduct balance from user
        const users = await getFile('data/users.json');
        const userIndex = users.findIndex(u => u.userId === withdrawal.userId);
        
        if (userIndex !== -1) {
            if (users[userIndex].balance < withdrawal.amount) {
                alert('User does not have sufficient balance!');
                return;
            }
            
            users[userIndex].balance -= withdrawal.amount;
            
            await updateFile('data/users.json', users, `Withdrawal approved for ${users[userIndex].username}`);
            
            // Update user's specific file
            const userDataPath = `data/users/${withdrawal.userId}.json`;
            const userData = await getFile(userDataPath);
            const userWithdrawalIndex = userData.withdrawals.findIndex(w => w.id === withdrawalId);
            
            if (userWithdrawalIndex !== -1) {
                userData.withdrawals[userWithdrawalIndex] = withdrawal;
                await createOrUpdateFile(userDataPath, userData, `Withdrawal approved: Rs. ${withdrawal.amount}`);
            }
        }
        
        // Update all withdrawals file
        allWithdrawals[withdrawalIndex] = withdrawal;
        await createOrUpdateFile('data/all_withdrawals.json', allWithdrawals, `Withdrawal approved: ${withdrawal.username}`);
        
        alert(`Withdrawal of Rs. ${withdrawal.amount} approved for ${withdrawal.username}`);
        
        // Reload data
        await loadWithdrawalRequests();
        await loadUsers();
        
    } catch (error) {
        console.error('Failed to approve withdrawal:', error);
        alert('Failed to approve withdrawal. Please try again.');
    }
};

// Decline withdrawal
window.declineWithdrawal = async function(withdrawalId) {
    const reason = prompt('Please enter reason for declining:');
    if (!reason) return;
    
    try {
        const allWithdrawals = await getFile('data/all_withdrawals.json');
        const withdrawalIndex = allWithdrawals.findIndex(w => w.id === withdrawalId);
        
        if (withdrawalIndex === -1) return;
        
        const withdrawal = allWithdrawals[withdrawalIndex];
        withdrawal.status = 'declined';
        withdrawal.processedAt = new Date().toISOString();
        withdrawal.processedBy = JSON.parse(sessionStorage.getItem('currentUser')).userId;
        withdrawal.notes = reason;
        
        // Update user's specific file
        const userDataPath = `data/users/${withdrawal.userId}.json`;
        const userData = await getFile(userDataPath);
        const userWithdrawalIndex = userData.withdrawals.findIndex(w => w.id === withdrawalId);
        
        if (userWithdrawalIndex !== -1) {
            userData.withdrawals[userWithdrawalIndex] = withdrawal;
            await createOrUpdateFile(userDataPath, userData, `Withdrawal declined: Rs. ${withdrawal.amount}`);
        }
        
        // Update all withdrawals file
        allWithdrawals[withdrawalIndex] = withdrawal;
        await createOrUpdateFile('data/all_withdrawals.json', allWithdrawals, `Withdrawal declined: ${withdrawal.username}`);
        
        alert(`Withdrawal declined for ${withdrawal.username}`);
        
        // Reload data
        await loadWithdrawalRequests();
        
    } catch (error) {
        console.error('Failed to decline withdrawal:', error);
        alert('Failed to decline withdrawal. Please try again.');
    }
};

// Tab switching
document.getElementById('view-users-btn').addEventListener('click', function() {
    document.getElementById('users-table').classList.remove('hidden');
    document.getElementById('friends-table').classList.add('hidden');
    document.getElementById('withdrawals-table').classList.add('hidden');
});

document.getElementById('view-friends-btn').addEventListener('click', function() {
    document.getElementById('users-table').classList.add('hidden');
    document.getElementById('friends-table').classList.remove('hidden');
    document.getElementById('withdrawals-table').classList.add('hidden');
});

document.getElementById('view-withdrawals-btn').addEventListener('click', function() {
    document.getElementById('users-table').classList.add('hidden');
    document.getElementById('friends-table').classList.add('hidden');
    document.getElementById('withdrawals-table').classList.remove('hidden');
});

// Back to user dashboard
document.getElementById('back-dashboard-btn').addEventListener('click', function() {
    window.location.href = 'dashboard.html';
});

// Logout
document.getElementById('logout-btn').addEventListener('click', function() {
    sessionStorage.removeItem('currentUser');
    window.location.href = 'index.html';
});

// Initialize admin dashboard
window.addEventListener('DOMContentLoaded', async function() {
    await loadAllData();
    
    // Set up auto-refresh every 30 seconds
    setInterval(async () => {
        await loadAllData();
    }, 30000);
});
