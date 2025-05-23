// Orders page functionality

// DOM elements
const ordersContent = document.getElementById('orders-content');
const loginRequired = document.getElementById('login-required');
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const orderDetailsForm = document.getElementById('orderDetailsForm');
const sameAsBillingCheckbox = document.getElementById('same-as-billing');
const shippingDetails = document.getElementById('shipping-details');

// Initialize current language
let currentLanguage = localStorage.getItem('language') || 'hu';

document.addEventListener('DOMContentLoaded', () => {
    // Check authentication state
    checkAuthState();
    
    // Initialize language
    initLanguage();
    
    // Initialize tab switching
    initTabs();
    
    // Initialize form functionality
    initForm();

    // Add logout button handler
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await firebase.auth().signOut();
            } catch (e) {}
            window.location.href = 'index.html';
        });
    }

    // Add cart icon click handler (ensure always works)
    const cartIcon = document.querySelector('.cart');
    if (cartIcon) {
        cartIcon.addEventListener('click', () => {
            window.location.href = 'cart.html';
        });
    }

    // Update cart counter on page load
    updateCartCount();

    // Listen for cart changes from other tabs/windows
    window.addEventListener('storage', (e) => {
        if (e.key === 'cart') updateCartCount();
    });

    // Remove info button if it exists
    const infoBtn = document.getElementById('infoBtn');
    if (infoBtn) infoBtn.remove();
    // Remove info modal if it exists
    const infoModal = document.getElementById('infoModal');
    if (infoModal) infoModal.remove();

    // Profile modal close logic
    const profileModal = document.getElementById('profileModal');
    if (profileModal) {
        // Close on X click
        const closeBtn = profileModal.querySelector('.close');
        if (closeBtn) {
            closeBtn.onclick = function(e) {
                profileModal.style.display = 'none';
                e.stopPropagation();
            };
        }
        // Close on outside click
        window.addEventListener('mousedown', function(event) {
            if (profileModal.style.display !== 'none' && event.target === profileModal) {
                profileModal.style.display = 'none';
            }
        });
    }
});

// Check if user is logged in
function checkAuthState() {
    if (firebase && firebase.auth) {
        firebase.auth().onAuthStateChanged(user => {
            const navbar = document.querySelector('.navbar');
            if (user) {
                // User is logged in, show orders content
                if (loginRequired) loginRequired.style.display = 'none';
                if (ordersContent) ordersContent.style.display = 'block';
                if (navbar) navbar.classList.add('logged-in');
                
                // Update authentication buttons
                updateAuthButtons(true);
                
                // Load user's order data
                loadUserOrderData();
                
                // Load user's billing and shipping data
                loadUserDetailsData();
            } else {
                // User is not logged in, show login required message
                if (loginRequired) loginRequired.style.display = 'block';
                if (ordersContent) ordersContent.style.display = 'none';
                if (navbar) navbar.classList.remove('logged-in');
                
                // Update authentication buttons
                updateAuthButtons(false);
            }
        });
    } else {
        console.error('Firebase auth is not available');
    }
}

