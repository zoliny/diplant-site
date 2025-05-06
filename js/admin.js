// Check admin authorization
auth.onAuthStateChanged(async (user) => {
    const navbar = document.querySelector('.navbar');
    if (!user || user.email !== 'zol@gmail.com') {
        window.location.href = 'index.html';
        return;
    }
    
    navbar.classList.add('logged-in');
    document.getElementById('adminEmail').textContent = user.email;
});

// Use a string for admin email, not an HTML element
const ADMIN_EMAIL = 'zol@gmail.com';

// Initialize translations
let currentLanguage = localStorage.getItem('language') || 'hu';

function initLanguage() {
    translatePage();
}

function translatePage() {
    // Update page title
    document.title = currentLanguage === 'hu' ? 'Admin Panel - Di-Plant Nyelvkönyvbolt' : 'Admin Panel - Di-Plant Language Bookstore';
    
    // Translate static elements
    const elements = {
        logo: document.querySelector('.logo'),
        backLink: document.querySelector('.nav-links a'),
        subHeader: document.querySelector('.sub-header'),
        bookTab: document.querySelector('[data-tab="books"]'),
        ordersTab: document.querySelector('[data-tab="orders"]'),
        myOrdersTab: document.querySelector('[data-tab="myorders"]'),
        usersTab: document.querySelector('[data-tab="users"]'),
        booksTitle: document.querySelector('#booksPanel h2'),
        ordersTitle: document.querySelector('#ordersPanel h2'),
        myOrdersTitle: document.querySelector('#myOrdersPanel h2'),
        usersTitle: document.querySelector('#usersPanel h2'),
        uploadBtn: document.getElementById('addBookBtn'),
        saveBtn: document.getElementById('saveFileBtn'),
        previewTitle: document.querySelector('.books-preview h3'),
        logoutBtn: document.getElementById('logoutBtn')
    };

    if (elements.logo) elements.logo.textContent = translations[currentLanguage].adminPanel;
    if (elements.backLink) elements.backLink.textContent = translations[currentLanguage].backToHome;
    if (elements.subHeader) elements.subHeader.textContent = translations[currentLanguage].adminInterface;
    if (elements.bookTab) elements.bookTab.textContent = translations[currentLanguage].books;
    if (elements.ordersTab) elements.ordersTab.textContent = translations[currentLanguage].orders;
    if (elements.myOrdersTab) elements.myOrdersTab.textContent = translations[currentLanguage].myOrders;
    if (elements.usersTab) elements.usersTab.textContent = translations[currentLanguage].users;
    if (elements.booksTitle) elements.booksTitle.textContent = translations[currentLanguage].booksManagement;
    if (elements.ordersTitle) elements.ordersTitle.textContent = translations[currentLanguage].ordersManagement;
    if (elements.myOrdersTitle) elements.myOrdersTitle.textContent = translations[currentLanguage].myOrdersManagement;
    if (elements.usersTitle) elements.usersTitle.textContent = translations[currentLanguage].usersManagement;
    if (elements.uploadBtn) elements.uploadBtn.innerHTML = `<i class="fas fa-plus"></i> ${translations[currentLanguage].uploadBooks}`;
    if (elements.saveBtn) elements.saveBtn.innerHTML = `<i class="fas fa-save"></i> ${translations[currentLanguage].save}`;
    if (elements.previewTitle) elements.previewTitle.textContent = translations[currentLanguage].booksPreview;
    if (elements.logoutBtn) elements.logoutBtn.textContent = translations[currentLanguage].logout;
}

// Initialize translation when the page loads
document.addEventListener('DOMContentLoaded', () => {
    initLanguage();

    // Automatically load all user orders when the orders tab is shown
    const ordersTabBtn = document.querySelector('.sidebar-tab-btn[data-tab="orders"]');
    if (ordersTabBtn) {
        ordersTabBtn.addEventListener('click', () => {
            loadOrders(true);
        });
    }
    // Optionally, load orders immediately if the orders panel is visible by default
    const ordersPanel = document.getElementById('ordersPanel');
    if (ordersPanel && ordersPanel.style.display !== 'none') {
        loadOrders(true);
    }

    const usersTabBtn = document.querySelector('.sidebar-tab-btn[data-tab="users"]');
    if (usersTabBtn) {
        usersTabBtn.addEventListener('click', () => {
            loadUsers(true);
        });
    }

    setTimeout(() => {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.onclick = async () => {
                try {
                    await firebase.auth().signOut();
                } catch (e) {}
                window.location.href = 'index.html';
            };
        }
    }, 0);
});

