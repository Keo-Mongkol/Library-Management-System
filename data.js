// ===== Data Management (data.js) =====

// Default initial data for demo/first load
const initialBooks = [
    { id: 1, name: "Harry Potter and the Philosopher's Stone", author: "J.K. Rowling", year: 1997, publisher: "Bloomsbury", pages: 223, copies: 5 },
    { id: 2, name: "Harry Potter and the Chamber of Secrets", author: "J.K. Rowling", year: 1998, publisher: "Bloomsbury", pages: 251, copies: 4 },
    { id: 3, name: "Harry Potter and the Prisoner of Azkaban", author: "J.K. Rowling", year: 1999, publisher: "Bloomsbury", pages: 317, copies: 3 },
    { id: 4, name: "Harry Potter and the Goblet of Fire", author: "J.K. Rowling", year: 2000, publisher: "Bloomsbury", pages: 636, copies: 2 },
    { id: 5, name: "Harry Potter and the Order of the Phoenix", author: "J.K. Rowling", year: 2003, publisher: "Bloomsbury", pages: 766, copies: 4 },
    { id: 6, name: "Harry Potter and the Half-Blood Prince", author: "J.K. Rowling", year: 2005, publisher: "Bloomsbury", pages: 607, copies: 3 },
    { id: 7, name: "Harry Potter and the Deathly Hallows", author: "J.K. Rowling", year: 2007, publisher: "Bloomsbury", pages: 607, copies: 5 },
    { id: 8, name: "The Great Gatsby", author: "F. Scott Fitzgerald", year: 1925, publisher: "Scribner", pages: 180, copies: 3 },
    { id: 9, name: "To Kill a Mockingbird", author: "Harper Lee", year: 1960, publisher: "J.B. Lippincott & Co.", pages: 281, copies: 2 },
    { id: 10, name: "1984", author: "George Orwell", year: 1949, publisher: "Secker & Warburg", pages: 328, copies: 3 }
];

const initialVisitors = [
    { id: 1, name: "Alice Johnson", phone: "081-234-5678" },
    { id: 2, name: "Bob Smith", phone: "089-876-5432" },
    { id: 3, name: "Charlie Davis", phone: "086-112-2334" },
    { id: 4, name: "Diana Wilson", phone: "085-432-1098" }
];

const initialCards = [
    { id: 1, visitorId: 1, bookId: 1, borrowDate: "2026-10-15", returnDate: "" },
    { id: 2, visitorId: 2, bookId: 2, borrowDate: "2026-10-10", returnDate: "2026-10-18" }
];

// Initialize localStorage if keys do not already exist, or append initial demo items if missing
function initStorage() {
    // 1. Books initialization / migration
    if (!localStorage.getItem('books')) {
        localStorage.setItem('books', JSON.stringify(initialBooks));
    } else {
        const existingBooks = getData('books');
        let updated = false;
        initialBooks.forEach(initBook => {
            const exists = existingBooks.some(b => b.name.toLowerCase() === initBook.name.toLowerCase());
            if (!exists) {
                const nextBookId = nextId(existingBooks);
                existingBooks.push({ ...initBook, id: nextBookId });
                updated = true;
            }
        });
        if (updated) {
            setData('books', existingBooks);
        }
    }

    // 2. Visitors initialization / migration
    if (!localStorage.getItem('visitors')) {
        localStorage.setItem('visitors', JSON.stringify(initialVisitors));
    } else {
        const existingVisitors = getData('visitors');
        let updatedVisitors = false;
        initialVisitors.forEach(initVisitor => {
            const exists = existingVisitors.some(v => v.name.toLowerCase() === initVisitor.name.toLowerCase());
            if (!exists) {
                const nextVisitorId = nextId(existingVisitors);
                existingVisitors.push({ ...initVisitor, id: nextVisitorId });
                updatedVisitors = true;
            }
        });
        if (updatedVisitors) {
            setData('visitors', existingVisitors);
        }
    }

    // 3. Cards initialization / migration
    if (!localStorage.getItem('cards')) {
        localStorage.setItem('cards', JSON.stringify(initialCards));
    } else {
        const existingCards = getData('cards');
        if (existingCards.length === 0 && initialCards.length > 0) {
            setData('cards', initialCards);
        }
    }
}

// Retrieve data array by entity key ('books', 'visitors', 'cards')
function getData(key) {
    return JSON.parse(localStorage.getItem(key)) || [];
}

// Persist data array by entity key
function setData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

// Compute the next available numeric ID for an entity list
function nextId(arr) {
    return arr.reduce((max, item) => Math.max(max, item.id), 0) + 1;
}

// Name lookup helpers
function getBookName(bookId) {
    const books = getData('books');
    const book = books.find(b => b.id == bookId);
    return book ? book.name : '(Deleted Book)';
}

function getVisitorName(visitorId) {
    const visitors = getData('visitors');
    const visitor = visitors.find(v => v.id == visitorId);
    return visitor ? visitor.name : '(Deleted Visitor)';
}

