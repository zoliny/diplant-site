// Load cart from localStorage
let cart = JSON.parse(localStorage.getItem('cart') || '[]');
const cartCount = document.querySelector('.cart-count');
const cartItems = document.querySelector('.cart-items');
const itemCountElement = document.getElementById('itemCount');
const totalPriceElement = document.getElementById('totalPrice');
const checkoutBtn = document.getElementById('checkoutBtn');

// Initialize translations

document.addEventListener('DOMContentLoaded', () => {
    initLanguage();
});

// Ensure cart is saved and reloaded properly when navigating between pages
window.addEventListener('beforeunload', () => {
    localStorage.setItem('cart', JSON.stringify(cart));
});

document.addEventListener('DOMContentLoaded', () => {
    // Reload cart from localStorage on page load
    cart = JSON.parse(localStorage.getItem('cart') || '[]');
    renderCart();
    updateCartCount();
    updateCartTotal();

    // Ensure the auth state is properly observed on the cart page
    checkAuthState();

    // Ensure ordersLink is shown if user is logged in
    if (firebase && firebase.auth) {
        firebase.auth().onAuthStateChanged(user => {
            const ordersLink = document.getElementById('ordersLink');
            if (ordersLink) {
                if (user) {
                    ordersLink.style.display = 'inline-block';
                    ordersLink.href = 'rendelesek.html';
                } else {
                    ordersLink.style.display = 'none';
                }
                ordersLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    window.location.href = 'rendelesek.html';
                });
            }
        });
    }

    // Add close handler for profile modal
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

    // Fix: Always re-select close buttons after DOM is ready
    setTimeout(() => {
        const profileModal = document.getElementById('profileModal');
        if (profileModal) {
            const closeBtns = profileModal.querySelectorAll('.close');
            closeBtns.forEach(btn => {
                btn.onclick = function() {
                    profileModal.style.display = 'none';
                };
            });
        }
    }, 0);
});

function initLanguage() {
    const languageOptions = document.querySelectorAll('.language-option');
    const currentLangSpan = document.getElementById('currentLang');
    
    // Set initial language display
    updateLanguageDisplay();

    // Add click handlers for language options
    languageOptions.forEach(option => {
        option.addEventListener('click', () => {
            const newLang = option.getAttribute('data-lang');
            currentLanguage = newLang;
            localStorage.setItem('language', newLang);
            updateLanguageDisplay();
            translatePage();
            // Reload cart to update any translated content
            loadCart();
        });
    });
}

function updateLanguageDisplay() {
    const currentLangSpan = document.getElementById('currentLang');
    const languageOptions = document.querySelectorAll('.language-option');
    const languageBtn = document.querySelector('.language-btn');
    
    if (currentLangSpan) {
        currentLangSpan.textContent = translations[currentLanguage][`language${currentLanguage.toUpperCase()}`];
        
        if (languageBtn) {
            const globeIcon = document.createElement('i');
            globeIcon.className = 'fas fa-globe';
            const chevronIcon = document.createElement('i');
            chevronIcon.className = 'fas fa-chevron-down';
            
            languageBtn.innerHTML = '';
            languageBtn.appendChild(globeIcon);
            languageBtn.appendChild(currentLangSpan);
            languageBtn.appendChild(chevronIcon);
        }
    }
    
    // Update language options text
    languageOptions.forEach(option => {
        const lang = option.getAttribute('data-lang');
        option.textContent = translations[currentLanguage][`language${lang.toUpperCase()}`];
        
        if (lang === currentLanguage) {
            option.classList.add('active');
        } else {
            option.classList.remove('active');
        }
    });
}

function translatePage() {
    // Update page title
    document.title = currentLanguage === 'hu' ? 'Kosár - Di-Plant Nyelvkönyvbolt' : 'Cart - Di-Plant Language Bookstore';
    
    // Translate static elements
    const elements = {
        logo: document.querySelector('.logo'),
        cartTitle: document.querySelector('.cart-section h1'),
        summaryTitle: document.querySelector('.cart-summary h3'),
        checkoutBtn: document.getElementById('checkoutBtn'),
        itemCountLabel: document.querySelector('.summary-details p:first-child'),
        totalPriceLabel: document.querySelector('.summary-details p:last-child')
    };

    if (elements.logo) elements.logo.textContent = translations[currentLanguage].logo;
    if (elements.cartTitle) elements.cartTitle.textContent = translations[currentLanguage].cart;
    if (elements.summaryTitle) elements.summaryTitle.textContent = translations[currentLanguage].total;
    if (elements.checkoutBtn) elements.checkoutBtn.textContent = translations[currentLanguage].checkout;
    
    // Update footer and navigation elements using shared translation code
    translateSharedElements();
}

// Update cart count
function updateCartCount() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartCount) cartCount.textContent = totalItems;
    if (itemCountElement) itemCountElement.textContent = totalItems;
}

// Update cart total
function updateCartTotal() {
    if (!totalPriceElement) return;
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    totalPriceElement.textContent = total.toLocaleString('hu-HU');
    if (checkoutBtn) {
        checkoutBtn.disabled = total === 0;
    }
}

// Update quantity
function updateQuantity(bookId, change) {
    const cartItem = cart.find(item => item.id === bookId);
    if (cartItem) {
        cartItem.quantity = Math.max(1, cartItem.quantity + change);
        saveAndRenderCart();
    }
}

