// Default placeholder image
const defaultPlaceholder = 'diplant.jpeg';

// Shopping cart functionality

function handleImageError(img) {
    img.onerror = null; // Prevent infinite loop
    img.src = defaultPlaceholder;
}

// Mobile menu functionality
const mobileMenuButton = document.querySelector('.mobile-menu');
const navLinks = document.querySelector('.nav-links');
const userActions = document.querySelector('.user-actions');

if (mobileMenuButton && navLinks && userActions) {
    mobileMenuButton.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        userActions.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
        if (!navLinks.contains(e.target) && !mobileMenuButton.contains(e.target)) {
            navLinks.classList.remove('active');
            userActions.classList.remove('active');
        }
    });
}

// Language handling
let currentLanguage = localStorage.getItem('language') || 'hu';

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
    document.documentElement.lang = currentLanguage;
    
    // Translate text content with data-translate attribute
    document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.dataset.translate;
        if (translations[currentLanguage][key]) {
            element.textContent = translations[currentLanguage][key];
        }
    });
    
    // Translate placeholders with data-translate-placeholder
    document.querySelectorAll('[data-translate-placeholder]').forEach(element => {
        const key = element.dataset.translatePlaceholder;
        if (translations[currentLanguage][key]) {
            element.placeholder = translations[currentLanguage][key];
        }
    });
    
    // Special handling for existing elements
    const elements = {
        logo: document.querySelector('.logo'),
        searchInput: document.getElementById('searchInput'),
        ordersLink: document.getElementById('ordersLink'),
        loginBtn: document.getElementById('loginBtn'),
        logoutBtn: document.getElementById('logoutBtn'),
        cartItems: document.querySelector('.cart-count'),
    };

    // Update text content if elements exist
    if (elements.logo) elements.logo.textContent = translations[currentLanguage].logo;
    if (elements.searchInput) elements.searchInput.placeholder = translations[currentLanguage].search;
    if (elements.ordersLink) elements.ordersLink.textContent = translations[currentLanguage].orders;
    if (elements.loginBtn) elements.loginBtn.textContent = translations[currentLanguage].login;
    if (elements.logoutBtn) elements.logoutBtn.textContent = translations[currentLanguage].logout;

    // Translate navigation links
    const subNavLinks = document.querySelectorAll('.sub-nav-link');
    subNavLinks.forEach(link => {
        if (link.textContent.includes('Főoldal') || link.textContent.includes('Home')) {
            link.textContent = translations[currentLanguage].home;
        }
        if (link.textContent.includes('Könyvek') || link.textContent.includes('Books')) {
            link.textContent = translations[currentLanguage].books;
        }
        if (link.textContent.includes('Rólunk') || link.textContent.includes('About')) {
            link.textContent = translations[currentLanguage].about;
        }
        if (link.textContent.includes('Kapcsolat') || link.textContent.includes('Contact')) {
            link.textContent = translations[currentLanguage].contact;
        }
    });

    // Translate book categories in dropdown
    const dropdownLinks = document.querySelectorAll('.books-dropdown a, .sub-books-dropdown a');
    dropdownLinks.forEach(link => {
        if (link.textContent.includes('Összes') || link.textContent.includes('All')) {
            link.textContent = translations[currentLanguage].allBooks;
        }
        if (link.textContent.includes('Szerző') || link.textContent.includes('Author')) {
            link.textContent = translations[currentLanguage].byAuthor;
        }
        if (link.textContent.includes('Nyelv') || link.textContent.includes('Language')) {
            link.textContent = translations[currentLanguage].byLanguage;
        }
        if (link.textContent.includes('Kiadó') || link.textContent.includes('Publisher')) {
            link.textContent = translations[currentLanguage].byPublisher;
        }
        if (link.textContent.includes('Téma') || link.textContent.includes('Topic')) {
            link.textContent = translations[currentLanguage].byTopic;
        }
    });

    // Translate footer sections
    const footerSections = document.querySelectorAll('.footer-section h4');
    footerSections.forEach(section => {
        if (section.textContent.includes('Gyors') || section.textContent.includes('Quick')) {
            section.textContent = translations[currentLanguage].quickLinks;
        }
        if (section.textContent.includes('Kövessen') || section.textContent.includes('Follow')) {
            section.textContent = translations[currentLanguage].followUs;
        }
    });

    // Translate copyright
    const copyright = document.querySelector('.footer-bottom p');
    if (copyright) {
        copyright.textContent = translations[currentLanguage].copyright;
    }

    // Homepage specific translations
    const heroTitle = document.querySelector('.hero-content h1');
    const heroSubtitle = document.querySelector('.hero-content p');
    const ctaButton = document.querySelector('.cta-button');
    const readerTypeQuestion = document.querySelector('.slideshow-question');
    const readerTypes = document.querySelectorAll('.slide');

    if (heroTitle) heroTitle.textContent = translations[currentLanguage].welcome;
    if (heroSubtitle) heroSubtitle.textContent = translations[currentLanguage].subtitle;
    if (ctaButton) ctaButton.textContent = translations[currentLanguage].browseBooks;
    if (readerTypeQuestion) readerTypeQuestion.textContent = translations[currentLanguage].readerType;

    // Translate reader type slides
    if (readerTypes) {
        readerTypes.forEach(slide => {
            const heading = slide.querySelector('h3');
            const description = slide.querySelector('p');
            
            if (heading) {
                if (heading.textContent.includes('Tanár') || heading.textContent.includes('Teacher')) {
                    heading.textContent = translations[currentLanguage].teacher;
                    description.textContent = translations[currentLanguage].teacherDesc;
                }
                if (heading.textContent.includes('Nyelvtanuló') || heading.textContent.includes('Language Learner')) {
                    heading.textContent = translations[currentLanguage].student;
                    description.textContent = translations[currentLanguage].studentDesc;
                }
                if (heading.textContent.includes('Szülő') || heading.textContent.includes('Parent')) {
                    heading.textContent = translations[currentLanguage].parent;
                    description.textContent = translations[currentLanguage].parentDesc;
                }
                if (heading.textContent.includes('Ajándékozó') || heading.textContent.includes('Gift')) {
                    heading.textContent = translations[currentLanguage].gifter;
                    description.textContent = translations[currentLanguage].gifterDesc;
                }
                if (heading.textContent.includes('Gyűjtő') || heading.textContent.includes('Collector')) {
                    heading.textContent = translations[currentLanguage].collector;
                    description.textContent = translations[currentLanguage].collectorDesc;
                }
            }
        });
    }

    // Call shared translation helper for common elements
    translateSharedElements();
}