// Update login/logout buttons based on authentication state
function updateAuthButtons(isLoggedIn) {
    const loginBtn = document.getElementById('loginBtn');
    const profileBtn = document.getElementById('profileBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const ordersLink = document.getElementById('ordersLink');
    
    if (isLoggedIn) {
        // User is logged in
        if (loginBtn) loginBtn.style.display = 'none';
        if (profileBtn) profileBtn.style.display = 'inline-block';
        if (logoutBtn) logoutBtn.style.display = 'inline-block';
        if (ordersLink) ordersLink.style.display = 'inline-block';
    } else {
        // User is logged out
        if (loginBtn) loginBtn.style.display = 'inline-block';
        if (profileBtn) profileBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (ordersLink) ordersLink.style.display = 'none';
    }
}

// Initialize language settings
function initLanguage() {
    translatePage();
    
    const languageOptions = document.querySelectorAll('.language-option');
    const currentLangDisplay = document.getElementById('currentLang');
    
    languageOptions.forEach(option => {
        option.addEventListener('click', () => {
            currentLanguage = option.getAttribute('data-lang');
            localStorage.setItem('language', currentLanguage);
            
            if (currentLangDisplay) {
                currentLangDisplay.textContent = option.textContent;
            }
            
            translatePage();
        });
    });
}

// Translate page content
function translatePage() {
    const translations = {
        'hu': {
            pageTitle: 'Rendelések - Di-Plant Nyelvkönyvbolt',
            myOrders: 'Rendeléseim',
            loginRequired: 'A rendelések megtekintéséhez bejelentkezés szükséges.',
            loginBtn: 'Bejelentkezés',
            activeOrders: 'Aktív rendelések',
            pastOrders: 'Korábbi rendelések',
            orderDetails: 'Rendelési adatok',
            noActiveOrders: 'Önnek jelenleg nincsenek aktív rendelései.',
            noPastOrders: 'Önnek még nincsenek korábbi rendelései.',
            billingInfo: 'Számlázási adatok (kötelező):',
            name: 'Név',
            streetAddress: 'Utca/házszám',
            city: 'Település',
            postcode: 'Irányítószám',
            phone: 'Telefon',
            contactPerson: 'Ügyintéző',
            shippingInfo: 'Szállítási cím (csak, ha eltérő a számlázási címtől):',
            sameAsBilling: 'Megegyezik a számlázási címmel',
            shippingName: 'Szállítási hely neve',
            otherInfo: 'Egyéb adatok:',
            newsletter: 'Hírlevél kérése',
            schoolSupport: 'Válassza ki az iskolát, melyet támogatni szeretne, vegyen részt pontgyűjtő akciónkban:',
            schoolCode: 'Iskola-kód:',
            privacyPolicy: 'Adatvédelmi nyilatkozat és felhasználási feltételek elfogadása',
            requiredFields: '*A csillaggal jelölt mezőket kötelező kitölteni.',
            saveBtn: 'Adatok mentése',
            dataSaved: 'Adatok sikeresen mentve!',
            error: 'Hiba történt! Kérjük, próbálja újra később.',
        },
        'en': {
            pageTitle: 'Orders - Di-Plant Language Bookstore',
            myOrders: 'My Orders',
            loginRequired: 'You need to log in to view your orders.',
            loginBtn: 'Log In',
            activeOrders: 'Active Orders',
            pastOrders: 'Past Orders',
            orderDetails: 'Order Details',
            noActiveOrders: 'You currently have no active orders.',
            noPastOrders: 'You don\'t have any past orders yet.',
            billingInfo: 'Billing Information (required):',
            name: 'Name',
            streetAddress: 'Street/House Number',
            city: 'City',
            postcode: 'Postal Code',
            phone: 'Phone',
            contactPerson: 'Contact Person',
            shippingInfo: 'Shipping Address (only if different from billing address):',
            sameAsBilling: 'Same as billing address',
            shippingName: 'Shipping Location Name',
            otherInfo: 'Other Information:',
            newsletter: 'Subscribe to newsletter',
            schoolSupport: 'Select a school you would like to support, participate in our point collection campaign:',
            schoolCode: 'School code:',
            privacyPolicy: 'Accept Privacy Policy and Terms of Use',
            requiredFields: '*Fields marked with an asterisk are required.',
            saveBtn: 'Save Data',
            dataSaved: 'Data successfully saved!',
            error: 'An error occurred! Please try again later.',
        }
    };

    const currentTranslations = translations[currentLanguage] || translations['hu'];

    // Update page title
    document.title = currentTranslations.pageTitle;

    // Update main heading
    const mainHeading = document.querySelector('.orders-container h1');
    if (mainHeading) mainHeading.textContent = currentTranslations.myOrders;

    // Update login required message
    const loginRequiredMessage = document.querySelector('.message-box p');
    if (loginRequiredMessage) loginRequiredMessage.textContent = currentTranslations.loginRequired;

    // Update login button
    if (loginBtn) loginBtn.textContent = currentTranslations.loginBtn;

    // Update tab buttons
    const tabLabels = [currentTranslations.activeOrders, currentTranslations.pastOrders, currentTranslations.orderDetails];
    document.querySelectorAll('.tab-btn').forEach((btn, index) => {
        if (index < tabLabels.length) {
            btn.textContent = tabLabels[index];
        }
    });

    // Update form labels
    if (orderDetailsForm) {
        // Billing section
        document.querySelector('.form-section:nth-child(1) h2').textContent = currentTranslations.billingInfo;
        document.querySelector('label[for="billing-name"]').textContent = `${currentTranslations.name}*:`; 
        document.querySelector('label[for="billing-address"]').textContent = `${currentTranslations.streetAddress}*:`; 
        document.querySelector('label[for="billing-city"]').textContent = `${currentTranslations.city}*:`; 
        document.querySelector('label[for="billing-postcode"]').textContent = `${currentTranslations.postcode}*:`; 
        document.querySelector('label[for="billing-phone"]').textContent = `${currentTranslations.phone}*:`; 
        document.querySelector('label[for="billing-contact"]').textContent = `${currentTranslations.contactPerson}:`;

        // Shipping section
        document.querySelector('.form-section:nth-child(2) h2').textContent = currentTranslations.shippingInfo;
        document.querySelector('label[for="same-as-billing"]').textContent = currentTranslations.sameAsBilling;
        document.querySelector('label[for="shipping-name"]').textContent = `${currentTranslations.shippingName}:`;
        document.querySelector('label[for="shipping-address"]').textContent = `${currentTranslations.streetAddress}:`;
        document.querySelector('label[for="shipping-city"]').textContent = `${currentTranslations.city}:`;
        document.querySelector('label[for="shipping-postcode"]').textContent = `${currentTranslations.postcode}:`;
        document.querySelector('label[for="shipping-phone"]').textContent = `${currentTranslations.phone}:`;
        document.querySelector('label[for="shipping-contact"]').textContent = `${currentTranslations.contactPerson}:`;

        // Other section
        document.querySelector('.form-section:nth-child(3) h2').textContent = currentTranslations.otherInfo;
        document.querySelector('label[for="newsletter"]').textContent = currentTranslations.newsletter;
        document.querySelector('label[for="school-support"]').textContent = currentTranslations.schoolSupport;
        document.querySelector('label[for="school-code"]').textContent = currentTranslations.schoolCode;
        document.querySelector('label[for="privacy-policy"]').textContent = currentTranslations.privacyPolicy + '*';
        document.querySelector('.form-note').textContent = currentTranslations.requiredFields;
        document.querySelector('.save-btn').textContent = currentTranslations.saveBtn;
    }

    // Update empty orders messages
    const noActiveOrdersMsg = document.querySelector('#active-orders .no-orders-message p');
    if (noActiveOrdersMsg) noActiveOrdersMsg.textContent = currentTranslations.noActiveOrders;

    const noPastOrdersMsg = document.querySelector('#past-orders .no-orders-message p');
    if (noPastOrdersMsg) noPastOrdersMsg.textContent = currentTranslations.noPastOrders;
}

// Initialize tab functionality
function initTabs() {
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            
            // Remove active class from all tabs
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to selected tab
            button.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });
}

