// books-list.js
const urlParams = new URLSearchParams(window.location.search);
const theme = urlParams.get('theme');
const bookGrid = document.querySelector('.book-grid');
const themeTitle = document.getElementById('themeTitle');
const defaultPlaceholder = 'diplant.jpeg';

if (themeTitle && theme) {
    themeTitle.textContent = `Könyvek témában: ${theme.replace(/-/g, ' ')}`;
}

async function loadBooksByTheme() {
    if (!theme) {
        bookGrid.innerHTML = '<p>Nincs megadva téma.</p>';
        return;
    }
    try {
        const snapshot = await db.collection('books')
            .where('topic', '==', theme)
            .limit(20)
            .get();
        const books = [];
        snapshot.forEach(doc => {
            books.push({ id: doc.id, ...doc.data() });
        });
        if (books.length === 0) {
            bookGrid.innerHTML = '<p>Nincs találat erre a témára.</p>';
            return;
        }
        bookGrid.innerHTML = books.map(book => `
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
