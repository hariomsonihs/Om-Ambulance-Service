// Global variables
let currentUser = null;
let userBookingsListener = null;

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    
    // Mobile menu toggle function
    setupMobileMenu();
});

function initializeApp() {
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href && href !== '#') {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });
}

function setupMobileMenu() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');
    const navOverlay = document.getElementById('nav-overlay');
    
    if (!hamburger || !navMenu || !navOverlay) return;
    
    function toggleMenu() {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
        navOverlay.classList.toggle('active');
        document.body.classList.toggle('menu-active');
    }
    
    function closeMenu() {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
        navOverlay.classList.remove('active');
        document.body.classList.remove('menu-active');
    }
    
    hamburger.addEventListener('click', toggleMenu);
    navOverlay.addEventListener('click', closeMenu);
    
    document.querySelectorAll('.mobile-nav-menu .nav-link').forEach(link => {
        link.addEventListener('click', closeMenu);
    });
    
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            closeMenu();
        }
    });
}

function closeMobileMenu() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');
    const navOverlay = document.getElementById('nav-overlay');
    
    if (hamburger) hamburger.classList.remove('active');
    if (navMenu) navMenu.classList.remove('active');
    if (navOverlay) navOverlay.classList.remove('active');
    document.body.classList.remove('menu-active');
}
function setupEventListeners() {
    // Form submissions
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const bookingForm = document.getElementById('bookingForm');
    const trackingForm = document.getElementById('trackingForm');
    
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (registerForm) registerForm.addEventListener('submit', handleRegister);
    if (bookingForm) bookingForm.addEventListener('submit', handleBooking);
    if (trackingForm) trackingForm.addEventListener('submit', handleTracking);
    
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    if (forgotPasswordForm) forgotPasswordForm.addEventListener('submit', handleForgotPassword);

    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
}

// Modal functions
function showModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function showLogin() {
    closeAllModals();
    showModal('loginModal');
}

function showRegister() {
    closeAllModals();
    showModal('registerModal');
}

function showForgotPassword() {
    closeAllModals();
    showModal('forgotPasswordModal');
}

function showBooking() {
    closeAllModals();
    showModal('bookingModal');
}

function showTracking() {
    closeAllModals();
    showModal('trackingModal');
}

function showDashboard() {
    if (!auth.currentUser) {
        showLogin();
        return;
    }
    closeAllModals();
    showModal('dashboardModal');
    
    setTimeout(() => {
        loadUserDashboard();
    }, 100);
}

// Add authentication state listener
auth.onAuthStateChanged((user) => {
    if (user) {
        console.log('User is signed in:', user.email);
        currentUser = user;
        updateNavigation(true);
    } else {
        console.log('User is signed out');
        currentUser = null;
        updateNavigation(false);
    }
});

// Update navigation menu based on login status
function updateNavigation(isLoggedIn) {
    const loginNavLink = document.getElementById('loginNavLink');
    const dashboardNavLink = document.getElementById('dashboardNavLink');
    const mobileLoginLink = document.getElementById('mobileLoginLink');
    const mobileDashboardLink = document.getElementById('mobileDashboardLink');
    const mobileLogoutLink = document.getElementById('mobileLogoutLink');
    
    if (isLoggedIn) {
        if (loginNavLink) loginNavLink.style.display = 'none';
        if (dashboardNavLink) dashboardNavLink.style.display = 'block';
        if (mobileLoginLink) mobileLoginLink.style.display = 'none';
        if (mobileDashboardLink) mobileDashboardLink.style.display = 'block';
        if (mobileLogoutLink) mobileLogoutLink.style.display = 'block';
    } else {
        if (loginNavLink) loginNavLink.style.display = 'block';
        if (dashboardNavLink) dashboardNavLink.style.display = 'none';
        if (mobileLoginLink) mobileLoginLink.style.display = 'block';
        if (mobileDashboardLink) mobileDashboardLink.style.display = 'none';
        if (mobileLogoutLink) mobileLogoutLink.style.display = 'none';
    }
}

function closeAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.style.display = 'none';
    });
}

// Authentication handlers
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    submitBtn.innerHTML = '<span class="loading"></span> Logging in...';
    submitBtn.disabled = true;
    
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        showMessage('Login successful! Welcome back!', 'success');
        closeModal('loginModal');
        document.getElementById('loginForm').reset();
        
        // Check user role
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            if (userData.role === 'admin') {
                setTimeout(() => {
                    showMessage('Redirecting to Admin Panel...', 'success');
                    window.location.href = 'admin.html';
                }, 1500);
                return;
            }
        }
        
        // Show profile tab in dashboard for regular users
        setTimeout(() => {
            showDashboard();
            showTab('profile');
        }, 1500);
        
    } catch (error) {
        console.error('Login error:', error);
        let errorMessage = 'Wrong email or password. Please check your details.';
        
        if (error.code === 'auth/user-not-found') {
            errorMessage = 'No account found with this email. Please register first.';
        } else if (error.code === 'auth/wrong-password') {
            errorMessage = 'Wrong password. Please check your password or use forgot password.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Invalid email format.';
        } else if (error.code === 'auth/user-disabled') {
            errorMessage = 'This account has been disabled.';
        } else if (error.code === 'auth/invalid-credential' || error.code === 'auth/invalid-login-credentials') {
            errorMessage = 'Wrong email or password. Please check your details.';
        } else if (error.code === 'auth/too-many-requests') {
            errorMessage = 'Too many failed attempts. Please try again later.';
        }
        
        showMessage(errorMessage, 'error');
    }
    
    submitBtn.innerHTML = 'Login';
    submitBtn.disabled = false;
}

async function handleForgotPassword(e) {
    e.preventDefault();
    
    const email = document.getElementById('forgotEmail').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    submitBtn.innerHTML = '<span class="loading"></span> Sending...';
    submitBtn.disabled = true;
    
    try {
        await auth.sendPasswordResetEmail(email);
        showMessage('Password reset link sent to your email!', 'success');
        closeModal('forgotPasswordModal');
        document.getElementById('forgotPasswordForm').reset();
    } catch (error) {
        console.error('Forgot password error:', error);
        let errorMessage = 'Failed to send reset email';
        
        if (error.code === 'auth/user-not-found') {
            errorMessage = 'No account found with this email.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Invalid email format.';
        }
        
        showMessage(errorMessage, 'error');
    }
    
    submitBtn.innerHTML = 'Send Reset Link';
    submitBtn.disabled = false;
}

async function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const phone = document.getElementById('registerPhone').value;
    const address = document.getElementById('registerAddress').value;
    const password = document.getElementById('registerPassword').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    if (password.length < 6) {
        showMessage('Password must be at least 6 characters long', 'error');
        return;
    }
    
    submitBtn.innerHTML = '<span class="loading"></span> Registering...';
    submitBtn.disabled = true;
    
    try {
        console.log('Starting registration for:', email);
        
        // Create Firebase Auth user
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        console.log('Auth user created:', user.uid);
        
        // Test Firestore first
        const firestoreWorking = await testFirestore();
        if (!firestoreWorking) {
            throw new Error('Firestore connection failed');
        }
        
        // Save user data to Firestore
        const userData = {
            name: name,
            email: email,
            phone: phone,
            address: address,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            role: 'user'
        };
        
        console.log('Saving user data:', userData);
        const docRef = await db.collection('users').doc(user.uid).set(userData);
        console.log('User data saved to Firestore successfully');
        
        // Verify data was saved
        const savedDoc = await db.collection('users').doc(user.uid).get();
        if (savedDoc.exists) {
            console.log('Verification: Data exists in Firestore:', savedDoc.data());
        } else {
            console.error('Verification failed: Data not found in Firestore');
        }
        
        showMessage('Registration successful! You are now logged in.', 'success');
        closeModal('registerModal');
        document.getElementById('registerForm').reset();
        
    } catch (error) {
        console.error('Registration error:', error);
        showMessage('Registration failed: ' + error.message, 'error');
    }
    
    submitBtn.innerHTML = 'Register';
    submitBtn.disabled = false;
}

