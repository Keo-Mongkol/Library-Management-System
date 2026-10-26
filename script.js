document.addEventListener('DOMContentLoaded', function () {
    // Initialize data storage from data.js
    initStorage();

    // ===== Helper: format date =====
    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB'); // DD/MM/YYYY
    }

    // ===== Helper: toast notification =====
    function showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    // ===== Helper: close a modal =====
    function closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }

    // ===== Tab Navigation =====
    const tabNames = ['books', 'visitors', 'cards', 'stats'];
    const tabLinks = {};
    tabNames.forEach(tab => {
        tabLinks[tab] = document.getElementById(`${tab}-tab`);
        tabLinks[tab].addEventListener('click', (e) => {
            e.preventDefault();
            // Switch sections
            document.querySelectorAll('main > section').forEach(s => s.classList.remove('active'));
            document.getElementById(`${tab}-section`).classList.add('active');
            // Switch active tab style
            Object.values(tabLinks).forEach(a => a.classList.remove('active'));
            tabLinks[tab].classList.add('active');
            // Refresh stats when switching to stats tab
            if (tab === 'stats') renderStatistics();
        });
    });

    // ===== Modal close handlers =====
    // Close buttons (×) and Cancel buttons
    document.querySelectorAll('.close, .btn-cancel').forEach(btn => {
        btn.addEventListener('click', () => {
            const modalId = btn.getAttribute('data-modal');
            if (modalId) closeModal(modalId);
        });
    });

    // Click outside modal to close
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.style.display = 'none';
        });
    });

    // =============================================
    //   BOOKS
    // =============================================
    document.getElementById('new-book-btn').addEventListener('click', () => {
        document.getElementById('book-modal-title').textContent = 'New Book';
        document.getElementById('book-form').reset();
        document.getElementById('book-id').value = '';
        document.getElementById('book-modal').style.display = 'block';
    });

    document.getElementById('book-form').addEventListener('submit', (e) => {
        e.preventDefault();
        saveBook();
    });

    // Event delegation for book table actions
    document.querySelector('#books-table tbody').addEventListener('click', (e) => {
        const btn = e.target.closest('.action-btn');
        if (!btn) return;
        const id = btn.dataset.id;
        if (btn.classList.contains('edit')) editBook(id);
        if (btn.classList.contains('delete')) deleteBook(id);
    });

    function saveBook() {
        const id = document.getElementById('book-id').value;
        const name = document.getElementById('book-name').value.trim();
        const author = document.getElementById('book-author').value.trim();
        const year = parseInt(document.getElementById('book-year').value);
        const publisher = document.getElementById('book-publisher').value.trim();
        const pages = parseInt(document.getElementById('book-pages').value);
        const copies = parseInt(document.getElementById('book-copies').value);

        const books = getData('books');

        if (id) {
            const index = books.findIndex(b => b.id == id);
            if (index !== -1) {
                books[index] = { id: parseInt(id), name, author, year, publisher, pages, copies };
                showToast('Book updated successfully');
            }
        } else {
            books.push({ id: nextId(books), name, author, year, publisher, pages, copies });
            showToast('Book added successfully');
        }

        setData('books', books);
        closeModal('book-modal');
        renderBooks();
        renderStatistics();
    }

    function renderBooks(sortBy, dataOverride) {
        sortBy = sortBy || document.getElementById('book-sort').value;
        let books = dataOverride || getData('books');

        // Sort
        if (sortBy === 'name') books.sort((a, b) => a.name.localeCompare(b.name));
        else if (sortBy === 'author') books.sort((a, b) => a.author.localeCompare(b.author));
        else if (sortBy === 'copies') books.sort((a, b) => b.copies - a.copies);

        const tbody = document.querySelector('#books-table tbody');
        tbody.innerHTML = '';

        if (books.length === 0) {
            tbody.innerHTML = '<tr class="empty-row"><td colspan="8">No books found. Click "+ New Book" to add one.</td></tr>';
            return;
        }

        books.forEach(book => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${book.id}</td>
                <td><strong>${escapeHtml(book.name)}</strong></td>
                <td>${escapeHtml(book.author)}</td>
                <td>${book.year}</td>
                <td>${escapeHtml(book.publisher)}</td>
                <td>${book.pages}</td>
                <td>${book.copies}</td>
                <td>
                    <button class="action-btn edit" data-id="${book.id}">Edit</button>
                    <button class="action-btn delete" data-id="${book.id}">Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    function editBook(id) {
        const books = getData('books');
        const book = books.find(b => b.id == id);
        if (!book) return;

        document.getElementById('book-modal-title').textContent = 'Edit Book';
        document.getElementById('book-id').value = book.id;
        document.getElementById('book-name').value = book.name;
        document.getElementById('book-author').value = book.author;
        document.getElementById('book-year').value = book.year;
        document.getElementById('book-publisher').value = book.publisher;
        document.getElementById('book-pages').value = book.pages;
        document.getElementById('book-copies').value = book.copies;
        document.getElementById('book-modal').style.display = 'block';
    }

    function deleteBook(id) {
        if (!confirm('Are you sure you want to delete this book?')) return;

        let books = getData('books');
        let cards = getData('cards');

        // Restore copies for any unreturned cards before deleting
        cards.forEach(card => {
            if (card.bookId == id && !card.returnDate) {
                // This card was borrowing this book — no need to restore since we're deleting the book,
                // but we mark it returned so the card data stays consistent
                card.returnDate = new Date().toISOString().split('T')[0];
            }
        });

        // Remove the book
        books = books.filter(b => b.id != id);

        setData('books', books);
        setData('cards', cards);
        renderBooks();
        renderCards();
        renderStatistics();
        showToast('Book deleted', 'info');
    }

    function searchBooks(term) {
        if (!term) { renderBooks(); return; }
        const books = getData('books');
        const filtered = books.filter(b =>
            b.name.toLowerCase().includes(term) ||
            b.author.toLowerCase().includes(term) ||
            b.publisher.toLowerCase().includes(term)
        );
        renderBooks(null, filtered);
    }

    // Book sort & search handlers
    document.getElementById('book-sort-btn').addEventListener('click', () => {
        renderBooks(document.getElementById('book-sort').value);
    });
    document.getElementById('book-search-btn').addEventListener('click', () => {
        searchBooks(document.getElementById('book-search').value.toLowerCase());
    });
    document.getElementById('book-search').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') searchBooks(e.target.value.toLowerCase());
    });

    // =============================================
    //   VISITORS
    // =============================================
    document.getElementById('new-visitor-btn').addEventListener('click', () => {
        document.getElementById('visitor-modal-title').textContent = 'New Visitor';
        document.getElementById('visitor-form').reset();
        document.getElementById('visitor-id').value = '';
        document.getElementById('visitor-modal').style.display = 'block';
    });

    document.getElementById('visitor-form').addEventListener('submit', (e) => {
        e.preventDefault();
        saveVisitor();
    });

    // Event delegation for visitor table actions
    document.querySelector('#visitors-table tbody').addEventListener('click', (e) => {
        const btn = e.target.closest('.action-btn');
        if (!btn) return;
        const id = btn.dataset.id;
        if (btn.classList.contains('edit')) editVisitor(id);
        if (btn.classList.contains('delete')) deleteVisitor(id);
    });

    function saveVisitor() {
        const id = document.getElementById('visitor-id').value;
        const name = document.getElementById('visitor-name').value.trim();
        const phone = document.getElementById('visitor-phone').value.trim();

        const visitors = getData('visitors');

        if (id) {
            const index = visitors.findIndex(v => v.id == id);
            if (index !== -1) {
                visitors[index] = { id: parseInt(id), name, phone };
                showToast('Visitor updated successfully');
            }
        } else {
            visitors.push({ id: nextId(visitors), name, phone });
            showToast('Visitor added successfully');
        }

        setData('visitors', visitors);
        closeModal('visitor-modal');
        renderVisitors();
        renderStatistics();
    }

    function renderVisitors(sortBy, dataOverride) {
        sortBy = sortBy || document.getElementById('visitor-sort').value;
        let visitors = dataOverride || getData('visitors');

        if (sortBy === 'id') visitors.sort((a, b) => a.id - b.id);
        else if (sortBy === 'name') visitors.sort((a, b) => a.name.localeCompare(b.name));

        const tbody = document.querySelector('#visitors-table tbody');
        tbody.innerHTML = '';

        if (visitors.length === 0) {
            tbody.innerHTML = '<tr class="empty-row"><td colspan="4">No visitors found. Click "+ New Visitor" to add one.</td></tr>';
            return;
        }

        visitors.forEach(visitor => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${visitor.id}</td>
                <td><strong>${escapeHtml(visitor.name)}</strong></td>
                <td>${escapeHtml(visitor.phone)}</td>
                <td>
                    <button class="action-btn edit" data-id="${visitor.id}">Edit</button>
                    <button class="action-btn delete" data-id="${visitor.id}">Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    function editVisitor(id) {
        const visitors = getData('visitors');
        const visitor = visitors.find(v => v.id == id);
        if (!visitor) return;

        document.getElementById('visitor-modal-title').textContent = 'Edit Visitor';
        document.getElementById('visitor-id').value = visitor.id;
        document.getElementById('visitor-name').value = visitor.name;
        document.getElementById('visitor-phone').value = visitor.phone;
        document.getElementById('visitor-modal').style.display = 'block';
    }

    function deleteVisitor(id) {
        // Check if visitor has unreturned books
        const cards = getData('cards');
        const unreturnedCards = cards.filter(c => c.visitorId == id && !c.returnDate);
        if (unreturnedCards.length > 0) {
            showToast(`Cannot delete: visitor has ${unreturnedCards.length} unreturned book(s).`, 'error');
            return;
        }

        if (!confirm('Are you sure you want to delete this visitor? Their card history will be preserved.')) return;

        let visitors = getData('visitors');
        visitors = visitors.filter(v => v.id != id);
        setData('visitors', visitors);

        renderVisitors();
        renderCards();
        renderStatistics();
        showToast('Visitor deleted', 'info');
    }

    function searchVisitors(term) {
        if (!term) { renderVisitors(); return; }
        const visitors = getData('visitors');
        const filtered = visitors.filter(v =>
            v.name.toLowerCase().includes(term) ||
            v.phone.toLowerCase().includes(term)
        );
        renderVisitors(null, filtered);
    }

    // Visitor sort & search handlers
    document.getElementById('visitor-sort-btn').addEventListener('click', () => {
        renderVisitors(document.getElementById('visitor-sort').value);
    });
    document.getElementById('visitor-search-btn').addEventListener('click', () => {
        searchVisitors(document.getElementById('visitor-search').value.toLowerCase());
    });
    document.getElementById('visitor-search').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') searchVisitors(e.target.value.toLowerCase());
    });

    // =============================================
    //   CARDS
    // =============================================
    document.getElementById('new-card-btn').addEventListener('click', () => {
        document.getElementById('card-form').reset();
        document.getElementById('card-id').value = '';

        const today = new Date().toISOString().split('T')[0];
        document.getElementById('card-borrow-date').value = today;

        // Populate visitor dropdown
        const visitorSelect = document.getElementById('card-visitor');
        visitorSelect.innerHTML = '';
        const visitors = getData('visitors');
        if (visitors.length === 0) {
            showToast('Please add a visitor first.', 'error');
            return;
        }
        visitors.forEach(v => {
            const opt = document.createElement('option');
            opt.value = v.id;
            opt.textContent = `${v.id} - ${v.name}`;
            visitorSelect.appendChild(opt);
        });

        // Populate book dropdown (only available books)
        const bookSelect = document.getElementById('card-book');
        bookSelect.innerHTML = '';
        const books = getData('books');
        const available = books.filter(b => b.copies > 0);
        if (available.length === 0) {
            showToast('No books available for borrowing.', 'error');
            return;
        }
        available.forEach(b => {
            const opt = document.createElement('option');
            opt.value = b.id;
            opt.textContent = `${b.id} - ${b.name} (${b.copies} available)`;
            bookSelect.appendChild(opt);
        });

        document.getElementById('card-modal').style.display = 'block';
    });

    document.getElementById('card-form').addEventListener('submit', (e) => {
        e.preventDefault();
        saveCard();
    });

    // Event delegation for card table actions
    document.querySelector('#cards-table tbody').addEventListener('click', (e) => {
        const btn = e.target.closest('.action-btn');
        if (!btn) return;
        const id = btn.dataset.id;
        if (btn.classList.contains('return')) returnBook(id);
    });

    function saveCard() {
        const id = document.getElementById('card-id').value;
        const visitorId = parseInt(document.getElementById('card-visitor').value);
        const bookId = parseInt(document.getElementById('card-book').value);
        const borrowDate = document.getElementById('card-borrow-date').value;

        const cards = getData('cards');
        const books = getData('books');
        const visitors = getData('visitors');

        const visitor = visitors.find(v => v.id === visitorId);
        const book = books.find(b => b.id === bookId);
        if (!visitor || !book) { showToast('Invalid visitor or book.', 'error'); return; }

        if (id) {
            // Update existing card
            const index = cards.findIndex(c => c.id == id);
            if (index !== -1) {
                cards[index] = {
                    id: parseInt(id),
                    visitorId,
                    bookId,
                    borrowDate,
                    returnDate: cards[index].returnDate
                };
            }
        } else {
            // Add new card
            cards.push({
                id: nextId(cards),
                visitorId,
                bookId,
                borrowDate,
                returnDate: ''
            });

            // Decrease book copies
            const bi = books.findIndex(b => b.id === bookId);
            if (bi !== -1) {
                books[bi].copies -= 1;
                setData('books', books);
            }
            showToast(`"${book.name}" borrowed by ${visitor.name}`);
        }

        setData('cards', cards);
        closeModal('card-modal');
        renderCards();
        renderBooks();
        renderStatistics();
    }

    function renderCards(sortBy, dataOverride) {
        sortBy = sortBy || document.getElementById('card-sort').value;
        let cards = dataOverride || getData('cards');

        if (sortBy === 'borrowDate') {
            cards.sort((a, b) => new Date(b.borrowDate) - new Date(a.borrowDate));
        } else if (sortBy === 'returnDate') {
            cards.sort((a, b) => {
                if (!a.returnDate && b.returnDate) return -1;
                if (a.returnDate && !b.returnDate) return 1;
                if (!a.returnDate && !b.returnDate) return 0;
                return new Date(b.returnDate) - new Date(a.returnDate);
            });
        }

        const tbody = document.querySelector('#cards-table tbody');
        tbody.innerHTML = '';

        if (cards.length === 0) {
            tbody.innerHTML = '<tr class="empty-row"><td colspan="6">No cards found. Click "+ New Card" to create one.</td></tr>';
            return;
        }

        cards.forEach(card => {
            const tr = document.createElement('tr');
            const visitorName = getVisitorName(card.visitorId);
            const bookName = getBookName(card.bookId);
            const returnDateDisplay = card.returnDate
                ? `<span class="status-badge returned">${formatDate(card.returnDate)}</span>`
                : `<span class="status-badge borrowed">Borrowed</span>`;
            const actionBtn = card.returnDate
                ? ''
                : `<button class="action-btn return" data-id="${card.id}">Return</button>`;

            tr.innerHTML = `
                <td>${card.id}</td>
                <td>${escapeHtml(visitorName)}</td>
                <td>${escapeHtml(bookName)}</td>
                <td>${formatDate(card.borrowDate)}</td>
                <td>${returnDateDisplay}</td>
                <td>${actionBtn}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    function returnBook(cardId) {
        const cards = getData('cards');
        const books = getData('books');

        const ci = cards.findIndex(c => c.id == cardId);
        if (ci === -1) return;

        const today = new Date().toISOString().split('T')[0];
        cards[ci].returnDate = today;

        // Restore book copy
        const bi = books.findIndex(b => b.id === cards[ci].bookId);
        if (bi !== -1) {
            books[bi].copies += 1;
            setData('books', books);
        }

        setData('cards', cards);
        renderCards();
        renderBooks();
        renderStatistics();
        showToast('Book returned successfully');
    }

    function searchCards(term) {
        if (!term) { renderCards(); return; }
        const cards = getData('cards');
        const filtered = cards.filter(c => {
            const vName = getVisitorName(c.visitorId).toLowerCase();
            const bName = getBookName(c.bookId).toLowerCase();
            return vName.includes(term) || bName.includes(term);
        });
        renderCards(null, filtered);
    }

    // Card sort & search handlers
    document.getElementById('card-sort-btn').addEventListener('click', () => {
        renderCards(document.getElementById('card-sort').value);
    });
    document.getElementById('card-search-btn').addEventListener('click', () => {
        searchCards(document.getElementById('card-search').value.toLowerCase());
    });
    document.getElementById('card-search').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') searchCards(e.target.value.toLowerCase());
    });

    // =============================================
    //   STATISTICS
    // =============================================
    function renderStatistics() {
        const cards = getData('cards');
        const books = getData('books');
        const visitors = getData('visitors');

        // Most popular books
        const bookCounts = {};
        cards.forEach(c => { bookCounts[c.bookId] = (bookCounts[c.bookId] || 0) + 1; });

        const popularBooks = Object.entries(bookCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([bookId, count]) => {
                const book = books.find(b => b.id == bookId);
                return book ? `${book.name} — ${count} time${count > 1 ? 's' : ''}` : `Deleted book — ${count} time${count > 1 ? 's' : ''}`;
            });

        const popularList = document.getElementById('popular-books');
        const noPopular = document.getElementById('no-popular-books');
        popularList.innerHTML = '';
        if (popularBooks.length === 0) {
            noPopular.style.display = 'block';
        } else {
            noPopular.style.display = 'none';
            popularBooks.forEach(text => {
                const li = document.createElement('li');
                li.textContent = text;
                popularList.appendChild(li);
            });
        }

        // Most active visitors
        const visitorCounts = {};
        cards.forEach(c => { visitorCounts[c.visitorId] = (visitorCounts[c.visitorId] || 0) + 1; });

        const activeVisitors = Object.entries(visitorCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([visitorId, count]) => {
                const visitor = visitors.find(v => v.id == visitorId);
                return visitor ? `${visitor.name} — ${count} book${count > 1 ? 's' : ''}` : `Deleted visitor — ${count} book${count > 1 ? 's' : ''}`;
            });

        const activeList = document.getElementById('active-visitors');
        const noActive = document.getElementById('no-active-visitors');
        activeList.innerHTML = '';
        if (activeVisitors.length === 0) {
            noActive.style.display = 'block';
        } else {
            noActive.style.display = 'none';
            activeVisitors.forEach(text => {
                const li = document.createElement('li');
                li.textContent = text;
                activeList.appendChild(li);
            });
        }
    }

    // =============================================
    //   UTILITY
    // =============================================
    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // ===== Initial render =====
    renderBooks();
    renderVisitors();
    renderCards();
    renderStatistics();
});