// Dynamic book loading
function createBookCard(book) {
    const authorHtml = book.author && book.author.trim() !== '' && book.author.toLowerCase() !== 'ismeretlen szerző'
                       ? `<p class="author">${book.author}</p>`
                       : '';
    const priceHtml = book.price ? `${book.price} Ft` : 'Ár nem elérhető';

    return `
        <div class="book-card">
            <img src="${book.image || defaultPlaceholder}" 
                 alt="${book.title || 'Cím nélkül'}" 
                 class="book-image"
                 onerror="handleImageError(this)">
            <div class="book-info">
                <h3>${book.title || 'Cím nélkül'}</h3>
                ${authorHtml}
                <p class="price">${priceHtml}</p>
                <button class="add-to-cart" data-book-id="${book.id}">
                    <i class="fas fa-shopping-cart"></i> Kosárba tesz
                </button>
            </div>
        </div>
    `;
}

// Search functionality
const searchForm = document.getElementById('searchForm');
const searchInput = document.getElementById('searchInput');

if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const query = searchInput.value.trim();
        if (query) {
            // Redirect to konyvek.html with the search query
            window.location.href = `konyvek.html?search=${encodeURIComponent(query)}`;
        }
    });
}

// Function to handle search on konyvek.html page
function handleSearchQuery() {
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('search');
    
    if (searchQuery && window.location.pathname.includes('konyvek.html')) {
        // Set the search input value
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = searchQuery;
        }
        // Perform the search
        searchBooks(searchQuery);
    }
}

// Contact form handling
const contactForm = document.querySelector('.contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
    });
}

// Slideshow functionality
document.addEventListener('DOMContentLoaded', function() {
    // Only target slides inside the main landing slideshow
    const slideshowContainer = document.querySelector('.landing-visuals .slideshow-container');
    if (!slideshowContainer) return;
    const slides = slideshowContainer.querySelectorAll('.slide');
    const dotsContainer = slideshowContainer.parentElement.querySelector('.slideshow-dots');
    let currentSlide = 0;

    // Create dots
    dotsContainer.innerHTML = '';
    slides.forEach((_, index) => {
        const dot = document.createElement('div');
        dot.classList.add('dot');
        dot.addEventListener('click', () => goToSlide(index));
        dotsContainer.appendChild(dot);
    });

    const dots = dotsContainer.querySelectorAll('.dot');

    showSlide(0);

    let timer = setInterval(() => {
        nextSlide();
    }, 7000);

    function showSlide(n) {
        slides.forEach(slide => slide.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));
        slides[n].classList.add('active');
        dots[n].classList.add('active');
        currentSlide = n;
    }

    function nextSlide() {
        const next = (currentSlide + 1) % slides.length;
        showSlide(next);
    }

    function goToSlide(n) {
        showSlide(n);
        clearInterval(timer);
        timer = setInterval(() => {
            nextSlide();
        }, 7000);
    }

    // Attach prev/next button handlers
    const prevBtn = slideshowContainer.querySelector('.slideshow-prev');
    const nextBtn = slideshowContainer.querySelector('.slideshow-next');
    if (prevBtn) prevBtn.onclick = () => goToSlide((currentSlide - 1 + slides.length) % slides.length);
    if (nextBtn) nextBtn.onclick = () => goToSlide((currentSlide + 1) % slides.length);
});

