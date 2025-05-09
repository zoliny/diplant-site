// Get parameters from URL
const urlParams = new URLSearchParams(window.location.search);
const filterParam = urlParams.get('filter');
const searchParam = urlParams.get('search');
const maxPriceParam = urlParams.get('max');

// Default placeholder image
const defaultPlaceholder = 'diplant.jpeg';

// Constants for book display limits
const DEFAULT_BOOK_LIMIT = 18;
const SEARCH_BOOK_LIMIT = 24;

// Filter elements
const authorFilter = document.getElementById('authorFilter');
const languageFilter = document.getElementById('languageFilter');
const publisherFilter = document.getElementById('publisherFilter');
const topicFilter = document.getElementById('topicFilter');
const searchInput = document.getElementById('searchInput');

// Filter suggestions elements
const authorSuggestions = document.getElementById('authorSuggestions');
const languageSuggestions = document.getElementById('languageSuggestions');
const publisherSuggestions = document.getElementById('publisherSuggestions');
const topicSuggestions = document.getElementById('topicSuggestions');

let allBooks = [];
window.allBooks = allBooks;
let filters = {
    author: '',
    language: '',
    publisher: '',
    topic: '',
    search: searchParam || '',
    maxPrice: maxPriceParam ? parseInt(maxPriceParam) : null
};

// Initialize translations
let currentLanguage = localStorage.getItem('language') || 'hu';

// Always delegate clicks for genre bubbles, even if DOMContentLoaded timing is off
(function ensureBubbleRedirect() {
    function handler(e) {
        const bubble = e.target.closest('.genre-bubble');
        if (bubble) {
            const genre = bubble.getAttribute('data-genre');
            if (genre) {
                console.log('[DEBUG] Genre bubble clicked:', genre); // Debug log
                window.location.href = `konyvek-list.html?theme=${encodeURIComponent(genre)}`;
            } else {
                console.log('[DEBUG] Genre bubble clicked but no data-genre found');
            }
        }
    }
    // Try to attach immediately
    const bubbleContainer = document.querySelector('.genre-bubbles-container');
    if (bubbleContainer) {
        console.log('[DEBUG] Attaching bubble click handler immediately');
        bubbleContainer.addEventListener('click', handler);
    } else {
        // If not found, try again after DOMContentLoaded
        document.addEventListener('DOMContentLoaded', function() {
            const bubbleContainer2 = document.querySelector('.genre-bubbles-container');
            if (bubbleContainer2) {
                console.log('[DEBUG] Attaching bubble click handler after DOMContentLoaded');
                bubbleContainer2.addEventListener('click', handler);
            } else {
                console.log('[DEBUG] genre-bubbles-container not found in DOM');
            }
        });
    }
})();

