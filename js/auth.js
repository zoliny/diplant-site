// Add retry logic for Firebase operations
const retryOperation = async (operation, maxAttempts = 3, delay = 1000) => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await operation();
        } catch (error) {
            if (attempt === maxAttempts) throw error;
            if (error.code === 'permission-denied') throw error;
            
            console.warn(`Operation failed, retrying (${attempt}/${maxAttempts})...`);
            await new Promise(resolve => setTimeout(resolve, delay * attempt));
        }
    }
};

// Add these lines at the beginning of the file to ensure buttons are available right away
// This helps prevent race conditions where the auth state is checked before buttons are found in the DOM
window.addEventListener('DOMContentLoaded', function() {
    // Make sure we can find all the auth buttons across the site
    window.loginBtn = document.getElementById('loginBtn');
    window.profileBtn = document.getElementById('profileBtn');
    window.logoutBtn = document.getElementById('logoutBtn');
    window.ordersLink = document.getElementById('ordersLink');
    
    // Immediately start checking the auth state
    checkAuthState();
});

document.addEventListener('DOMContentLoaded', () => {
    checkAuthState();
});

// Function to check authentication state and update UI accordingly
function checkAuthState() {
    if (firebase && firebase.auth) {
        console.log('Checking auth state...');
        const auth = firebase.auth();

        // Get current user immediately if available
        const currentUser = auth.currentUser;
        if (currentUser) {
            console.log('User already logged in:', currentUser.email);
            updateUIForLoggedInUser(currentUser);
        }

        // Also set up the auth state observer for changes
        auth.onAuthStateChanged(function(user) {
            console.log('Auth state changed:', user ? 'Logged in as ' + user.email : 'Logged out');
            if (user) {
                updateUIForLoggedInUser(user);
            } else {
                updateUIForLoggedOutUser();
            }
        });
    } else {
        console.error('Firebase auth is not available yet');
    }
}