// Pagination settings
const PAGE_SIZE = 10;
let lastUserDoc = null;
let lastOrderDoc = null;
let usersEndReached = false;
let ordersEndReached = false;
let currentOrderSearch = '';
let currentOrderDocs = [];

// Sidebar tab switching
const sidebarBtns = document.querySelectorAll('.sidebar-tab-btn');
const panels = {
    books: document.getElementById('booksPanel'),
    orders: document.getElementById('ordersPanel'),
    adminOrders: document.getElementById('adminOrdersPanel'),
    users: document.getElementById('usersPanel')
};
sidebarBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        sidebarBtns.forEach(b => b.classList.remove('active'));
        Object.values(panels).forEach(panel => panel.style.display = 'none');
        btn.classList.add('active');
        const activePanel = panels[btn.dataset.tab];
        if (activePanel) activePanel.style.display = 'block';
    });
});

// Könyvek: Excel/CSV upload, delete all previous books before upload
const addBookBtn = document.getElementById('addBookBtn');
const saveFileBtn = document.getElementById('saveFileBtn');
const excelFileInput = document.getElementById('excelFileInput');
const booksPreview = document.querySelector('.books-preview');
const previewList = document.querySelector('.preview-list');
let booksToUpload = [];

addBookBtn.addEventListener('click', () => {
    excelFileInput.click();
});

excelFileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
        const reader = new FileReader();
        reader.onload = async (e) => {
            let books = [];
            if (file.name.toLowerCase().endsWith('.csv')) {
                const text = e.target.result;
                books = parseCSV(text);
            } else {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                const headers = ['isbn', 'title', 'author', 'publisher', 'topic', 'language', 'price'];
                for (let i = 1; i < rows.length; i++) {
                    const row = rows[i];
                    if (!row.length) continue;
                    const book = {};
                    headers.forEach((header, index) => {
                        book[header] = row[index]?.toString()?.trim() || '';
                    });
                    if (book.price) book.price = parseInt(book.price) || 0;
                    books.push(book);
                }
            }
            booksToUpload = books;
            showBooksPreview(books);
            saveFileBtn.style.display = 'inline-flex';
        };
        if (file.name.toLowerCase().endsWith('.csv')) {
            reader.readAsText(file);
        } else {
            reader.readAsArrayBuffer(file);
        }
    } catch (error) {
        showNotification('Hiba történt a fájl feldolgozása során!', 'error');
    }
});

function showBooksPreview(books) {
    booksPreview.style.display = 'block';
    previewList.innerHTML = '';
    const previewCount = Math.min(5, books.length);
    for (let i = 0; i < previewCount; i++) {
        const book = books[i];
        const bookElement = document.createElement('div');
        bookElement.className = 'preview-item';
        bookElement.innerHTML = `
            <div class="item-info">
                <h4>${book.title || 'Cím nélkül'}</h4>
                <p>${book.author || 'Ismeretlen szerző'} ${book.isbn ? `(ISBN: ${book.isbn})` : ''}</p>
                <p>${book.publisher || ''} ${book.topic ? `- ${book.topic}` : ''}</p>
                <p>${book.language || 'Nyelv nincs megadva'}</p>
                <p>${book.price ? `${book.price} Ft` : 'Ár nincs megadva'}</p>
            </div>
        `;
        previewList.appendChild(bookElement);
    }
    if (books.length > 5) {
        const moreElement = document.createElement('div');
        moreElement.className = 'preview-more';
        moreElement.textContent = `...és még ${books.length - 5} könyv`;
        previewList.appendChild(moreElement);
    }
}

saveFileBtn.addEventListener('click', async () => {
    if (!booksToUpload.length) {
        showNotification('Nincsenek feltöltendő könyvek!', 'error');
        return;
    }
    try {
        // Delete all previous books
        const snapshot = await db.collection('books').get();
        const batch = db.batch();
        snapshot.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        // Upload new books
        await uploadBooks(booksToUpload);
        showNotification('Könyvek sikeresen feltöltve!');
        booksToUpload = [];
        booksPreview.style.display = 'none';
        saveFileBtn.style.display = 'none';
        excelFileInput.value = '';
    } catch (error) {
        showNotification('Hiba történt a könyvek feltöltése során!', 'error');
    }
});

