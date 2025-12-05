// Global variables
let currentAdmin = null;
let allBookings = [];
let allUsers = [];
let bookingsListener = null;

// Check if user is admin
async function checkAdminAccess() {
    const user = auth.currentUser;
    console.log('Checking admin access for user:', user ? user.uid : 'No user');
    
    if (!user) {
        console.log('No current user');
        return false;
    }
    
    try {
        console.log('Fetching user document from Firestore...');
        const userDoc = await db.collection('users').doc(user.uid).get();
        
        if (userDoc.exists) {
            const userData = userDoc.data();
            console.log('User data:', userData);
            console.log('User role:', userData.role);
            return userData.role === 'admin';
        } else {
            console.log('User document does not exist');
        }
    } catch (error) {
        console.error('Error checking admin access:', error);
    }
    
    return false;
}

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeAdminPanel();
    setupEventListeners();
});

function initializeAdminPanel() {
    console.log('Initializing admin panel...');
    
    // Prevent auth state observer from running on admin page
    // Load dashboard data immediately
    setTimeout(() => {
        loadDashboardData();
        loadAllBookings();
        loadAllUsers();
        setupRealtimeListeners();
    }, 500);
}

function setupEventListeners() {
    // Admin login form
    const adminLoginForm = document.getElementById('adminLoginForm');
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', handleAdminLogin);
    }
    
    // Update status form
    const updateStatusForm = document.getElementById('updateStatusForm');
    if (updateStatusForm) {
        updateStatusForm.addEventListener('submit', handleStatusUpdate);
    }
    
    // Settings forms
    const serviceSettings = document.getElementById('serviceSettings');
    if (serviceSettings) {
        serviceSettings.addEventListener('submit', handleServiceSettings);
    }
    
    const notificationSettings = document.getElementById('notificationSettings');
    if (notificationSettings) {
        notificationSettings.addEventListener('submit', handleNotificationSettings);
    }
}

// Admin Authentication
// Remove admin login form - users will login from main site
// Admin access is determined by role in Firestore

function showAdminDashboard() {
    console.log('Showing admin dashboard');
    
    // Hide loading screen
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.style.display = 'none';
    }
    
    // Show admin dashboard
    const adminDashboard = document.getElementById('adminDashboard');
    if (adminDashboard) {
        adminDashboard.style.display = 'flex';
        
        // Load dashboard data
        loadDashboardData();
        loadAllBookings();
        loadAllUsers();
        
        // Set up real-time listeners
        setupRealtimeListeners();
    } else {
        console.error('Admin dashboard element not found');
    }
}

async function handleAdminLogout() {
    try {
        await auth.signOut();
        
        // Clean up listeners
        if (bookingsListener) {
            bookingsListener();
            bookingsListener = null;
        }
        
        // Redirect to main website
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout error:', error);
        showMessage('Logout failed', 'error');
    }
}