// Booking handler
async function handleBooking(e) {
    e.preventDefault();
    
    const bookingData = {
        patientName: document.getElementById('patientName').value,
        contactNumber: document.getElementById('contactNumber').value,
        pickupAddress: document.getElementById('pickupAddress').value,
        emergencyType: document.getElementById('emergencyType').value,
        additionalInfo: document.getElementById('additionalInfo').value
    };
    
    // Create professional WhatsApp message
    const message = `*AMBULANCE BOOKING REQUEST*\n================================\n\n*Patient Name:* ${bookingData.patientName}\n*Contact Number:* ${bookingData.contactNumber}\n*Pickup Address:* ${bookingData.pickupAddress}\n*Service Type:* ${bookingData.emergencyType}${bookingData.additionalInfo ? `\n*Additional Info:* ${bookingData.additionalInfo}` : ''}\n\n================================\n*Request Time:* ${new Date().toLocaleString('en-IN')}\n\n_Please confirm ambulance availability and estimated arrival time._\n\n*Om Ambulance Service Patna*`;
    
    // Encode message for WhatsApp URL
    const encodedMessage = encodeURIComponent(message);
    const whatsappURL = `https://wa.me/917260871851?text=${encodedMessage}`;
    
    // Open WhatsApp
    window.open(whatsappURL, '_blank');
    
    // Close modal and reset form
    closeModal('bookingModal');
    document.getElementById('bookingForm').reset();
    
    showMessage('Redirecting to WhatsApp... Please send the message to confirm your booking!', 'success');
}

// Tracking handler
async function handleTracking(e) {
    e.preventDefault();
    
    const bookingId = document.getElementById('bookingId').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const resultDiv = document.getElementById('trackingResult');
    
    submitBtn.innerHTML = '<span class="loading"></span> Tracking...';
    submitBtn.disabled = true;
    
    try {
        const result = await trackBooking(bookingId);
        
        if (result.success) {
            const booking = result.booking;
            
            resultDiv.innerHTML = `
                <h3>Booking Details</h3>
                <div class="tracking-info">
                    <span>Booking ID:</span>
                    <span><strong>${booking.bookingId}</strong></span>
                </div>
                <div class="tracking-info">
                    <span>Patient:</span>
                    <span>${booking.patientName}</span>
                </div>
                <div class="tracking-info">
                    <span>Status:</span>
                    <span class="booking-status status-${booking.status}">${booking.status.toUpperCase()}</span>
                </div>
                <div class="tracking-info">
                    <span>Pickup Address:</span>
                    <span>${booking.pickupAddress}</span>
                </div>
                <div class="tracking-info">
                    <span>Destination:</span>
                    <span>${booking.destination}</span>
                </div>
                <div class="tracking-info">
                    <span>Emergency Type:</span>
                    <span>${booking.emergencyType}</span>
                </div>
                ${booking.additionalNotes ? `
                <div class="tracking-info">
                    <span>Additional Notes:</span>
                    <span>${booking.additionalNotes}</span>
                </div>
                ` : ''}
            `;
            resultDiv.style.display = 'block';
        } else {
            showMessage(result.error, 'error');
            resultDiv.style.display = 'none';
        }
    } catch (error) {
        showMessage('Tracking failed. Please try again.', 'error');
        resultDiv.style.display = 'none';
    }
    
    submitBtn.innerHTML = 'Track';
    submitBtn.disabled = false;
}