// Initialize form functionality
function initForm() {
    if (sameAsBillingCheckbox) {
        sameAsBillingCheckbox.addEventListener('change', () => {
            shippingDetails.style.display = sameAsBillingCheckbox.checked ? 'none' : 'block';
        });
    }

    if (orderDetailsForm) {
        orderDetailsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveOrderDetails();
        });
    }

    // Add click handler to login button
    const loginBtn = loginRequired?.querySelector('.login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            const authModal = document.getElementById('authModal');
            if (authModal) {
                authModal.style.display = 'block';
            } else {
                // If no auth modal exists, redirect to home page
                window.location.href = 'index.html';
            }
        });
    }
}

// Load user's active and past orders in real-time from userOrders collection
function loadUserOrderData() {
    const user = firebase.auth().currentUser;
    if (!user) return;

    // Real-time listener for all orders (no status filter)
    db.collection('userOrders')
        .where('userId', '==', user.uid)
        .orderBy('orderDate', 'desc')
        .onSnapshot(snapshot => {
            renderOrders(snapshot, 'active-orders');
        }, error => {
            console.error('Error loading user orders:', error);
        });
}

// Render orders in the specified container
function renderOrders(snapshot, containerId) {
    const ordersList = document.querySelector(`#${containerId} .orders-list`);
    const noOrdersMessage = ordersList.querySelector('.no-orders-message');
    
    // Clear previous orders
    ordersList.querySelectorAll('.order-item').forEach(el => el.remove());

    if (snapshot.empty) {
        if (noOrdersMessage) {
            noOrdersMessage.style.display = 'block';
        }
        return;
    }

    // Hide no orders message
    if (noOrdersMessage) {
        noOrdersMessage.style.display = 'none';
    }

    // Create order elements
    snapshot.forEach(doc => {
        const order = doc.data();
        const orderElement = createOrderElement(doc.id, order);
        ordersList.appendChild(orderElement);
    });
}