// Dashboard Functions
async function loadDashboardData() {
    try {
        // Load statistics
        const bookingsResult = await getAllBookings();
        const usersResult = await getAllUsers();
        
        if (bookingsResult.success && usersResult.success) {
            const bookings = bookingsResult.bookings;
            const users = usersResult.users;
            
            // Update statistics with null checks
            const totalBookingsEl = document.getElementById('totalBookings');
            if (totalBookingsEl) totalBookingsEl.textContent = bookings.length;
            
            const totalUsersEl = document.getElementById('totalUsers');
            if (totalUsersEl) totalUsersEl.textContent = users.length;
            
            const pendingCount = bookings.filter(b => b.status === 'pending' || b.status === 'booked').length;
            const pendingBookingsEl = document.getElementById('pendingBookings');
            if (pendingBookingsEl) pendingBookingsEl.textContent = pendingCount;
            
            const today = new Date().toDateString();
            const completedToday = bookings.filter(b => {
                const bookingDate = b.createdAt?.toDate?.()?.toDateString() || new Date(b.createdAt).toDateString();
                return b.status === 'completed' && bookingDate === today;
            }).length;
            const completedBookingsEl = document.getElementById('completedBookings');
            if (completedBookingsEl) completedBookingsEl.textContent = completedToday;
            
            // Load recent bookings
            displayRecentBookings(bookings.slice(0, 5));
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showMessage('Error loading dashboard data', 'error');
    }
}

function displayRecentBookings(bookings) {
    const container = document.getElementById('recentBookings');
    if (!container) return;
    
    if (bookings.length === 0) {
        container.innerHTML = '<p>No recent bookings found.</p>';
        return;
    }
    
    const bookingsHTML = bookings.map(booking => `
        <div class="activity-item">
            <div>
                <strong>${booking.patientName}</strong> - ${booking.emergencyType}
                <br>
                <small>${formatDate(booking.createdAt)}</small>
            </div>
            <span class="status-badge status-${booking.status}">${booking.status.toUpperCase()}</span>
        </div>
    `).join('');
    
    container.innerHTML = bookingsHTML;
}

// Bookings Management
async function loadAllBookings() {
    try {
        const result = await getAllBookings();
        if (result.success) {
            allBookings = result.bookings;
            displayBookings(allBookings);
        }
    } catch (error) {
        console.error('Error loading bookings:', error);
        showMessage('Error loading bookings', 'error');
    }
}

function displayBookings(bookings) {
    const tbody = document.getElementById('bookingsTableBody');
    if (!tbody) return;
    
    if (bookings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">No bookings found</td></tr>';
        return;
    }
    
    const bookingsHTML = bookings.map(booking => `
        <tr>
            <td><strong>${booking.bookingId}</strong></td>
            <td>${booking.patientName}</td>
            <td>${booking.contactNumber}</td>
            <td>${booking.pickupAddress}</td>
            <td>${booking.emergencyType}</td>
            <td><span class="status-badge status-${booking.status}">${booking.status.toUpperCase()}</span></td>
            <td>${formatDate(booking.createdAt)}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn btn-view" onclick="viewBookingDetails('${booking.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn btn-edit" onclick="updateBookingStatus('${booking.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
    
    tbody.innerHTML = bookingsHTML;
}

function filterBookings() {
    const statusFilter = document.getElementById('statusFilter').value;
    
    let filteredBookings = allBookings;
    if (statusFilter) {
        filteredBookings = allBookings.filter(booking => booking.status === statusFilter);
    }
    
    displayBookings(filteredBookings);
}

function refreshBookings() {
    loadAllBookings();
    showMessage('Bookings refreshed!', 'success');
}

function viewBookingDetails(bookingId) {
    const booking = allBookings.find(b => b.id === bookingId);
    if (!booking) return;
    
    const content = document.getElementById('bookingDetailsContent');
    content.innerHTML = `
        <div class="booking-details">
            <div class="detail-row">
                <strong>Booking ID:</strong> ${booking.bookingId}
            </div>
            <div class="detail-row">
                <strong>Patient Name:</strong> ${booking.patientName}
            </div>
            <div class="detail-row">
                <strong>Contact Number:</strong> ${booking.contactNumber}
            </div>
            <div class="detail-row">
                <strong>User Email:</strong> ${booking.userEmail}
            </div>
            <div class="detail-row">
                <strong>Pickup Address:</strong> ${booking.pickupAddress}
            </div>
            <div class="detail-row">
                <strong>Destination:</strong> ${booking.destination}
            </div>
            <div class="detail-row">
                <strong>Emergency Type:</strong> ${booking.emergencyType}
            </div>
            <div class="detail-row">
                <strong>Status:</strong> <span class="status-badge status-${booking.status}">${booking.status.toUpperCase()}</span>
            </div>
            <div class="detail-row">
                <strong>Created At:</strong> ${formatDate(booking.createdAt)}
            </div>
            ${booking.additionalInfo ? `
                <div class="detail-row">
                    <strong>Additional Information:</strong> ${booking.additionalInfo}
                </div>
            ` : ''}
        </div>
    `;
    
    showModal('bookingDetailsModal');
}

function updateBookingStatus(bookingId) {
    const booking = allBookings.find(b => b.id === bookingId);
    if (!booking) return;
    
    document.getElementById('updateBookingId').value = bookingId;
    document.getElementById('newStatus').value = booking.status;
    
    showModal('updateStatusModal');
}

async function handleStatusUpdate(e) {
    e.preventDefault();
    
    const bookingId = document.getElementById('updateBookingId').value;
    const newStatus = document.getElementById('newStatus').value;
    const notes = document.getElementById('statusNotes').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    submitBtn.innerHTML = '<span class="loading"></span> Updating...';
    submitBtn.disabled = true;
    
    try {
        // Update booking with status and notes
        const updateData = {
            status: newStatus,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        if (notes.trim()) {
            updateData.additionalNotes = notes.trim();
        }
        
        await db.collection('bookings').doc(bookingId).update(updateData);
        
        showMessage('Booking status updated successfully!', 'success');
        closeModal('updateStatusModal');
        document.getElementById('updateStatusForm').reset();
        loadAllBookings();
        loadDashboardData();
        
    } catch (error) {
        console.error('Error updating booking status:', error);
        showMessage('Error updating booking status', 'error');
    }
    
    submitBtn.innerHTML = 'Update Status';
    submitBtn.disabled = false;
}

// Users Management
async function loadAllUsers() {
    try {
        const result = await getAllUsers();
        if (result.success) {
            allUsers = result.users;
            displayUsers(allUsers);
        }
    } catch (error) {
        console.error('Error loading users:', error);
        showMessage('Error loading users', 'error');
    }
}

function displayUsers(users) {
    const tbody = document.getElementById('usersTableBody');
    
    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No users found</td></tr>';
        return;
    }
    
    const usersHTML = users.map(user => {
        const userBookings = allBookings.filter(b => b.userId === user.id).length;
        
        return `
            <tr>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${user.phone}</td>
                <td>${formatDate(user.createdAt)}</td>
                <td><strong>${userBookings}</strong></td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn btn-view" onclick="viewUserDetails('${user.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn btn-delete" onclick="deleteUser('${user.id}', '${user.name}')">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    tbody.innerHTML = usersHTML;
}

function searchUsers() {
    const searchTerm = document.getElementById('userSearch').value.toLowerCase();
    
    const filteredUsers = allUsers.filter(user => 
        user.name.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm) ||
        user.phone.includes(searchTerm)
    );
    
    displayUsers(filteredUsers);
}

function refreshUsers() {
    loadAllUsers();
    showMessage('Users refreshed!', 'success');
}

function viewUserDetails(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;
    
    const userBookings = allBookings.filter(b => b.userId === userId);
    
    alert(`User Details:\n\nName: ${user.name}\nEmail: ${user.email}\nPhone: ${user.phone}\nJoined: ${formatDate(user.createdAt)}\nTotal Bookings: ${userBookings.length}`);
}

async function deleteUser(userId, userName) {
    if (!confirm(`Are you sure you want to delete user "${userName}"?\n\nThis will also delete all their bookings and cannot be undone.`)) {
        return;
    }
    
    try {
        // Delete user's bookings first
        const userBookings = await db.collection('bookings')
            .where('userId', '==', userId)
            .get();
        
        const batch = db.batch();
        userBookings.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        // Delete user document
        batch.delete(db.collection('users').doc(userId));
        
        // Commit all deletions
        await batch.commit();
        
        showMessage(`User "${userName}" and their data deleted successfully!`, 'success');
        
        // Refresh data
        loadAllUsers();
        loadAllBookings();
        loadDashboardData();
        
    } catch (error) {
        console.error('Error deleting user:', error);
        showMessage('Error deleting user. Please try again.', 'error');
    }
}

// This function is now defined above with mobile sidebar handling

// Analytics Functions
function loadAnalytics() {
    // Status distribution
    const statusChart = document.getElementById('statusChart');
    const statusCounts = {
        pending: allBookings.filter(b => b.status === 'pending').length,
        confirmed: allBookings.filter(b => b.status === 'confirmed').length,
        completed: allBookings.filter(b => b.status === 'completed').length,
        cancelled: allBookings.filter(b => b.status === 'cancelled').length
    };
    
    statusChart.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 10px;">
            <div style="display: flex; justify-content: space-between;">
                <span>Pending:</span> <strong>${statusCounts.pending}</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
                <span>Confirmed:</span> <strong>${statusCounts.confirmed}</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
                <span>Completed:</span> <strong>${statusCounts.completed}</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
                <span>Cancelled:</span> <strong>${statusCounts.cancelled}</strong>
            </div>
        </div>
    `;
    
    // Emergency types
    const emergencyChart = document.getElementById('emergencyChart');
    const emergencyTypes = {};
    allBookings.forEach(booking => {
        emergencyTypes[booking.emergencyType] = (emergencyTypes[booking.emergencyType] || 0) + 1;
    });
    
    const emergencyHTML = Object.entries(emergencyTypes).map(([type, count]) => `
        <div style="display: flex; justify-content: space-between;">
            <span>${type}:</span> <strong>${count}</strong>
        </div>
    `).join('');
    
    emergencyChart.innerHTML = emergencyHTML || 'No data available';
    
    // Monthly bookings
    const monthlyChart = document.getElementById('monthlyChart');
    monthlyChart.innerHTML = 'Monthly booking trends would be displayed here with a proper charting library';
    
    // Response time
    const responseChart = document.getElementById('responseChart');
    responseChart.innerHTML = 'Average response time: 10-12 minutes<br>Best time: 8 minutes<br>Peak hours: 6 PM - 10 PM';
}

// Settings Functions
async function handleServiceSettings(e) {
    e.preventDefault();
    
    const settings = {
        responseTime: document.getElementById('responseTime').value,
        serviceRadius: document.getElementById('serviceRadius').value,
        emergencyNumber: document.getElementById('emergencyNumber').value
    };
    
    // Save to localStorage (in production, save to Firebase)
    localStorage.setItem('serviceSettings', JSON.stringify(settings));
    showMessage('Service settings saved successfully!', 'success');
}

async function handleNotificationSettings(e) {
    e.preventDefault();
    
    const settings = {
        emailNotifications: document.getElementById('emailNotifications').checked,
        smsNotifications: document.getElementById('smsNotifications').checked,
        pushNotifications: document.getElementById('pushNotifications').checked
    };
    
    // Save to localStorage (in production, save to Firebase)
    localStorage.setItem('notificationSettings', JSON.stringify(settings));
    showMessage('Notification settings saved successfully!', 'success');
}

// Maintenance Functions
function exportData() {
    const data = {
        bookings: allBookings,
        users: allUsers,
        exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ambulance-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    showMessage('Data exported successfully!', 'success');
}

function clearOldData() {
    if (confirm('Are you sure you want to clear old data? This action cannot be undone.')) {
        // In production, implement actual data cleanup
        showMessage('Old data cleanup initiated!', 'success');
    }
}

function systemBackup() {
    // In production, implement actual backup functionality
    showMessage('System backup initiated!', 'success');
}

// Real-time Listeners
function setupRealtimeListeners() {
    // Listen to bookings changes
    bookingsListener = listenToBookings((snapshot) => {
        const bookings = [];
        snapshot.forEach(doc => {
            bookings.push({ id: doc.id, ...doc.data() });
        });
        
        allBookings = bookings;
        displayBookings(allBookings);
        loadDashboardData();
    });
}

// Modal Functions
function showModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Utility Functions
function showMessage(message, type) {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());
    
    // Create new message
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    // Insert at the top of the main content
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.insertBefore(messageDiv, mainContent.firstChild);
    } else {
        document.body.insertBefore(messageDiv, document.body.firstChild);
    }
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}

function formatDate(timestamp) {
    if (!timestamp) return 'N/A';
    
    let date;
    if (timestamp.toDate) {
        date = timestamp.toDate();
    } else {
        date = new Date(timestamp);
    }
    
    return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Mobile sidebar toggle
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const isActive = sidebar.classList.contains('active');
    
    if (isActive) {
        sidebar.classList.remove('active');
    } else {
        sidebar.classList.add('active');
    }
    
    console.log('Sidebar toggled:', !isActive);
}

// Close sidebar when clicking outside
document.addEventListener('click', function(event) {
    const sidebar = document.getElementById('sidebar');
    const menuBtn = document.querySelector('.mobile-menu-btn');
    
    if (sidebar && sidebar.classList.contains('active')) {
        if (!sidebar.contains(event.target) && !menuBtn.contains(event.target)) {
            sidebar.classList.remove('active');
        }
    }
});

// Close sidebar when menu item is clicked on mobile
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Remove active class from all menu items
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(sectionName).classList.add('active');
    
    // Add active class to clicked menu item
    event.target.classList.add('active');
    
    // Close sidebar on mobile
    if (window.innerWidth <= 768) {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.remove('active');
    }
    
    // Load section-specific data
    if (sectionName === 'analytics') {
        loadAnalytics();
    } else if (sectionName === 'makeAdmin') {
        loadAdminsList();
    }
}

// Make user admin
async function makeUserAdmin() {
    const email = document.getElementById('adminUserEmail').value.trim();
    
    if (!email) {
        showMessage('Please enter user email', 'error');
        return;
    }
    
    try {
        // Find user by email
        const usersSnapshot = await db.collection('users')
            .where('email', '==', email)
            .get();
        
        if (usersSnapshot.empty) {
            showMessage('User not found with this email', 'error');
            return;
        }
        
        const userDoc = usersSnapshot.docs[0];
        const userData = userDoc.data();
        
        if (userData.role === 'admin') {
            showMessage('User is already an admin', 'error');
            return;
        }
        
        // Update user role to admin
        await db.collection('users').doc(userDoc.id).update({
            role: 'admin',
            promotedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showMessage(`${userData.name} has been promoted to admin!`, 'success');
        document.getElementById('adminUserEmail').value = '';
        loadAdminsList();
        
    } catch (error) {
        console.error('Error making user admin:', error);
        showMessage('Error promoting user to admin', 'error');
    }
}

// Load admins list
async function loadAdminsList() {
    try {
        const adminsSnapshot = await db.collection('users')
            .where('role', '==', 'admin')
            .get();
        
        const adminsList = document.getElementById('adminsList');
        
        if (adminsSnapshot.empty) {
            adminsList.innerHTML = '<p>No admins found</p>';
            return;
        }
        
        const adminsHTML = adminsSnapshot.docs.map(doc => {
            const admin = doc.data();
            return `
                <div class="admin-item">
                    <div>
                        <strong>${admin.name}</strong><br>
                        <small>${admin.email}</small>
                    </div>
                    <span class="status-badge status-confirmed">Admin</span>
                </div>
            `;
        }).join('');
        
        adminsList.innerHTML = adminsHTML;
        
    } catch (error) {
        console.error('Error loading admins:', error);
    }
}

// Real-time notification system for admin
function setupAdminNotifications() {
    console.log('Setting up admin notifications...');
    
    if (typeof db === 'undefined') {
        console.log('Database not available, retrying...');
        setTimeout(setupAdminNotifications, 1000);
        return;
    }
    
    try {
        db.collection('notifications')
            .where('read', '==', false)
            .onSnapshot((snapshot) => {
                const unreadCount = snapshot.size;
                console.log('Unread notifications:', unreadCount);
                
                // Update notification badge
                const notificationBadge = document.getElementById('notificationBadge');
                if (notificationBadge) {
                    notificationBadge.textContent = unreadCount;
                    if (unreadCount > 0) {
                        notificationBadge.style.display = 'flex';
                    } else {
                        notificationBadge.style.display = 'none';
                    }
                } else {
                    console.log('Notification badge element not found');
                }
                
                // Show browser notification for new bookings
                snapshot.docChanges().forEach((change) => {
                    if (change.type === 'added') {
                        const notification = change.doc.data();
                        showBrowserNotification(notification);
                    }
                });
            }, (error) => {
                console.error('Error listening to notifications:', error);
            });
    } catch (error) {
        console.error('Error setting up notifications:', error);
    }
}

function showBrowserNotification(notification) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Om Ambulance Service - New Booking', {
            body: notification.message,
            icon: 'logo.jpeg',
            badge: 'logo.jpeg'
        });
    }
}

// Load settings on page load
document.addEventListener('DOMContentLoaded', function() {
    // Load saved settings
    const serviceSettings = localStorage.getItem('serviceSettings');
    if (serviceSettings) {
        const settings = JSON.parse(serviceSettings);
        document.getElementById('responseTime').value = settings.responseTime || 10;
        document.getElementById('serviceRadius').value = settings.serviceRadius || 50;
        document.getElementById('emergencyNumber').value = settings.emergencyNumber || '108';
    }
    
    const notificationSettings = localStorage.getItem('notificationSettings');
    if (notificationSettings) {
        const settings = JSON.parse(notificationSettings);
        document.getElementById('emailNotifications').checked = settings.emailNotifications !== false;
        document.getElementById('smsNotifications').checked = settings.smsNotifications !== false;
        document.getElementById('pushNotifications').checked = settings.pushNotifications !== false;
    }
    
    // Load admins list
    loadAdminsList();
});