// Load popular books
async function loadPopularBooks() {
    const bookGrid = document.querySelector('.book-grid');
    if (!bookGrid) return;
    try {
        const snapshot = await firebase.firestore().collection('books').limit(30).get();
        const allBooks = [];
        snapshot.forEach(doc => {
            const book = { id: doc.id, ...doc.data() };
            allBooks.push(book);
        });
        
        const validBooks = allBooks; // Use all fetched books or apply other non-display related filters

        for (let i = validBooks.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [validBooks[i], validBooks[j]] = [validBooks[j], validBooks[i]];
        }
        const selectedBooks = validBooks.slice(0, 11);
        window.books = selectedBooks; // Make selectedBooks available globally

        bookGrid.innerHTML = selectedBooks.map((book, idx) => {
            const authorHtml = book.author && book.author.trim() !== '' && book.author.toLowerCase() !== 'ismeretlen szerző'
                               ? `<p class="author">${book.author}</p>`
                               : '';
            const bookPrice = book.price ? `${book.price} Ft` : 'Ár nem elérhető';
            const addToCartBtn = `<button class="add-to-cart" data-book-id="${book.id}"><i class='fas fa-shopping-cart'></i> Kosárba</button>`;
            
            const cardClass = idx === 0 ? "book-card special-book" : "book-card";

            return `
                <div class="${cardClass}">
                    <img src="${book.image || 'diplant.jpeg'}" alt="${book.title || 'Cím nélkül'}" class="book-image" onerror="this.onerror=null;this.src='diplant.jpeg'">
                    <div class="book-info">
                        <h3>${book.title || 'Cím nélkül'}</h3>
                        ${authorHtml}
                        <p class="price">${bookPrice}</p>
                        ${addToCartBtn}
                    </div>
                </div>
            `;
        }).join('');
        
        bookGrid.querySelectorAll('.add-to-cart').forEach(btn => {
            btn.addEventListener('click', function() {
                const bookId = this.getAttribute('data-book-id');
                if (window.addToCart) {
                    window.addToCart(bookId);
                }
            });
        });
    } catch (error) {
        console.error('Error loading popular books:', error);
        bookGrid.innerHTML = '<p>Nem sikerült betölteni a könyveket.</p>';
    }
}

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    // loadBooks(); // Commented out to show only demo books
    handleSearchQuery();
    initLanguage();
    loadPopularBooks();
    
    // Fix smooth scroll for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            if (this.getAttribute('href') === '#konyvek' && window.innerWidth <= 768) {
                return; // Let the mobile dropdown handler handle this
            }
            
            e.preventDefault();
            const targetId = this.getAttribute('href').slice(1);
            if (targetId) { // Only scroll if the href is not just "#"
                const target = document.getElementById(targetId);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth'
                    });
                    // Close mobile menu if open
                    navLinks.classList.remove('active');
                    if (userActions) {
                        userActions.classList.remove('active');
                    }
                }
            }
        });
    });

    // Add click handler to cart icon to navigate to cart page
    const cartIcon = document.querySelector('.cart');
    if (cartIcon) {
        cartIcon.addEventListener('click', () => {
            window.location.href = 'cart.html';
        });
    }
});

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

// Styles for notifications and mobile menu
const style = document.createElement('style');
style.textContent = `
    .notification {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background-color: var(--primary-color);
        color: white;
        padding: 1rem;
        border-radius: 5px;
        animation: slideIn 0.3s ease-out;
        z-index: 1000;
    }

    @keyframes slideIn {
        from { transform: translateX(100%); }
        to { transform: translateX(0); }
    }

    @media (max-width: 768px) {
        .nav-links.active {
            display: flex;
            flex-direction: column;
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background-color: var(--primary-color);
            padding: 1rem;
        }

        .nav-links.active a {
            margin: 0.5rem 0;
        }
    }

    .book-image {
        width: 100%;
        height: 300px;
        object-fit: cover;
    }

    .book-info {
        padding: 1rem;
    }

    .add-to-cart {
        background-color: var(--primary-color);
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 5px;
        cursor: pointer;
        width: 100%;
        margin-top: 1rem;
        transition: background-color 0.3s;
    }

    .add-to-cart:hover {
        background-color: var(--secondary-color);
    }

    .special-book {
        grid-column: span 2;
        grid-row: span 1;
        border: 3px solid #d4a276 !important;
        box-shadow: 0 4px 24px rgba(176,137,104,0.18) !important;
        transform: scale(1.04);
        z-index: 2;
    }
    @media (max-width: 900px) {
        .special-book {
            grid-column: span 1;
            grid-row: span 1;
        }
    }
    .special-book .book-image {
        height: 340px;
        object-fit: cover;
    }
`;
document.head.appendChild(style);