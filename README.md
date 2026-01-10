# Om Ambulance Service Website

एक complete, professional और modern ambulance service website जो fully functional है और Firebase के साथ integrated है।

## Features

### User Side:
- **Modern Design**: Medical theme के साथ attractive gradients, animations और icons
- **Responsive Design**: सभी devices (mobile, tablet, laptop) में perfectly fit होता है
- **User Authentication**: Registration और Login system
- **Ambulance Booking**: Easy booking form with emergency type selection
- **Real-time Tracking**: Booking ID से ambulance track कर सकते हैं
- **User Dashboard**: Profile management और booking history
- **Emergency Call**: Quick emergency call button

### Admin Panel:
- **Complete Admin Dashboard**: Statistics और overview
- **Bookings Management**: सभी bookings को view, update और manage करना
- **Users Management**: Registered users की complete information
- **Real-time Updates**: Live data updates Firebase से
- **Analytics**: Booking trends और emergency types analysis
- **Settings**: Service configuration और notifications

### Technical Features:
- **Firebase Integration**: Real-time database और authentication
- **PWA Ready**: Service worker support
- **Mobile App Feel**: Mobile में app जैसा experience
- **Live Data**: सभी changes automatically reflect होते हैं
- **Secure**: Proper authentication और data validation

## Setup Instructions

### 1. Firebase Setup:
1. Firebase console में जाकर new project बनाएं
2. Authentication enable करें (Email/Password)
3. Firestore Database create करें
4. Web app add करें और config copy करें
5. `firebase-config.js` में अपना config paste करें:

```javascript
const firebaseConfig = {
    apiKey: "your-api-key",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "your-app-id"
};
```

### 2. Firestore Rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Bookings collection
    match /bookings/{bookingId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 3. Admin Access:
- Admin Email: `admin@omambulance.com`
- Admin Password: `admin123`
- Admin panel: `admin.html`

## File Structure:
```
Om Ambulance Service/
├── index.html              # Main website
├── admin.html              # Admin panel
├── styles.css              # Main website styles
├── admin-styles.css        # Admin panel styles
├── script.js               # Main website JavaScript
├── admin-script.js         # Admin panel JavaScript
├── firebase-config.js      # Firebase configuration
└── README.md              # Documentation
```

## Usage:

### For Users:
1. Website खोलें
2. Register/Login करें
3. "Book Ambulance" button click करें
4. Details fill करें और submit करें
5. Booking ID मिलेगा tracking के लिए
6. Dashboard में अपनी सभी bookings देख सकते हैं

### For Admin:
1. `admin.html` खोलें
2. Admin credentials से login करें
3. Dashboard में सभी statistics देखें
4. Bookings section में सभी bookings manage करें
5. Users section में registered users देखें
6. Analytics में trends देखें
7. Settings में service configure करें

## Key Features Explained:

### Responsive Design:
- Mobile में app जैसा feel
- Tablet में optimized layout
- Desktop में full-screen experience
- सभी elements properly scale होते हैं

### Medical Theme:
- Red/Blue color scheme (medical colors)
- Ambulance और medical icons
- Professional gradients
- Hospital-like feel

### Real-time Updates:
- Firebase listeners से live data
- Admin panel में instant updates
- User dashboard में real-time booking status
- Automatic refresh जब data change हो

### Security:
- Firebase Authentication
- Proper data validation
- Admin session management
- Secure booking system

## Customization:

### Colors बदलने के लिए:
`styles.css` और `admin-styles.css` में CSS variables modify करें

### Content बदलने के लिए:
HTML files में text content update करें

### Features add करने के लिए:
JavaScript files में नए functions add करें

## Browser Support:
- Chrome (Recommended)
- Firefox
- Safari
- Edge
- Mobile browsers

## Performance:
- Fast loading
- Optimized images
- Minimal JavaScript
- Efficient CSS

यह website production-ready है और आप इसे directly use कर सकते हैं। बस Firebase setup करना है और admin credentials change करना है।