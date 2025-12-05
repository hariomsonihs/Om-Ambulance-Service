// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDuBCrRW9ZaJ-9WDNFpS0KySGXV4mz6j9o",
    authDomain: "om-ambulance-service.firebaseapp.com",
    projectId: "om-ambulance-service",
    storageBucket: "om-ambulance-service.firebasestorage.app",
    messagingSenderId: "149994904266",
    appId: "1:149994904266:web:b398b035d5fb01d5d17233",
    measurementId: "G-R0SW2DRVYZ"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();

// Test Firestore connection
window.testFirestore = async function() {
    try {
        console.log('Testing Firestore connection...');
        const testDoc = await db.collection('test').add({
            message: 'Hello Firestore!',
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log('Firestore test successful! Doc ID:', testDoc.id);
        return true;
    } catch (error) {
        console.error('Firestore test failed:', error);
        return false;
    }
};

// Auth state observer
auth.onAuthStateChanged(async (user) => {
    if (user) {
        console.log('User logged in:', user.email);
        
        // Only check admin role if not already on admin page
        if (!window.location.pathname.includes('admin.html')) {
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                if (userData.role === 'admin') {
                    console.log('Admin user detected, redirecting to admin panel');
                    window.location.href = 'admin.html';
                    return;
                }
            }
        }
        
        updateNavigation(true);
        loadUserData(user.uid);
    } else {
        console.log('User logged out');
        updateNavigation(false);
    }
});

function updateNavigation(isLoggedIn) {
    const loginLink = document.querySelector('.nav-link[onclick="showLogin()"]');
    if (loginLink) {
        if (isLoggedIn) {
            loginLink.textContent = 'Dashboard';
            loginLink.onclick = () => showDashboard();
        } else {
            loginLink.textContent = 'Login';
            loginLink.onclick = () => showLogin();
        }
    }
}

// User registration
async function registerUser(name, email, phone, address, password) {
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Save additional user data to Firestore
        await db.collection('users').doc(user.uid).set({
            name: name,
            email: email,
            phone: phone,
            address: address,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            role: 'user'
        });
        
        return { success: true, user: user };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// User login
async function loginUser(email, password) {
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        return { success: true, user: userCredential.user };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// User logout
async function logoutUser() {
    try {
        await auth.signOut();
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Create booking
async function createBooking(bookingData) {
    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('User must be logged in to book ambulance');
        }

        const booking = {
            ...bookingData,
            userId: user.uid,
            userEmail: user.email,
            status: 'booked',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            bookingId: generateBookingId()
        };

        const docRef = await db.collection('bookings').add(booking);
        booking.id = docRef.id;
        
        return { success: true, booking: booking };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Get user bookings
async function getUserBookings(userId) {
    try {
        const snapshot = await db.collection('bookings')
            .where('userId', '==', userId)
            .get();
        
        const bookings = [];
        snapshot.forEach(doc => {
            bookings.push({ id: doc.id, ...doc.data() });
        });
        
        // Sort by createdAt in JavaScript
        bookings.sort((a, b) => {
            const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt);
            const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt);
            return bTime - aTime;
        });
        
        return { success: true, bookings: bookings };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Get user data
async function getUserData(userId) {
    try {
        const doc = await db.collection('users').doc(userId).get();
        if (doc.exists) {
            return { success: true, userData: doc.data() };
        } else {
            return { success: false, error: 'User data not found' };
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Track booking
async function trackBooking(bookingId) {
    try {
        const snapshot = await db.collection('bookings')
            .where('bookingId', '==', bookingId)
            .get();
        
        if (snapshot.empty) {
            return { success: false, error: 'Booking not found' };
        }
        
        const booking = snapshot.docs[0].data();
        return { success: true, booking: booking };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Generate booking ID
function generateBookingId() {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substr(2, 5).toUpperCase();
    return `AMB${timestamp.slice(-6)}${random}`;
}

// Admin functions
async function getAllBookings() {
    try {
        const snapshot = await db.collection('bookings')
            .orderBy('createdAt', 'desc')
            .get();
        
        const bookings = [];
        snapshot.forEach(doc => {
            bookings.push({ id: doc.id, ...doc.data() });
        });
        
        return { success: true, bookings: bookings };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function getAllUsers() {
    try {
        const snapshot = await db.collection('users')
            .orderBy('createdAt', 'desc')
            .get();
        
        const users = [];
        snapshot.forEach(doc => {
            users.push({ id: doc.id, ...doc.data() });
        });
        
        return { success: true, users: users };
    } catch (error) {
        return { success: false, error: error.message };
    }
}



// Real-time listeners
function listenToBookings(callback) {
    return db.collection('bookings')
        .orderBy('createdAt', 'desc')
        .onSnapshot(callback);
}

function listenToUserBookings(userId, callback) {
    return db.collection('bookings')
        .where('userId', '==', userId)
        .onSnapshot(callback);
}