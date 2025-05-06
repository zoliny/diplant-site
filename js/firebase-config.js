// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAe5ngSjbey5cpQjTVxvABR8xmFOHt87pk",
    projectId: "diplant",
    authDomain: "diplant.firebaseapp.com",
    appId: "1:304979435569:web:b341144205130d29a6f510",
    storageBucket: "diplant.appspot.com",
    messagingSenderId: "304979435569",
    databaseURL: "https://diplant.firebaseio.com"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);

// Get Firebase services
window.auth = firebase.auth();
window.db = firebase.firestore();
window.storage = firebase.storage();

// Configure Firestore
db.settings({
    cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
});

// Enable offline persistence
db.enablePersistence()
    .then(() => {
        console.log('Offline persistence enabled');
    })
    .catch((err) => {
        if (err.code == 'failed-precondition') {
            console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
        } else if (err.code == 'unimplemented') {
            console.warn('The current browser does not support persistence.');
        }
    });