document.addEventListener('DOMContentLoaded', () => {
    initLanguage();
    loadBooks();

    // Writer search box filtering
    const writerSearch = document.getElementById('writerSearch');
    if (writerSearch) {
        writerSearch.addEventListener('input', function () {
            filters.author = this.value.trim();
            filters.topic = '';
            // Remove active class from all bubbles
            document.querySelectorAll('.genre-bubble').forEach(b => b.classList.remove('active'));
            // Limit to 20 books for author
            window.SEARCH_BOOK_LIMIT = 20;
            filterAndDisplayBooks();
        });
    }

    // Language checkbox filtering
    const langCheckboxes = document.querySelectorAll('.lang-checkbox');
    langCheckboxes.forEach(cb => {
        cb.addEventListener('change', function () {
            // Collect all checked languages
            const checked = Array.from(langCheckboxes).filter(c => c.checked).map(c => c.value.toLowerCase());
            filters.language = checked.join(',');
            // Limit to 20 books for language filter
            window.SEARCH_BOOK_LIMIT = 20;
            filterAndDisplayBooks();
        });
    });
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
            // Reload books to update any language-specific content
            loadBooks();
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
    document.title = currentLanguage === 'hu' ? 'Könyvek - Di-Plant Nyelvkönyvbolt' : 'Books - Di-Plant Language Bookstore';
    
    // Translate static elements
    const elements = {
        logo: document.querySelector('.logo'),
        searchInput: document.getElementById('searchInput'),
        filtersTitle: document.querySelector('.filter-group h3'),
        authorFilter: document.getElementById('authorFilter'),
        languageFilter: document.getElementById('languageFilter'),
        publisherFilter: document.getElementById('publisherFilter'),
        topicFilter: document.getElementById('topicFilter')
    };

    if (elements.logo) elements.logo.textContent = translations[currentLanguage].logo;
    if (elements.searchInput) elements.searchInput.placeholder = translations[currentLanguage].search;
    if (elements.filtersTitle) elements.filtersTitle.textContent = translations[currentLanguage].filters;
    if (elements.authorFilter) elements.authorFilter.placeholder = translations[currentLanguage].authorFilter;
    if (elements.languageFilter) elements.languageFilter.placeholder = translations[currentLanguage].languageFilter;
    if (elements.publisherFilter) elements.publisherFilter.placeholder = translations[currentLanguage].publisherFilter;
    if (elements.topicFilter) elements.topicFilter.placeholder = translations[currentLanguage].topicFilter;

    // Update footer and navigation elements using shared translation code
    translateSharedElements();
}

if (searchParam) {
    searchInput.value = searchParam;
}

async function loadBooks() {
    const bookGrid = document.querySelector('.book-grid');
    if (!bookGrid) return;

    try {
        const snapshot = await db.collection('books').orderBy('createdAt', 'desc').limit(30).get();
        allBooks = [];
        
        snapshot.forEach(doc => {
            const book = {
                id: doc.id,
                ...doc.data()
            };
            allBooks.push(book);
        });
        
        // Display books with initial search/filter
        filterAndDisplayBooks();
    } catch (error) {
        console.error('Error loading books:', error);
        bookGrid.innerHTML = '<p>Hiba történt a könyvek betöltése során. Kérjük, próbálja újra később.</p>';
    }
}

function setupFilterSearch(inputElement, suggestionsElement, field) {
    let debounceTimer;

    inputElement.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        const searchTerm = inputElement.value.toLowerCase();
        
        debounceTimer = setTimeout(() => {
            // Update filter value
            filters[field] = searchTerm;
            
            // Get unique values from books that match the search term
            const matchingValues = new Set();
            allBooks.forEach(book => {
                const fieldValue = book[field]?.toLowerCase() || '';
                if (fieldValue.includes(searchTerm)) {
                    matchingValues.add(book[field]);
                }
            });

            // Display suggestions
            if (matchingValues.size > 0 && searchTerm) {
                suggestionsElement.innerHTML = Array.from(matchingValues)
                    .map(value => `<div class="suggestion-item" data-value="${value}">${value}</div>`)
                    .join('');
                suggestionsElement.classList.add('active');
            } else {
                suggestionsElement.innerHTML = '';
                suggestionsElement.classList.remove('active');
            }

            // Filter and display books
            filterAndDisplayBooks();
        }, 300); // Debounce delay
    });

    // Handle suggestion clicks
    suggestionsElement.addEventListener('click', (e) => {
        const suggestionItem = e.target.closest('.suggestion-item');
        if (suggestionItem) {
            const value = suggestionItem.dataset.value;
            inputElement.value = value;
            filters[field] = value;
            suggestionsElement.classList.remove('active');
            filterAndDisplayBooks();
        }
    });

    // Close suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!inputElement.contains(e.target) && !suggestionsElement.contains(e.target)) {
            suggestionsElement.classList.remove('active');
        }
    });
}