// Remove item from cart
function removeFromCart(bookId) {
    cart = cart.filter(item => item.id !== bookId);
    saveAndRenderCart();
}

// Save cart to localStorage and update UI
function saveAndRenderCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    updateCartTotal();
    renderCart();
}

// Render cart items
function renderCart() {
    if (!cartItems) return;

    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="empty-cart">A kosár üres</p>';
        return;
    }

    cartItems.innerHTML = cart.map(item => `
        <div class="cart-item">
            <img src="${item.image || 'diplant.jpeg'}" 
                 alt="${item.title}"
                 onerror="this.onerror=null; this.src='diplant.jpeg'">
            <div class="item-details">
                <h3>${item.title}</h3>
                <p class="author">${item.author}</p>
                <p class="price">${item.price.toLocaleString('hu-HU')} Ft</p>
            </div>
            <div class="item-actions">
                <div class="quantity-control">
                    <button class="quantity-btn" onclick="updateQuantity('${item.id}', -1)">-</button>
                    <span>${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateQuantity('${item.id}', 1)">+</button>
                </div>
                <button class="remove-item" onclick="removeFromCart('${item.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Handle checkout
if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
        if (!firebase.auth().currentUser) {
            showNotification('A megrendeléshez be kell jelentkezni!', 'error');
            return;
        }

        // Get current user info
        const currentUser = firebase.auth().currentUser;
        
        // Create order in Firestore with enhanced information
        const order = {
            userId: currentUser.uid,
            userEmail: currentUser.email,
            userName: currentUser.displayName || '',
            items: cart,
            total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            itemCount: cart.reduce((sum, item) => sum + item.quantity, 0),
            status: 'pending',
            orderDate: firebase.firestore.FieldValue.serverTimestamp(),
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Save to new userOrders collection for real-time updates
        db.collection('userOrders').add(order)
            .then(() => {
                cart = [];
                saveAndRenderCart();
                showNotification(currentLanguage === 'hu' ? 
                    'Rendelését sikeresen rögzítettük!' : 
                    'Your order has been successfully recorded!');
                // Optional: redirect to orders page
                // window.location.href = 'rendelesek.html';
            })
            .catch(error => {
                console.error('Error creating order:', error);
                showNotification(currentLanguage === 'hu' ? 
                    'Hiba történt a rendelés során!' : 
                    'An error occurred during the ordering process!', 
                    'error');
            });
    });
}

// Global addToCart function for all pages
window.addToCart = function(bookId) {
    console.log('[DEBUG] addToCart called with bookId:', bookId);
    // Try to find the book in global book arrays
    let book = null;
    if (window.allBooks && Array.isArray(window.allBooks)) {
        book = window.allBooks.find(b => b.id === bookId);
    }
    if (!book && window.books && Array.isArray(window.books)) {
        book = window.books.find(b => b.id === bookId);
    }
    if (!book) {
        console.error('[DEBUG] Book not found for id:', bookId, 'window.books:', window.books, 'window.allBooks:', window.allBooks);
        showNotification('Nem található a könyv adata.', 'error');
        return;
    }
    // Check if book already exists in cart
    const existingItem = cart.find(item => item.id === bookId);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            ...book,
            quantity: 1
        });
    }
    saveAndRenderCart();
    showNotification('Könyv hozzáadva a kosárhoz!');
};

// Make updateCartCount global for all pages
window.updateCartCount = updateCartCount;

// Initialize cart on page load
document.addEventListener('DOMContentLoaded', () => {
    // Add click handler to cart icon to navigate to cart page
    const cartIcon = document.querySelector('.cart');
    if (cartIcon) {
        cartIcon.addEventListener('click', () => {
            if (!window.location.pathname.includes('cart.html')) {
                window.location.href = 'cart.html';
            }
        });
    }
    
    renderCart();
    updateCartCount();
    updateCartTotal();
    
    // Ensure the auth state is properly observed on the cart page
    checkAuthState();
});

// Check authentication state to show/hide appropriate buttons
function checkAuthState() {
    // Verify that firebase auth is available
    if (firebase && firebase.auth) {
        firebase.auth().onAuthStateChanged((user) => {
            const loginBtn = document.getElementById('loginBtn');
            const profileBtn = document.getElementById('profileBtn');
            const logoutBtn = document.getElementById('logoutBtn');
            const ordersLink = document.getElementById('ordersLink');
            const navbar = document.querySelector('.navbar');
            
            if (user) {
                // User is logged in
                if (loginBtn) loginBtn.style.display = 'none';
                if (profileBtn) profileBtn.style.display = 'inline-block';
                if (logoutBtn) logoutBtn.style.display = 'inline-block';
                if (ordersLink) ordersLink.style.display = 'inline-block';
                if (navbar) navbar.classList.add('logged-in');
                
                // Add click handler for orders link
                if (ordersLink) {
                    ordersLink.onclick = (e) => {
                        e.preventDefault();
                        if (typeof showOrders === 'function') {
                            showOrders();
                        }
                    };
                }
            } else {
                // User is logged out
                if (loginBtn) loginBtn.style.display = 'inline-block';
                if (profileBtn) profileBtn.style.display = 'none';
                if (logoutBtn) logoutBtn.style.display = 'none';
                if (ordersLink) ordersLink.style.display = 'none';
                if (navbar) navbar.classList.remove('logged-in');
            }
        });
    }

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