// Create an order element
function createOrderElement(orderId, order) {
    const orderElement = document.createElement('div');
    orderElement.className = 'order-item';
    
    // Format order date
    const orderDate = order.orderDate?.toDate() || new Date();
    const formattedDate = `${orderDate.toLocaleDateString('hu-HU')} ${orderDate.toLocaleTimeString('hu-HU')}`;
    
    // Get order status text
    const statusText = getOrderStatusText(order.status);
    
    // Create order HTML
    orderElement.innerHTML = `
        <div class="order-header">
            <h3>Rendelés #${orderId.slice(-6)}</h3>
            <span class="status-badge status-${order.status}">${statusText}</span>
        </div>
        <div class="order-details">
            <p><strong>Dátum:</strong> ${formattedDate}</p>
            <p><strong>Termékek:</strong> ${order.itemCount} db</p>
            <p><strong>Összeg:</strong> ${order.total.toLocaleString('hu-HU')} Ft</p>
        </div>
        <div class="order-products">
            <h4>Megrendelt termékek</h4>
            <div class="product-list">
                ${order.items.map(item => `
                    <div class="product-item">
                        <img src="${item.image || 'diplant.jpeg'}" 
                             alt="${item.title}"
                             onerror="this.onerror=null; this.src='diplant.jpeg'">
                        <div class="product-details">
                            <h4>${item.title}</h4>
                            <p>${item.author || ''}</p>
                            <p>Mennyiség: ${item.quantity} db</p>
                        </div>
                        <div class="product-price">
                            ${(item.price * item.quantity).toLocaleString('hu-HU')} Ft
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    return orderElement;
}

// Get order status text based on status code
function getOrderStatusText(status) {
    const statusTexts = {
        'hu': {
            'pending': 'Függőben',
            'processing': 'Feldolgozás alatt',
            'shipped': 'Szállítás alatt',
            'delivered': 'Kézbesítve'
        },
        'en': {
            'pending': 'Pending',
            'processing': 'Processing',
            'shipped': 'Shipped',
            'delivered': 'Delivered'
        }
    };
    
    return statusTexts[currentLanguage]?.[status] || status;
}

// Load user's saved billing and shipping details
function loadUserDetailsData() {
    const user = firebase.auth().currentUser;
    if (!user || !orderDetailsForm) return;

    db.collection('users').doc(user.uid).get()
        .then(doc => {
            if (doc.exists) {
                const userData = doc.data();
                
                // Fill billing info
                if (userData.billing) {
                    document.getElementById('billing-name').value = userData.billing.name || '';
                    document.getElementById('billing-address').value = userData.billing.address || '';
                    document.getElementById('billing-city').value = userData.billing.city || '';
                    document.getElementById('billing-postcode').value = userData.billing.postcode || '';
                    document.getElementById('billing-phone').value = userData.billing.phone || '';
                    document.getElementById('billing-contact').value = userData.billing.contact || '';
                }
                
                // Fill shipping info
                if (userData.shipping) {
                    document.getElementById('shipping-name').value = userData.shipping.name || '';
                    document.getElementById('shipping-address').value = userData.shipping.address || '';
                    document.getElementById('shipping-city').value = userData.shipping.city || '';
                    document.getElementById('shipping-postcode').value = userData.shipping.postcode || '';
                    document.getElementById('shipping-phone').value = userData.shipping.phone || '';
                    document.getElementById('shipping-contact').value = userData.shipping.contact || '';
                    
                    // Uncheck same as billing if shipping data exists
                    if (userData.shipping.name || userData.shipping.address) {
                        document.getElementById('same-as-billing').checked = false;
                        document.getElementById('shipping-details').style.display = 'block';
                    }
                }
                
                // Fill other info
                if (userData.preferences) {
                    document.getElementById('newsletter').checked = userData.preferences.newsletter || false;
                    document.getElementById('school-code').value = userData.preferences.schoolCode || '';
                }
            }
        })
        .catch(error => {
            console.error('Error loading user details:', error);
        });
}

// Save order details
function saveOrderDetails() {
    const user = firebase.auth().currentUser;
    if (!user) {
        showNotification('A rendelési adatok mentéséhez bejelentkezés szükséges!', 'error');
        return;
    }
    
    // Validate required fields
    if (!validateRequiredFields()) {
        return;
    }
    
    const sameAsBilling = document.getElementById('same-as-billing').checked;
    
    // Get billing data
    const billingData = {
        name: document.getElementById('billing-name').value,
        address: document.getElementById('billing-address').value,
        city: document.getElementById('billing-city').value,
        postcode: document.getElementById('billing-postcode').value,
        phone: document.getElementById('billing-phone').value,
        contact: document.getElementById('billing-contact').value
    };
    
    // Get shipping data (if different from billing)
    let shippingData = sameAsBilling ? billingData : {
        name: document.getElementById('shipping-name').value,
        address: document.getElementById('shipping-address').value,
        city: document.getElementById('shipping-city').value,
        postcode: document.getElementById('shipping-postcode').value,
        phone: document.getElementById('shipping-phone').value,
        contact: document.getElementById('shipping-contact').value
    };
    
    // Get preferences
    const preferences = {
        newsletter: document.getElementById('newsletter').checked,
        schoolCode: document.getElementById('school-code').value,
        privacyPolicy: document.getElementById('privacy-policy').checked
    };
    
    // Save to Firestore (using set with merge to work with both new and existing users)
    db.collection('users').doc(user.uid).set({
        email: user.email, // Save email in case this is a new user
        billing: billingData,
        shipping: shippingData,
        preferences: preferences,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true })
    .then(() => {
        const message = currentLanguage === 'hu' ? 
            'Adatok sikeresen mentve!' : 
            'Data successfully saved!';
        showNotification(message);
    })
    .catch(error => {
        console.error('Error saving order details:', error);
        const message = currentLanguage === 'hu' ? 
            'Hiba történt az adatok mentése során!' : 
            'Error saving data!';
        showNotification(message, 'error');
    });
}