function parseCSV(text) {
    const lines = text.split('\n');
    const headers = ['isbn', 'title', 'author', 'publisher', 'topic', 'language', 'price'];
    const books = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const values = line.split('\t');
        if (values.length < headers.length) continue;
        const book = {};
        headers.forEach((header, index) => {
            book[header] = values[index]?.trim() || '';
        });
        if (book.price) book.price = parseInt(book.price) || 0;
        books.push(book);
    }
    return books;
}

async function uploadBooks(books) {
    const batches = [];
    const batchSize = 500;
    for (let i = 0; i < books.length; i += batchSize) {
        const batch = db.batch();
        const booksSlice = books.slice(i, i + batchSize);
        for (const book of booksSlice) {
            const docRef = db.collection('books').doc();
            batch.set(docRef, {
                ...book,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        batches.push(batch.commit());
    }
    await Promise.all(batches);
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => { notification.remove(); }, 3000);
}

// Search bar and download button event listeners
document.addEventListener('DOMContentLoaded', () => {
    const orderSearchInput = document.getElementById('orderSearchInput');
    if (orderSearchInput) {
        orderSearchInput.addEventListener('input', (e) => {
            currentOrderSearch = e.target.value.trim().toLowerCase();
            loadOrders(true);
        });
    }
    const downloadOrdersBtn = document.getElementById('downloadOrdersBtn');
    if (downloadOrdersBtn) {
        downloadOrdersBtn.addEventListener('click', () => {
            downloadOrdersAsExcel(currentOrderDocs);
        });
    }
});

// Load orders with pagination, search, and storing docs for download
async function loadOrders(reset = false) {
    try {
        const ordersList = document.querySelector('.orders-list');
        if (reset) {
            ordersList.innerHTML = '';
            lastOrderDoc = null;
            ordersEndReached = false;
            currentOrderDocs = [];
        }
        if (ordersEndReached) return;
        let query = db.collection('orders')
            .orderBy('orderDate', 'desc')
            .limit(PAGE_SIZE);
        if (lastOrderDoc) query = query.startAfter(lastOrderDoc);
        const snapshot = await query.get();
        if (snapshot.empty) {
            ordersEndReached = true;
            return;
        }
        let filteredDocs = snapshot.docs;
        if (currentOrderSearch) {
            filteredDocs = filteredDocs.filter(doc => {
                const order = doc.data();
                return (
                    (order.userName && order.userName.toLowerCase().includes(currentOrderSearch)) ||
                    (order.userEmail && order.userEmail.toLowerCase().includes(currentOrderSearch)) ||
                    doc.id.toLowerCase().includes(currentOrderSearch)
                );
            });
        }
        currentOrderDocs = currentOrderDocs.concat(filteredDocs);
        filteredDocs.forEach(doc => {
            const order = doc.data();
            const orderElement = document.createElement('div');
            orderElement.className = 'list-item';
            const orderDate = order.orderDate?.toDate() || new Date();
            const formattedDate = `${orderDate.toLocaleDateString('hu-HU')} ${orderDate.toLocaleTimeString('hu-HU')}`;
            const itemsList = order.items.map(item => `
                <div class="order-item">
                    <span class="item-title">${item.title}</span>
                    <span class="item-author">${item.author || ''}</span>
                    <span class="item-qty">x${item.quantity}</span>
                    <span class="item-price">${item.price.toLocaleString('hu-HU')} Ft</span>
                </div>
            `).join('');
            // Unified status options
            const statusOptions = [
                { value: 'fuggoben', label: 'Függőben' },
                { value: 'kesz', label: 'Kész' },
                { value: 'deleted', label: 'Törölt' }
            ];
            // Status badge color
            let badgeClass = 'status-fuggoben';
            if (order.status === 'kesz') badgeClass = 'status-kesz';
            if (order.status === 'deleted') badgeClass = 'status-deleted';
            const statusSelect = `<select class="order-status-select styled-select" data-order-id="${doc.id}">
                ${statusOptions.map(opt => `<option value="${opt.value}"${order.status === opt.value ? ' selected' : ''}>${opt.label}</option>`).join('')}
            </select>`;
            orderElement.innerHTML = `
                <div class="item-info">
                    <div class="order-header">
                        <h3>Rendelés #${doc.id.slice(-6)}</h3>
                        <span class="status-badge ${badgeClass}">${getOrderStatus(order.status)}</span>
                    </div>
                    <div class="order-details">
                        <p><strong>Felhasználó:</strong> ${order.userName || 'N/A'} (${order.userEmail || 'N/A'})</p>
                        <p><strong>Dátum:</strong> ${formattedDate}</p>
                        <p><strong>Összeg:</strong> ${order.total.toLocaleString('hu-HU')} Ft (${order.itemCount} db)</p>
                    </div>
                    <div class="order-items-toggle" onclick="toggleOrderItems(this)">
                        <i class="fas fa-chevron-down"></i> Rendelés tételei
                    </div>
                    <div class="order-items" style="display: none;">
                        ${itemsList}
                    </div>
                </div>
                <div class="item-actions" style="display:flex;align-items:center;gap:0.5rem;">
                    ${statusSelect}
                    <button class="btn-danger order-delete-btn" data-order-id="${doc.id}"><i class="fas fa-trash"></i> Törlés</button>
                </div>
            `;
            ordersList.appendChild(orderElement);
        });
        // Add event listeners for status dropdowns and delete
        setTimeout(() => {
            document.querySelectorAll('.order-status-select').forEach(select => {
                select.addEventListener('change', async function() {
                    const orderId = this.getAttribute('data-order-id');
                    const newStatus = this.value;
                    await updateOrderStatusDropdown(orderId, newStatus);
                });
            });
            document.querySelectorAll('.order-delete-btn').forEach(btn => {
                btn.addEventListener('click', async function() {
                    const orderId = this.getAttribute('data-order-id');
                    if (confirm('Biztosan törölni szeretné ezt a rendelést?')) {
                        await deleteOrder(orderId);
                    }
                });
            });
        }, 0);
        lastOrderDoc = snapshot.docs[snapshot.docs.length - 1];
        let loadMoreBtn = document.getElementById('loadMoreOrdersBtn');
        if (loadMoreBtn) loadMoreBtn.remove();
        if (snapshot.size === PAGE_SIZE) {
            loadMoreBtn = document.createElement('button');
            loadMoreBtn.id = 'loadMoreOrdersBtn';
            loadMoreBtn.className = 'btn-primary';
            loadMoreBtn.textContent = 'További rendelések';
            loadMoreBtn.onclick = () => loadOrders(false);
            ordersList.appendChild(loadMoreBtn);
        }
    } catch (error) {
        console.error('Error loading orders:', error);
        showNotification('Hiba történt a rendelések betöltése során!', 'error');
    }
}

// Delete order from Firestore
async function deleteOrder(orderId) {
    try {
        await db.collection('orders').doc(orderId).delete();
        showNotification('Rendelés törölve!', 'success');
        loadOrders(true);
    } catch (error) {
        showNotification('Nem sikerült törölni a rendelést!', 'error');
    }
}

// Update order status from dropdown
async function updateOrderStatusDropdown(orderId, newStatus) {
    try {
        await db.collection('orders').doc(orderId).update({
            status: newStatus,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        showNotification('Rendelés státusza frissítve!');
        loadOrders(true);
    } catch (error) {
        showNotification('Nem sikerült státuszt frissíteni!', 'error');
    }
}

// Mark order as completed
async function markOrderCompleted(orderId) {
    try {
        await db.collection('orders').doc(orderId).update({
            status: 'completed',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        showNotification('Rendelés státusza Kész!');
        loadOrders(true);
    } catch (error) {
        showNotification('Nem sikerült státuszt frissíteni!', 'error');
    }
}

// Download orders as Excel
function downloadOrdersAsExcel(orderDocs) {
    if (!orderDocs.length) {
        showNotification('Nincs letölthető rendelés!', 'error');
        return;
    }
    const XLSX = window.XLSX;
    const data = orderDocs.map(doc => {
        const order = doc.data();
        return {
            RendelésAzonosító: doc.id,
            Név: order.userName || '',
            Email: order.userEmail || '',
            Dátum: order.orderDate ? order.orderDate.toDate().toLocaleString('hu-HU') : '',
            Státusz: order.status,
            Összeg: order.total,
            Tételek: order.items.map(i => `${i.title} (${i.quantity} x ${i.price} Ft)`).join('; ')
        };
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rendelések');
    XLSX.writeFile(wb, 'rendelesek.xlsx');
}

// My Orders: show only admin's own orders
async function loadMyOrders(reset = false) {
    try {
        const myOrdersList = document.querySelector('.myorders-list');
        if (reset) myOrdersList.innerHTML = '';
        const snapshot = await db.collection('orders')
            .where('userEmail', '==', ADMIN_EMAIL)
            .orderBy('orderDate', 'desc')
            .get();
        if (snapshot.empty) {
            myOrdersList.innerHTML = '<p>Nincs saját admin rendelés.</p>';
            return;
        }
        snapshot.forEach(doc => {
            const order = doc.data();
            const orderElement = document.createElement('div');
            orderElement.className = 'list-item';
            const orderDate = order.orderDate?.toDate() || new Date();
            const formattedDate = `${orderDate.toLocaleDateString('hu-HU')} ${orderDate.toLocaleTimeString('hu-HU')}`;
            const itemsList = order.items.map(item => `
                <div class="order-item">
                    <span class="item-title">${item.title}</span>
                    <span class="item-author">${item.author || ''}</span>
                    <span class="item-qty">x${item.quantity}</span>
                    <span class="item-price">${item.price.toLocaleString('hu-HU')} Ft</span>
                </div>
            `).join('');
            orderElement.innerHTML = `
                <div class="item-info">
                    <div class="order-header">
                        <h3>Rendelés #${doc.id.slice(-6)}</h3>
                        <span class="status-badge status-${order.status}">${getOrderStatus(order.status)}</span>
                    </div>
                    <div class="order-details">
                        <p><strong>Dátum:</strong> ${formattedDate}</p>
                        <p><strong>Összeg:</strong> ${order.total.toLocaleString('hu-HU')} Ft (${order.itemCount} db)</p>
                    </div>
                    <div class="order-items-toggle" onclick="toggleOrderItems(this)">
                        <i class="fas fa-chevron-down"></i> Rendelés tételei
                    </div>
                    <div class="order-items" style="display: none;">
                        ${itemsList}
                    </div>
                </div>
            `;
            myOrdersList.appendChild(orderElement);
        });
    } catch (error) {
        console.error('Error loading admin orders:', error);
        showNotification('Hiba történt a saját rendelések betöltése során!', 'error');
    }
}

// Add new admin order (simple modal for demo)
document.getElementById('addMyOrderBtn').onclick = function() {
    alert('Új admin rendelés rögzítése: ezt a funkciót fejleszteni kell!');
};

// Admin order form logic
const adminOrderForm = document.getElementById('adminOrderForm');
const adminOrdersList = document.querySelector('.admin-orders-list');

if (adminOrderForm) {
    adminOrderForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const book = document.getElementById('adminOrderBook').value.trim();
        const qty = parseInt(document.getElementById('adminOrderQty').value, 10);
        const price = parseInt(document.getElementById('adminOrderPrice').value, 10);
        const author = document.getElementById('adminOrderAuthor').value.trim();
        const publisher = document.getElementById('adminOrderPublisher').value.trim();
        const language = document.getElementById('adminOrderLanguage').value.trim();
        const theme = document.getElementById('adminOrderTheme').value.trim();
        if (!book || qty < 1 || price < 0) {
            showNotification('Hibás adat!');
            return;
        }
        try {
            await db.collection('orders').add({
                userEmail: ADMIN_EMAIL,
                userName: 'Admin',
                items: [{
                    title: book,
                    quantity: qty,
                    price,
                    author,
                    publisher,
                    language,
                    theme
                }],
                total: price * qty,
                itemCount: qty,
                status: 'fuggoben',
                orderDate: firebase.firestore.FieldValue.serverTimestamp(),
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            showNotification('Admin rendelés rögzítve!');
            adminOrderForm.reset();
            if (typeof loadMyOrders === 'function') loadMyOrders(true);
        } catch (error) {
            showNotification('Hiba történt a rendelés rögzítésekor!', 'error');
        }
    });
}

// Admin new purchases form logic
if (adminOrderForm) {
    adminOrderForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const book = document.getElementById('adminOrderBook').value.trim();
        const qty = parseInt(document.getElementById('adminOrderQty').value, 10);
        const price = parseInt(document.getElementById('adminOrderPrice').value, 10);
        if (!book || qty < 1 || price < 0) {
            showNotification('Hibás adat!');
            return;
        }
        try {
            await db.collection('newpurchases').add({
                adminEmail: ADMIN_EMAIL,
                book,
                quantity: qty,
                price,
                total: price * qty,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            showNotification('Új admin vásárlás rögzítve!');
            adminOrderForm.reset();
        } catch (error) {
            showNotification('Hiba történt a vásárlás rögzítésekor!', 'error');
        }
    });
}

// Toggle order items visibility
function toggleOrderItems(element) {
    const itemsContainer = element.nextElementSibling;
    const chevron = element.querySelector('i');
    
    if (itemsContainer.style.display === 'none') {
        itemsContainer.style.display = 'block';
        chevron.classList.replace('fa-chevron-down', 'fa-chevron-up');
    } else {
        itemsContainer.style.display = 'none';
        chevron.classList.replace('fa-chevron-up', 'fa-chevron-down');
    }
}

// View detailed order information
async function viewOrderDetails(orderId) {
    try {
        const doc = await db.collection('orders').doc(orderId).get();
        if (!doc.exists) {
            showNotification('A rendelés nem található!', 'error');
            return;
        }
        
        const order = doc.data();
        const modal = document.createElement('div');
        modal.className = 'modal';
        
        // Format order date
        const orderDate = order.orderDate?.toDate() || new Date();
        const formattedDate = `${orderDate.toLocaleDateString('hu-HU')} ${orderDate.toLocaleTimeString('hu-HU')}`;
        
        // Build detailed order items table
        const itemsTable = order.items.map(item => `
            <tr>
                <td>
                    <div class="order-item-details">
                        <img src="${item.image || 'diplant.jpeg'}" 
                            alt="${item.title}"
                            onerror="this.onerror=null; this.src='diplant.jpeg'">
                        <div>
                            <h4>${item.title}</h4>
                            <p>${item.author || ''}</p>
                            ${item.isbn ? `<p class="isbn">ISBN: ${item.isbn}</p>` : ''}
                        </div>
                    </div>
                </td>
                <td>${item.quantity}</td>
                <td>${item.price.toLocaleString('hu-HU')} Ft</td>
                <td>${(item.price * item.quantity).toLocaleString('hu-HU')} Ft</td>
            </tr>
        `).join('');
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Rendelés részletei #${orderId.slice(-6)}</h2>
                    <span class="close-modal" onclick="closeModal(this)">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="order-info">
                        <div class="info-section">
                            <h3>Vásárló adatok</h3>
                            <p><strong>Név:</strong> ${order.userName || 'N/A'}</p>
                            <p><strong>Email:</strong> ${order.userEmail || 'N/A'}</p>
                            <p><strong>Felhasználó ID:</strong> ${order.userId}</p>
                        </div>
                        <div class="info-section">
                            <h3>Rendelés adatok</h3>
                            <p><strong>Rendelés ideje:</strong> ${formattedDate}</p>
                            <p><strong>Státusz:</strong> <span class="status-badge status-${order.status}">${getOrderStatus(order.status)}</span></p>
                            <p><strong>Termékek száma:</strong> ${order.itemCount} db</p>
                            <p><strong>Végösszeg:</strong> ${order.total.toLocaleString('hu-HU')} Ft</p>
                        </div>
                    </div>
                    
                    <h3>Rendelt tételek</h3>
                    <table class="order-items-table">
                        <thead>
                            <tr>
                                <th>Termék</th>
                                <th>Darabszám</th>
                                <th>Egységár</th>
                                <th>Összesen</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsTable}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colspan="3" class="text-right"><strong>Végösszeg:</strong></td>
                                <td><strong>${order.total.toLocaleString('hu-HU')} Ft</strong></td>
                            </tr>
                        </tfoot>
                    </table>
                    
                    <div class="action-buttons">
                        <button class="btn-primary" onclick="updateOrderStatusAndClose('${orderId}', '${order.status}')">
                            <i class="fas fa-sync-alt"></i> Státusz frissítése
                        </button>
                        <button class="btn-secondary" onclick="closeModal(this)">
                            <i class="fas fa-times"></i> Bezárás
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listener to close modal when clicking outside
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.remove();
            }
        });
    } catch (error) {
        console.error('Error loading order details:', error);
        showNotification('Hiba történt a rendelés részletek betöltése során!', 'error');
    }
}

// Close modal
function closeModal(element) {
    const modal = element.closest('.modal');
    if (modal) modal.remove();
}

// Update order status from modal and close it
async function updateOrderStatusAndClose(orderId, currentStatus) {
    await updateOrderStatus(orderId, currentStatus);
    const modal = document.querySelector('.modal');
    if (modal) modal.remove();
}

// Update order status
async function updateOrderStatus(orderId, currentStatus) {
    const statuses = ['pending', 'processing', 'shipped', 'delivered'];
    const currentIndex = statuses.indexOf(currentStatus);
    const nextStatus = statuses[(currentIndex + 1) % statuses.length];
    
    try {
        await db.collection('orders').doc(orderId).update({
            status: nextStatus,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        showNotification('Rendelés státusza frissítve!');
        loadOrders();
    } catch (error) {
        console.error('Error updating order status:', error);
        showNotification('Hiba történt a státusz frissítése során!', 'error');
    }
}

// Load users with pagination
async function loadUsers(reset = false) {
    try {
        const usersList = document.querySelector('.users-list');
        if (reset) {
            usersList.innerHTML = '';
            lastUserDoc = null;
            usersEndReached = false;
        }
        if (usersEndReached) return;
        let query = db.collection('users')
            .orderBy('createdAt', 'desc')
            .limit(PAGE_SIZE);
        if (lastUserDoc) query = query.startAfter(lastUserDoc);
        const snapshot = await query.get();
        if (snapshot.empty) {
            usersEndReached = true;
            return;
        }
        snapshot.forEach(doc => {
            const user = doc.data();
            if (user.email === ADMIN_EMAIL || user.role === 'admin') return; // skip admin
            const userElement = document.createElement('div');
            userElement.className = 'list-item';
            userElement.innerHTML = `
                <div class="item-info">
                    <h3>${user.fullName || 'Névtelen felhasználó'}</h3>
                    <p><strong>Email:</strong> ${user.email || ''}</p>
                    <p><strong>Telefonszám:</strong> ${user.phone || ''}</p>
                </div>
            `;
            usersList.appendChild(userElement);
        });
        lastUserDoc = snapshot.docs[snapshot.docs.length - 1];
        let loadMoreBtn = document.getElementById('loadMoreUsersBtn');
        if (loadMoreBtn) loadMoreBtn.remove();
        if (snapshot.size === PAGE_SIZE) {
            loadMoreBtn = document.createElement('button');
            loadMoreBtn.id = 'loadMoreUsersBtn';
            loadMoreBtn.className = 'btn-primary';
            loadMoreBtn.textContent = 'További felhasználók';
            loadMoreBtn.onclick = () => loadUsers(false);
            usersList.appendChild(loadMoreBtn);
        }
    } catch (error) {
        console.error('Error loading users:', error);
        showNotification('Hiba történt a felhasználók betöltése során!', 'error');
    }
}

// Helper function to translate order status
function getOrderStatus(status) {
    const statusTranslations = {
        'hu': {
            'pending': 'Függőben',
            'processing': 'Feldolgozás alatt',
            'shipped': 'Elküldve',
            'delivered': 'Kézbesítve',
            'completed': 'Kész',
            'fuggoben': 'Függőben',
            'kesz': 'Kész',
            'deleted': 'Törölt'
        },
        'en': {
            'pending': 'Pending',
            'processing': 'Processing',
            'shipped': 'Shipped',
            'delivered': 'Delivered',
            'completed': 'Completed',
            'fuggoben': 'Pending',
            'kesz': 'Completed',
            'deleted': 'Deleted'
        }
    };
    
    return statusTranslations[currentLanguage][status] || status;
}

// Handle logout
document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await firebase.auth().signOut();
            } catch (e) {}
            window.location.href = 'index.html';
        });
    }
});