// Dashboard functions
async function loadUserDashboard() {
    const user = auth.currentUser;
    if (!user) return;
    
    try {
        console.log('Loading dashboard for user:', user.uid);
        
        document.getElementById('userProfile').innerHTML = '<div class="loading"></div> Loading profile...';
        
        const userDoc = await db.collection('users').doc(user.uid).get();
        
        if (userDoc.exists) {
            const userData = userDoc.data();
            console.log('User data found:', userData);
            displayUserProfile(userData);
        } else {
            console.log('No user document found, creating basic profile');
            const basicProfile = {
                name: user.displayName || 'User',
                email: user.email,
                phone: 'Not provided',
                address: 'Not provided',
                createdAt: new Date()
            };
            displayUserProfile(basicProfile);
        }
        
        loadUserBookings(user.uid);
    } catch (error) {
        console.error('Error loading dashboard:', error);
        document.getElementById('userProfile').innerHTML = '<p>Error loading profile data: ' + error.message + '</p>';
    }
}

function displayUserProfile(userData) {
    console.log('Displaying profile for:', userData);
    const profileDiv = document.getElementById('userProfile');
    
    if (!userData) {
        profileDiv.innerHTML = '<p>No profile data available</p>';
        return;
    }
    
    profileDiv.innerHTML = `
        <div class="profile-info">
            <div class="profile-item">
                <i class="fas fa-user"></i>
                <div>
                    <strong>Name:</strong>
                    <span>${userData.name || 'Not provided'}</span>
                </div>
            </div>
            <div class="profile-item">
                <i class="fas fa-envelope"></i>
                <div>
                    <strong>Email:</strong>
                    <span>${userData.email || 'Not provided'}</span>
                </div>
            </div>
            <div class="profile-item">
                <i class="fas fa-phone"></i>
                <div>
                    <strong>Phone:</strong>
                    <span>${userData.phone || 'Not provided'}</span>
                </div>
            </div>
            <div class="profile-item">
                <i class="fas fa-map-marker-alt"></i>
                <div>
                    <strong>Address:</strong>
                    <span>${userData.address || 'Not provided'}</span>
                </div>
            </div>
            <div class="profile-item">
                <i class="fas fa-calendar-alt"></i>
                <div>
                    <strong>Member Since:</strong>
                    <span>${formatDate(userData.createdAt)}</span>
                </div>
            </div>
        </div>
    `;
}

async function loadUserBookings(userId) {
    const bookingsDiv = document.getElementById('userBookings');
    bookingsDiv.innerHTML = '<div class="loading"></div> Loading bookings...';
    
    if (userBookingsListener) {
        userBookingsListener();
    }
    
    userBookingsListener = listenToUserBookings(userId, (snapshot) => {
        const bookings = [];
        snapshot.forEach(doc => {
            bookings.push({ id: doc.id, ...doc.data() });
        });
        
        displayUserBookings(bookings);
    });
}

function displayUserBookings(bookings) {
    const bookingsDiv = document.getElementById('userBookings');
    
    if (bookings.length === 0) {
        bookingsDiv.innerHTML = '<p>No bookings found.</p>';
        return;
    }
    
    const sortedBookings = bookings.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt);
        const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt);
        return bTime - aTime;
    });
    
    const bookingsHTML = sortedBookings.map(booking => `
        <div class="booking-card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h4>Booking #${booking.bookingId}</h4>
                <span class="booking-status status-${booking.status}">${getStatusText(booking.status)}</span>
            </div>
            <p><strong>Patient:</strong> ${booking.patientName}</p>
            <p><strong>Contact:</strong> ${booking.contactNumber}</p>
            <p><strong>Pickup:</strong> ${booking.pickupAddress}</p>
            <p><strong>Destination:</strong> ${booking.destination}</p>
            <p><strong>Emergency Type:</strong> ${booking.emergencyType}</p>
            <p><strong>Date:</strong> ${formatDate(booking.createdAt)}</p>
            ${booking.additionalInfo ? `<p><strong>Additional Info:</strong> ${booking.additionalInfo}</p>` : ''}
            ${booking.additionalNotes ? `<p><strong>Admin Notes:</strong> ${booking.additionalNotes}</p>` : ''}
        </div>
    `).join('');
    
    bookingsDiv.innerHTML = bookingsHTML;
}