// Function to update UI elements when user is logged in
async function updateUIForLoggedInUser(user) {
    console.log('Updating UI for logged in user:', user.email);
    
    if (window.loginBtn) window.loginBtn.style.display = 'none';
    if (window.profileBtn) window.profileBtn.style.display = 'inline-block';
    if (window.logoutBtn) window.logoutBtn.style.display = 'inline-block';
    
    const navbar = document.querySelector('.navbar');
    if (navbar) navbar.classList.add('logged-in');
    
    try {
        const userDocRef = db.collection('users').doc(user.uid);
        const userDoc = await userDocRef.get();
        
        if (!userDoc.exists) {
            await userDocRef.set({
                email: user.email,
                role: user.email === 'zol@gmail.com' ? 'admin' : 'user',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        
        const userData = userDoc.exists ? userDoc.data() : { role: 'user' };
        const isAdmin = user.email === 'zol@gmail.com' || userData?.role === 'admin';
        console.log('[DEBUG] isAdmin:', isAdmin, 'user.email:', user.email, 'userData:', userData);
        
        if (isAdmin) {
            if (window.ordersLink) window.ordersLink.style.display = 'none';
            // Remove any existing admin button
            const oldAdminBtn = document.querySelector('.admin-btn');
            if (oldAdminBtn) oldAdminBtn.remove();
            // Insert admin button after the cart icon
            const userActions = document.querySelector('.user-actions');
            const cartElement = document.querySelector('.cart');
            if (userActions && cartElement) {
                const adminBtn = document.createElement('button');
                adminBtn.className = 'auth-btn admin-btn';
                adminBtn.style.marginRight = '10px';
                adminBtn.innerHTML = '<i class="fas fa-cog"></i> Admin';
                adminBtn.onclick = () => {
                    window.location.href = 'admin.html';
                };
                // Insert right after cart
                if (cartElement.nextSibling) {
                    userActions.insertBefore(adminBtn, cartElement.nextSibling);
                } else {
                    userActions.appendChild(adminBtn);
                }
            }
        } else {
            if (window.ordersLink) {
                window.ordersLink.style.display = 'inline-block';
                window.ordersLink.href = 'rendelesek.html';
            }
        }

        // Ensure profileBtn click handler is attached
        setTimeout(() => {
            const profileBtn = document.getElementById('profileBtn');
            if (profileBtn) {
                profileBtn.onclick = () => {
                    const profileModal = document.getElementById('profileModal');
                    if (profileModal) {
                        profileModal.style.display = 'block';
                        if (typeof loadUserProfile === 'function') loadUserProfile();
                        if (typeof loadUserOrders === 'function') loadUserOrders();
                    }
                };
            }
        }, 0);
    } catch (error) {
        console.error('Error in updateUIForLoggedInUser:', error);
    }
}

// Function to update UI elements when user is logged out
function updateUIForLoggedOutUser() {
    console.log('Updating UI for logged out user');
    
    if (window.loginBtn) window.loginBtn.style.display = 'inline-block';
    if (window.profileBtn) window.profileBtn.style.display = 'none';
    if (window.logoutBtn) window.logoutBtn.style.display = 'none';
    if (window.ordersLink) window.ordersLink.style.display = 'none';
    
    const navbar = document.querySelector('.navbar');
    if (navbar) navbar.classList.remove('logged-in');
    
    const adminBtn = document.querySelector('.admin-btn');
    if (adminBtn) adminBtn.remove();
}

// DOM Elements
const authModal = document.getElementById('authModal');
const profileModal = document.getElementById('profileModal');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const updateProfileForm = document.getElementById('updateProfileForm');

// Error messages in Hungarian
const errorMessages = {
    'auth/email-already-in-use': 'Ez az email cím már regisztrálva van.',
    'auth/invalid-email': 'Érvénytelen email cím.',
    'auth/operation-not-allowed': 'Az email/jelszó bejelentkezés nincs engedélyezve.',
    'auth/weak-password': 'A jelszó túl gyenge. Használjon legalább 6 karaktert.',
    'auth/user-disabled': 'Ez a felhasználói fiók le van tiltva.',
    'auth/user-not-found': 'Nem található felhasználó ezzel az email címmel.',
    'auth/wrong-password': 'Helytelen jelszó.',
    'auth/too-many-requests': 'Túl sok sikertelen próbálkozás. Kérjük, próbálja újra később.'
};

// Close buttons for modals
document.querySelectorAll('.close').forEach(button => {
    button.onclick = function() {
        authModal.style.display = 'none';
        profileModal.style.display = 'none';
    }
});

// Tab switching
document.querySelectorAll('.tab-btn').forEach(button => {
    button.addEventListener('click', () => {
        const tabName = button.dataset.tab;
        const parent = button.closest('.modal-content');
        
        // Update active tab
        parent.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // Show corresponding form/section
        if (parent.contains(loginForm)) {
            loginForm.style.display = tabName === 'login' ? 'block' : 'none';
            registerForm.style.display = tabName === 'register' ? 'block' : 'none';
        } else {
            document.getElementById('userInfo').style.display = tabName === 'info' ? 'block' : 'none';
            document.getElementById('userOrders').style.display = tabName === 'orders' ? 'block' : 'none';
        }
    });
});

// Add network status monitoring
let isOnline = true;
window.addEventListener('online', () => {
    isOnline = true;
    showNotification('Helyreállt az internetkapcsolat', 'success');
});

window.addEventListener('offline', () => {
    isOnline = false;
    showNotification('Nincs internetkapcsolat. Az offline módban végzett műveletek szinkronizálásra kerülnek, amikor helyreáll a kapcsolat.', 'warning');
});

// Show auth modal
const loginBtn = document.getElementById('loginBtn');
if (loginBtn) {
    loginBtn.onclick = () => {
        authModal.style.display = 'block';
        // Re-render reCAPTCHA in registration form when modal is shown
        setTimeout(() => {
            const registerForm = document.getElementById('registerForm');
            const recaptchaDiv = registerForm ? registerForm.querySelector('.g-recaptcha') : null;
            if (recaptchaDiv && typeof grecaptcha !== 'undefined') {
                // Remove any previous widget
                recaptchaDiv.innerHTML = '';
                grecaptcha.render(recaptchaDiv, {
                    sitekey: '6LdD_jArAAAAAA-uIjISU8SUCnjPUNGneWvdvv1n'
                });
            }
        }, 100);
    };
}

// Show contact section reCAPTCHA when page loads
window.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contactForm');
    const recaptchaDiv = contactForm ? contactForm.querySelector('.g-recaptcha') : null;
    if (recaptchaDiv && typeof grecaptcha !== 'undefined') {
        recaptchaDiv.innerHTML = '';
        grecaptcha.render(recaptchaDiv, {
            sitekey: '6LdD_jArAAAAAA-uIjISU8SUCnjPUNGneWvdvv1n'
        });
    }
});

// Show profile modal
const profileBtn = document.getElementById('profileBtn');
if (profileBtn) {
    profileBtn.onclick = () => {
        const profileModal = document.getElementById('profileModal');
        if (profileModal) {
            profileModal.style.display = 'block';
            if (typeof loadUserProfile === 'function') loadUserProfile();
            if (typeof loadUserOrders === 'function') loadUserOrders();
        }
    };
}

// Login form submission with retry
if (loginForm) {
    loginForm.onsubmit = async (e) => {
        e.preventDefault();
        const email = loginForm.querySelector('input[type="email"]').value;
        const password = loginForm.querySelector('input[type="password"]').value;

        try {
            const userCredential = await retryOperation(async () => {
                return await auth.signInWithEmailAndPassword(email, password);
            });

            authModal.style.display = 'none';
            loginForm.reset();
            showNotification('Sikeres bejelentkezés!');
            
            if (email === 'zol@gmail.com') {
                await retryOperation(async () => {
                    const userDoc = await db.collection('users').doc(userCredential.user.uid).get();
                    if (!userDoc.exists || userDoc.data().role !== 'admin') {
                        await db.collection('users').doc(userCredential.user.uid).set({
                            email: email,
                            role: 'admin',
                            createdAt: firebase.firestore.FieldValue.serverTimestamp()
                        }, { merge: true });
                    }
                });
            }
        } catch (error) {
            console.error('Login error:', error);
            showNotification(errorMessages[error.code] || 'Hiba történt a bejelentkezés során.', 'error');
        }
    };
}

// Registration form submission with retry
if (registerForm) {
    registerForm.onsubmit = async (e) => {
        e.preventDefault();
        const fullName = registerForm.querySelector('input[type="text"]').value;
        const email = registerForm.querySelector('input[type="email"]').value;
        const password = registerForm.querySelectorAll('input[type="password"]')[0].value;
        const passwordConfirm = registerForm.querySelectorAll('input[type="password"]')[1].value;

        // reCAPTCHA check
        const recaptchaResponse = grecaptcha.getResponse();
        if (!recaptchaResponse) {
            showNotification('Kérjük, igazolja, hogy nem robot!', 'error');
            return;
        }

        if (password !== passwordConfirm) {
            showNotification('A jelszavak nem egyeznek!', 'error');
            return;
        }

        if (password.length < 6) {
            showNotification('A jelszónak legalább 6 karakter hosszúnak kell lennie!', 'error');
            return;
        }

        if (!isOnline) {
            showNotification('A regisztrációhoz internetkapcsolat szükséges.', 'error');
            return;
        }

        try {
            // Only create the authentication user, don't store in Firestore
            await retryOperation(async () => {
                await auth.createUserWithEmailAndPassword(email, password);
            });
            
            authModal.style.display = 'none';
            registerForm.reset();
            grecaptcha.reset();
            showNotification('Sikeres regisztráció!');
        } catch (error) {
            console.error('Registration error:', error);
            showNotification(errorMessages[error.code] || 'Hiba történt a regisztráció során.', 'error');
        }
    };
}

// Update profile form submission with retry and offline support
if (updateProfileForm) {
    updateProfileForm.onsubmit = async (e) => {
        e.preventDefault();
        const user = auth.currentUser;
        if (!user) {
            showNotification('A profil frissítéséhez be kell jelentkezni!', 'error');
            return;
        }

        try {
            await retryOperation(async () => {
                await db.collection('users').doc(user.uid).update({
                    fullName: updateProfileForm.fullName.value,
                    phone: updateProfileForm.phone.value,
                    address: updateProfileForm.address.value,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            });
            showNotification('Profil sikeresen frissítve!');
        } catch (error) {
            console.error('Profile update error:', error);
            if (!isOnline) {
                showNotification('A módosítások mentésre kerülnek, amikor helyreáll az internetkapcsolat.', 'warning');
            } else {
                showNotification('Hiba történt a profil mentése során!', 'error');
            }
        }
    };
}

// Logout
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.onclick = async () => {
        try {
            await auth.signOut();
            profileModal.style.display = 'none';
            showNotification('Sikeres kijelentkezés!');
        } catch (error) {
            showNotification('Hiba történt a kijelentkezés során!', 'error');
        }
    };
}

// Load user profile data with retry
async function loadUserProfile() {
    const user = auth.currentUser;
    if (!user) return;

    try {
        const userDocRef = db.collection('users').doc(user.uid);
        let doc = await userDocRef.get();
        
        if (!doc.exists) {
            // Create user document if it doesn't exist
            await userDocRef.set({
                email: user.email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            doc = await userDocRef.get();
        }

        const userData = doc.data();
        updateProfileForm.fullName.value = userData.fullName || '';
        updateProfileForm.email.value = user.email;
        updateProfileForm.phone.value = userData.phone || '';
        updateProfileForm.address.value = userData.address || '';
    } catch (error) {
        console.error('Error loading user profile:', error);
        if (error.code !== 'permission-denied') {
            showNotification('Hiba történt a profil betöltése során!', 'error');
        }
    }
}

// Load user orders with retry
async function loadUserOrders(container) {
    const user = auth.currentUser;
    if (!user) return;

    try {
        const ordersSnapshot = await db.collection('orders')
            .where('userId', '==', user.uid)
            .orderBy('createdAt', 'desc')
            .get();

        container.innerHTML = '';

        if (ordersSnapshot.empty) {
            container.innerHTML = '<p>Még nincsenek rendeléseid.</p>';
            return;
        }

        ordersSnapshot.forEach(doc => {
            const order = doc.data();
            const orderElement = document.createElement('div');
            orderElement.className = 'order-item';
            orderElement.innerHTML = `
                <h4>Rendelés #${doc.id.slice(-6)}</h4>
                <p>Dátum: ${order.createdAt?.toDate().toLocaleDateString('hu-HU') || 'N/A'}</p>
                <p>Összeg: ${order.total} Ft</p>
                <p>Státusz: ${getOrderStatus(order.status)}</p>
            `;
            container.appendChild(orderElement);
        });
    } catch (error) {
        console.error('Error loading orders:', error);
        if (error.code !== 'permission-denied') {
            showNotification('Hiba történt a rendelések betöltése során!', 'error');
        }
        container.innerHTML = '<p>A rendelések betöltése nem sikerült. Kérjük, próbáld újra később.</p>';
    }
}

// Helper function to translate order status
function getOrderStatus(status) {
    const statuses = {
        'pending': 'Függőben',
        'processing': 'Feldolgozás alatt',
        'shipped': 'Szállítás alatt',
        'delivered': 'Kézbesítve'
    };
    return statuses[status] || status;
}

// Show notification function
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}