// Validate required fields
function validateRequiredFields() {
    // Required fields
    const required = [
        { id: 'billing-name', label: currentLanguage === 'hu' ? 'Név' : 'Name' },
        { id: 'billing-address', label: currentLanguage === 'hu' ? 'Utca/házszám' : 'Street/House Number' },
        { id: 'billing-city', label: currentLanguage === 'hu' ? 'Település' : 'City' },
        { id: 'billing-postcode', label: currentLanguage === 'hu' ? 'Irányítószám' : 'Postal Code' },
        { id: 'billing-phone', label: currentLanguage === 'hu' ? 'Telefon' : 'Phone' }
    ];
    
    // Check required fields
    let isValid = true;
    required.forEach(field => {
        const element = document.getElementById(field.id);
        if (!element.value) {
            isValid = false;
            element.classList.add('error');
            
            // Add error message if not present
            let errorMsg = element.nextElementSibling;
            if (!errorMsg || !errorMsg.classList.contains('error-message')) {
                errorMsg = document.createElement('div');
                errorMsg.className = 'error-message';
                errorMsg.textContent = `${field.label} ${currentLanguage === 'hu' ? 'kötelező!' : 'is required!'}`;
                element.parentNode.insertBefore(errorMsg, element.nextSibling);
            }
        } else {
            element.classList.remove('error');
            const errorMsg = element.nextElementSibling;
            if (errorMsg && errorMsg.classList.contains('error-message')) {
                errorMsg.remove();
            }
        }
    });
    
    // Check privacy policy checkbox
    const privacyCheckbox = document.getElementById('privacy-policy');
    if (!privacyCheckbox.checked) {
        isValid = false;
        privacyCheckbox.classList.add('error');
        
        // Add error message if not present
        const container = privacyCheckbox.closest('.checkbox-group');
        let errorMsg = container.nextElementSibling;
        if (!errorMsg || !errorMsg.classList.contains('error-message')) {
            errorMsg = document.createElement('div');
            errorMsg.className = 'error-message';
            errorMsg.textContent = currentLanguage === 'hu' ? 
                'Az adatvédelmi nyilatkozat elfogadása kötelező!' : 
                'You must accept the privacy policy!';
            container.parentNode.insertBefore(errorMsg, container.nextSibling);
        }
    } else {
        privacyCheckbox.classList.remove('error');
        const container = privacyCheckbox.closest('.checkbox-group');
        const errorMsg = container.nextElementSibling;
        if (errorMsg && errorMsg.classList.contains('error-message')) {
            errorMsg.remove();
        }
    }
    
    // Check postal code format (simple 4-digit validation for Hungary)
    const postcodeField = document.getElementById('billing-postcode');
    if (postcodeField.value && !/^\d{4}$/.test(postcodeField.value)) {
        isValid = false;
        postcodeField.classList.add('error');
        
        // Add error message if not present
        let errorMsg = postcodeField.nextElementSibling;
        if (!errorMsg || !errorMsg.classList.contains('error-message')) {
            errorMsg = document.createElement('div');
            errorMsg.className = 'error-message';
            errorMsg.textContent = currentLanguage === 'hu' ? 
                'Az irányítószám 4 számjegyből áll!' : 
                'Postal code must be 4 digits!';
            postcodeField.parentNode.insertBefore(errorMsg, postcodeField.nextSibling);
        }
    }
    
    return isValid;
}

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Cart functionality for cart icon and counter
function updateCartCount() {
    let cart = [];
    try {
        cart = JSON.parse(localStorage.getItem('cart')) || [];
    } catch (e) {}
    const cartCount = document.querySelector('.cart-count');
    if (cartCount) {
        const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
        cartCount.textContent = totalItems;
    }
}