function getStatusText(status) {
    const statusMap = {
        'booked': 'BOOKED',
        'confirmed': 'CONFIRMED',
        'dispatched': 'DISPATCHED',
        'completed': 'COMPLETED',
        'cancelled': 'CANCELLED'
    };
    return statusMap[status] || status.toUpperCase();
}

function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.getElementById(tabName).classList.add('active');
    
    if (event && event.target) {
        event.target.classList.add('active');
    }
}

async function handleLogout() {
    try {
        await auth.signOut();
        closeAllModals();
        showMessage('Logged out successfully!', 'success');
        
        if (userBookingsListener) {
            userBookingsListener();
            userBookingsListener = null;
        }
        
        updateNavigation(false);
    } catch (error) {
        showMessage('Logout failed. Please try again.', 'error');
    }
}

async function loadUserData(userId) {
    currentUser = userId;
    console.log('User authenticated:', userId);
    
    try {
        const userData = await getUserData(userId);
        console.log('User data loaded:', userData);
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

function showMessage(message, type) {
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    document.body.insertBefore(messageDiv, document.body.firstChild);
    
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
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getStatusColor(status) {
    const colors = {
        'pending': '#f39c12',
        'confirmed': '#27ae60',
        'completed': '#3498db',
        'cancelled': '#e74c3c'
    };
    return colors[status] || '#7f8c8d';
}

function makeEmergencyCall() {
    if (confirm('Do you want to call emergency services?')) {
        window.location.href = 'tel:108';
    }
}



async function deleteAccount() {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
        try {
            const user = auth.currentUser;
            if (user) {
                await db.collection('users').doc(user.uid).delete();
                
                const bookingsSnapshot = await db.collection('bookings')
                    .where('userId', '==', user.uid)
                    .get();
                
                const batch = db.batch();
                bookingsSnapshot.forEach(doc => {
                    batch.delete(doc.ref);
                });
                await batch.commit();
                
                await user.delete();
                
                showMessage('Account deleted successfully!', 'success');
                closeAllModals();
            }
        } catch (error) {
            showMessage('Error deleting account: ' + error.message, 'error');
        }
    }
}

// Notification System
async function sendBookingNotifications(booking, bookingData) {
    try {
        // Send user notification
        await sendUserNotification(booking, bookingData);
        
        // Send admin notification
        await sendAdminNotification(booking, bookingData);
        
        console.log('Notifications sent successfully');
    } catch (error) {
        console.error('Error sending notifications:', error);
    }
}

async function sendUserNotification(booking, bookingData) {
    const user = auth.currentUser;
    if (!user) return;
    
    // Email notification (using EmailJS or similar service)
    const emailData = {
        to_email: user.email,
        booking_id: booking.bookingId,
        patient_name: bookingData.patientName,
        pickup_address: bookingData.pickupAddress,
        destination: bookingData.destination,
        emergency_type: bookingData.emergencyType,
        contact_number: bookingData.contactNumber,
        booking_date: new Date().toLocaleString('en-IN')
    };
    
    // Simulate email sending (replace with actual email service)
    console.log('User Email Notification:', emailData);
    
    // SMS notification (using SMS gateway)
    const smsMessage = `Om Ambulance Service\n\nBooking Confirmed!\nID: ${booking.bookingId}\nPatient: ${bookingData.patientName}\nPickup: ${bookingData.pickupAddress}\n\nWe will contact you shortly.\nEmergency: 8084527516`;
    
    // Simulate SMS sending
    console.log('User SMS Notification:', smsMessage);
    
    // WhatsApp notification (using WhatsApp Business API)
    const whatsappMessage = `🚑 *Om Ambulance Service*\n\n✅ *Booking Confirmed*\n\n📋 *Booking ID:* ${booking.bookingId}\n👤 *Patient:* ${bookingData.patientName}\n📍 *Pickup:* ${bookingData.pickupAddress}\n🏥 *Destination:* ${bookingData.destination}\n🚨 *Service:* ${bookingData.emergencyType}\n\n📞 *Emergency Contact:* 8084527516\n\nOur team will contact you shortly!`;
    
    console.log('User WhatsApp Notification:', whatsappMessage);
}

async function sendAdminNotification(booking, bookingData) {
    // Admin email notification
    const adminEmailData = {
        to_email: 'admin@omambulance.com',
        booking_id: booking.bookingId,
        patient_name: bookingData.patientName,
        pickup_address: bookingData.pickupAddress,
        destination: bookingData.destination,
        emergency_type: bookingData.emergencyType,
        contact_number: bookingData.contactNumber,
        user_email: auth.currentUser?.email || 'N/A',
        booking_date: new Date().toLocaleString('en-IN')
    };
    
    console.log('Admin Email Notification:', adminEmailData);
    
    // Admin SMS notification
    const adminSmsMessage = `🚨 NEW BOOKING ALERT\n\nID: ${booking.bookingId}\nPatient: ${bookingData.patientName}\nType: ${bookingData.emergencyType}\nPickup: ${bookingData.pickupAddress}\nContact: ${bookingData.contactNumber}\n\nLogin to admin panel for details.`;
    
    console.log('Admin SMS Notification:', adminSmsMessage);
    
    // Save notification to database for admin panel
    try {
        await db.collection('notifications').add({
            type: 'new_booking',
            bookingId: booking.bookingId,
            message: `New booking from ${bookingData.patientName} - ${bookingData.emergencyType}`,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            read: false,
            priority: 'high'
        });
    } catch (error) {
        console.error('Error saving notification:', error);
    }
}

// Real-time notification system for admin
function setupAdminNotifications() {
    if (typeof db === 'undefined') return;
    
    db.collection('notifications')
        .where('read', '==', false)
        .orderBy('createdAt', 'desc')
        .onSnapshot((snapshot) => {
            const unreadCount = snapshot.size;
            
            // Update notification badge (if exists)
            const notificationBadge = document.getElementById('notificationBadge');
            if (notificationBadge) {
                notificationBadge.textContent = unreadCount;
                notificationBadge.style.display = unreadCount > 0 ? 'block' : 'none';
            }
            
            // Show browser notification for new bookings
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const notification = change.doc.data();
                    showBrowserNotification(notification);
                }
            });
        });
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

