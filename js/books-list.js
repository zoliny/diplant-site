// books-list.js
const urlParams = new URLSearchParams(window.location.search);
const theme = urlParams.get('theme');
const bookGrid = document.querySelector('.book-grid');
const themeTitle = document.getElementById('themeTitle');
const defaultPlaceholder = 'diplant.jpeg';

if (themeTitle && theme) {
    themeTitle.textContent = `Könyvek témában: ${theme.replace(/-/g, ' ')}`;
}

function normalizeString(str) {
    return str.normalize('NFD').replace(/[ -]/g, c => c.toLowerCase()).replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

async function loadBooksByTheme() {
    if (!theme) {
        bookGrid.innerHTML = '<p>Nincs megadva téma.</p>';
        return;
    }
    try {
        // Get up to 100 books and filter by topic substring (case-insensitive, accent-insensitive)
        const snapshot = await db.collection('books')
            .limit(100)
            .get();
        const books = [];
        const themeNorm = normalizeString(theme);
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.topic && normalizeString(data.topic).includes(themeNorm)) {
                books.push({ id: doc.id, ...data });
            }
        });
        if (books.length === 0) {
            bookGrid.innerHTML = '<p>Nincs találat erre a témára.</p>';
            return;
        }
        // Center the grid and show 14 books
        bookGrid.classList.add('centered-book-grid');
        bookGrid.innerHTML = books.slice(0, 14).map(book => `
            <div class="book-card">
                <img src="${book.image || defaultPlaceholder}" alt="${book.title}" class="book-image" onerror="this.onerror=null;this.src='${defaultPlaceholder}'">
                <div class="book-info">
                    <h3>${book.title || 'Cím nélkül'}</h3>
                    <p class="author">${book.author || 'Ismeretlen szerző'}</p>
                    <p class="details">
                        ${book.language ? `<span class='language'>${book.language}</span>` : ''}
                        ${book.topic ? `<span class='topic'>${book.topic}</span>` : ''}
                    </p>
                    <p class="publisher">${book.publisher || ''}</p>
                    <p class="price">${book.price ? `${book.price} Ft` : 'Ár nem elérhető'}</p>
                </div>
            </div>
        `).join('');
    } catch (error) {
        bookGrid.innerHTML = '<p>Hiba történt a könyvek betöltésekor.</p>';
    }
}

// Wait for Firebase to be ready
window.addEventListener('DOMContentLoaded', loadBooksByTheme);