function filterAndDisplayBooks() {
    const searchQuery = filters.search.toLowerCase();
    let filteredBooks = allBooks.filter(book => {
        // Apply search filter
        const matchesSearch = !searchQuery || 
            book.title?.toLowerCase().includes(searchQuery) ||
            book.author?.toLowerCase().includes(searchQuery) ||
            book.language?.toLowerCase().includes(searchQuery) ||
            book.publisher?.toLowerCase().includes(searchQuery) ||
            book.topic?.toLowerCase().includes(searchQuery) ||
            book.description?.toLowerCase().includes(searchQuery);

        // Apply individual filters
        const matchesAuthor = !filters.author || 
            book.author?.toLowerCase().includes(filters.author.toLowerCase());
        // Support multiple languages
        let matchesLanguage = true;
        if (filters.language) {
            const langs = filters.language.split(',').map(l => l.trim());
            matchesLanguage = langs.some(l => book.language?.toLowerCase().includes(l));
        }
        const matchesPublisher = !filters.publisher || 
            book.publisher?.toLowerCase().includes(filters.publisher.toLowerCase());
        const matchesTopic = !filters.topic || 
            book.topic?.toLowerCase().includes(filters.topic.toLowerCase());
        const matchesPrice = !filters.maxPrice || 
            (book.price && parseInt(book.price) <= filters.maxPrice);

        return matchesSearch && matchesAuthor && matchesLanguage && 
               matchesPublisher && matchesTopic && matchesPrice;
    });

    // Determine the limit based on whether there's an active search or filter
    const hasActiveFilters = filters.search || filters.author || filters.language || 
                            filters.publisher || filters.topic || filters.maxPrice;
    // Use SEARCH_BOOK_LIMIT if set, else fallback
    const limit = (typeof window.SEARCH_BOOK_LIMIT === 'number') ? window.SEARCH_BOOK_LIMIT : (hasActiveFilters ? SEARCH_BOOK_LIMIT : DEFAULT_BOOK_LIMIT);

    // Limit the number of books to display
    const limitedBooks = filteredBooks.slice(0, limit);

    displayBooks(limitedBooks, filteredBooks.length);
}

function displayBooks(books, totalCount) {
    const bookGrid = document.querySelector('.book-grid');
    if (!bookGrid) return; // Ensure bookGrid exists

    if (books.length === 0) {
        bookGrid.innerHTML = '<p>Nincsenek a szűrésnek megfelelő könyvek.</p>';
        return;
    }

    const booksHtml = books.map(book => {
        const authorHtml = book.author && book.author.trim() !== '' && book.author.toLowerCase() !== 'ismeretlen szerző' 
                           ? `<p class="author">${book.author}</p>` 
                           : '';
        const priceHtml = book.price ? `${book.price} Ft` : 'Ár nem elérhető';

        // Move the Kosárba button directly below the image
        return `
        <div class="book-card">
            <img src="${book.image || defaultPlaceholder}" 
                 alt="${book.title || 'Cím nélkül'}" 
                 class="book-image"
                 onerror="this.onerror=null; this.src='${defaultPlaceholder}'">
            <button class="add-to-cart" data-book-id="${book.id}" style="margin: 0.5rem auto 0.5rem auto; display: block;"><i class="fas fa-shopping-cart"></i> Kosárba</button>
            <div class="book-info">
                <h3>${book.title || 'Cím nélkül'}</h3>
                ${authorHtml}
                <p class="price">${priceHtml}</p>
            </div>
        </div>
    `;
    }).join('');

    const resultCountHtml = totalCount > books.length 
        ? `<div class="results-count">Megjelenítve: ${books.length} / ${totalCount} könyv</div>`
        : '';

    bookGrid.innerHTML = resultCountHtml + booksHtml;

    // Add event listeners to all add-to-cart buttons
    bookGrid.querySelectorAll('.add-to-cart').forEach(btn => {
        btn.addEventListener('click', function() {
            const bookId = this.getAttribute('data-book-id');
            if (window.addToCart) {
                window.addToCart(bookId);
            }
        });
    });
}

setupFilterSearch(authorFilter, authorSuggestions, 'author');
setupFilterSearch(languageFilter, languageSuggestions, 'language');
setupFilterSearch(publisherFilter, publisherSuggestions, 'publisher');
setupFilterSearch(topicFilter, topicSuggestions, 'topic');

const searchForm = document.getElementById('searchForm');
if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const query = searchInput.value.trim();
        filters.search = query;
        filterAndDisplayBooks();
        if (query) {
            urlParams.set('search', query);
        } else {
            urlParams.delete('search');
        }
        window.history.replaceState({}, '', `${window.location.pathname}?${urlParams}`);
    });
}

let cart = JSON.parse(localStorage.getItem('cart') || '[]');
const cartCount = document.querySelector('.cart-count');

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}