// Request notification permission
function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Request notification permission
    requestNotificationPermission();
    
    // Setup admin notifications if on admin page
    if (window.location.pathname.includes('admin.html')) {
        setTimeout(() => {
            setupAdminNotifications();
        }, 2000);
    }
    
    const emergencyBtn = document.createElement('div');
    emergencyBtn.innerHTML = `
        <div style="position: fixed; bottom: 20px; right: 20px; z-index: 1000;">
            <button onclick="window.location.href='tel:8084527516'" style="
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background: linear-gradient(45deg, #667eea, #764ba2);
                border: none;
                color: white;
                font-size: 1.2rem;
                cursor: pointer;
                box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
                transition: all 0.3s ease;
                margin-bottom: 10px;
                display: block;
            " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                <i class="fas fa-phone"></i>
            </button>
            <button onclick="window.location.href='tel:7260871851'" style="
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background: linear-gradient(45deg, #ff6b6b, #ee5a24);
                border: none;
                color: white;
                font-size: 1.2rem;
                cursor: pointer;
                box-shadow: 0 4px 15px rgba(255, 107, 107, 0.4);
                transition: all 0.3s ease;
                display: block;
            " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                <i class="fas fa-phone-alt"></i>
            </button>
        </div>
    `;
    document.body.appendChild(emergencyBtn);
});
