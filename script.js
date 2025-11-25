// API Configuration - Replace with your actual API endpoint
const API_BASE_URL = 'https://bulp-server-new.vercel.app/api'; // Change this to your backend URL

// DOM Elements
const productsGrid = document.getElementById('productsGrid');
const filterButtons = document.querySelectorAll('.filter-btn');
const searchInput = document.getElementById('searchInput');
const productModal = document.getElementById('productModal');
const closeModal = document.getElementById('closeModal');
const modalContent = document.getElementById('modalContent');
const loadingState = document.getElementById('loadingState');
const pagination = document.getElementById('pagination');

// Global products array
let products = [];
let filteredProducts = [];
let currentPage = 1;
const productsPerPage = 10;

// Initialize the page
document.addEventListener('DOMContentLoaded', function () {
    loadProductsFromAPI();
    setupEventListeners();
});

// Load products from secure API
async function loadProductsFromAPI() {
    try {
        loadingState.style.display = 'block';

        const response = await fetch(`${API_BASE_URL}/devices`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        products = await response.json();
        filteredProducts = [...products];
        displayProducts();
        loadingState.style.display = 'none';

    } catch (error) {
        console.error('Error loading products:', error);
        loadingState.innerHTML = `
            <div style="color: #ef4444; text-align: center;">
                <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 16px;"></i>
                <p>Error loading products. Please try again later.</p>
                <button onclick="loadProductsFromAPI()" class="btn btn-primary" style="margin-top: 16px;">
                    <i class="fas fa-redo"></i> Retry
                </button>
            </div>
        `;
    }
}

// Filter products based on brand and search term
function filterProducts(activeFilter = null) {
    const filter = activeFilter || document.querySelector('.filter-btn.active').getAttribute('data-filter');
    const searchTerm = searchInput.value.toLowerCase().trim();

    // Filter by brand
    if (filter === 'all') {
        filteredProducts = [...products];
    } else {
        filteredProducts = products.filter(product => product.basicDetails.brand.toLowerCase() === filter);
    }

    console.warn(filter)
    // Filter by search term
    if (searchTerm) {
        filteredProducts = filteredProducts.filter(product =>
            product.name.toLowerCase().includes(searchTerm) ||
            product.basicDetails.model.toLowerCase().includes(searchTerm) ||
            (product.basicDetails.color && product.basicDetails.color.toLowerCase().includes(searchTerm))
        );
    }

    currentPage = 1;
    displayProducts();
}

// Display products in the grid with pagination
function displayProducts() {
    if (filteredProducts.length === 0) {
        productsGrid.innerHTML = `
            <div style="text-align: center; grid-column: 1 / -1; padding: 40px;">
                <i class="fas fa-search" style="font-size: 3rem; color: #94a3b8; margin-bottom: 16px;"></i>
                <h3>No products found</h3>
                <p>Try adjusting your filters or check back later for new arrivals.</p>
            </div>
        `;
        pagination.innerHTML = '';
        return;
    }

    // Calculate pagination
    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    const productsToShow = filteredProducts.slice(startIndex, endIndex);

    // Render products
    productsGrid.innerHTML = productsToShow.map(product => `
        <div class="product-card">
            <div class="card-header">
                <div class="brand-logo">${product.brand.charAt(0)}</div>
                <div class="brand-name">${product.brand}</div>
            </div>
            <div class="card-body">
                <div class="image-placeholder">
                    ${product.images && product.images[0]
            ? `<img class='product-image' src="${product.images[0]}" alt="${(product.name || '').replace(/"/g, '&quot;')}" loading="lazy"
                                onerror="this.style.display='none'; this.parentElement.querySelector('.fallback-icon').style.display='flex';" />`
            : ''
        }
                    <div class="fallback-icon" style="${product.images && product.images[0] ? 'display:none;' : 'display:flex;'}">
                        <i class="fas fa-mobile-alt"></i>
                    </div>
                </div>
                <div class="product-name-section">
                    <div class="product-name">${product.name}</div>
                </div>
                <div class="card-info">
                    <div class="product-specs">
                        <div class="spec-item">
                            <span class="spec-label">Stockage</span>
                            <span class="spec-value">${product.basicDetails.storage} GB</span>
                        </div>
                        <div class="spec-item">
                            <span class="spec-label">Batterie</span>
                            <span class="spec-value">${product.condition.batteryHealth}</span>
                        </div>
                        <div class="spec-item">
                            <span class="spec-label">Couleur</span>
                            <span class="spec-value">${product.basicDetails.color}</span>
                        </div>
                    </div>
                    <div class="product-price">${product.price} DH</div>
                    <div class="product-actions">
                        <button class="btn btn-primary order-btn" data-id="${product.id}">
                            <i class="fab fa-whatsapp"></i> Commande via WhatsApp
                        </button>
                        <button class="btn btn-secondary details-btn" data-id="${product.id}">
                            <i class="fas fa-info-circle"></i> Détails
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    // Render pagination
    renderPagination(totalPages);
}

// Render pagination buttons
function renderPagination(totalPages) {
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }

    let paginationHTML = '';

    // Previous button
    paginationHTML += `
        <button class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}">
            <i class="fas fa-chevron-left"></i> Previous
        </button>
    `;

    // Page numbers
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // Adjust if we're at the end
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // First page and ellipsis if needed
    if (startPage > 1) {
        paginationHTML += `<button class="pagination-btn" data-page="1">1</button>`;
        if (startPage > 2) {
            paginationHTML += `<span class="pagination-ellipsis">...</span>`;
        }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <button class="pagination-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">
                ${i}
            </button>
        `;
    }

    // Last page and ellipsis if needed
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationHTML += `<span class="pagination-ellipsis">...</span>`;
        }
        paginationHTML += `<button class="pagination-btn" data-page="${totalPages}">${totalPages}</button>`;
    }

    // Next button
    paginationHTML += `
        <button class="pagination-btn" ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">
            Next <i class="fas fa-chevron-right"></i>
        </button>
    `;

    // Page info
    paginationHTML += `
        <div class="pagination-info">
            Page ${currentPage} of ${totalPages} • ${filteredProducts.length} products
        </div>
    `;

    pagination.innerHTML = paginationHTML;
}

// Setup event listeners
function setupEventListeners() {
    // Filter buttons
    filterButtons.forEach(button => {
        button.addEventListener('click', function () {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            const filter = this.getAttribute('data-filter');
            filterProducts(filter);
        });
    });

    // Search input
    searchInput.addEventListener('input', function () {
        filterProducts();
    });

    // Close modal
    closeModal.addEventListener('click', function () {
        productModal.style.display = 'none';
    });

    // Close modal when clicking outside
    window.addEventListener('click', function (event) {
        if (event.target === productModal) {
            productModal.style.display = 'none';
        }
    });

    // Event delegation for dynamic buttons
    document.addEventListener('click', function (event) {
        // Order via WhatsApp buttons
        if (event.target.classList.contains('order-btn') ||
            event.target.parentElement.classList.contains('order-btn')) {
            const button = event.target.classList.contains('order-btn') ?
                event.target : event.target.parentElement;
            const productId = button.getAttribute('data-id');
            orderViaWhatsApp(productId);
        }

        // Product details buttons
        if (event.target.classList.contains('details-btn') ||
            event.target.parentElement.classList.contains('details-btn')) {
            const button = event.target.classList.contains('details-btn') ?
                event.target : event.target.parentElement;
            const productId = button.getAttribute('data-id');
            showProductDetails(productId);
        }

        // Pagination buttons
        if (event.target.classList.contains('pagination-btn') &&
            !event.target.classList.contains('active') &&
            !event.target.disabled) {
            const page = parseInt(event.target.getAttribute('data-page'));
            if (page) {
                currentPage = page;
                displayProducts();
            }
        }

        // Similar product buttons in modal
        if (event.target.classList.contains('similar-details-btn') ||
            event.target.parentElement.classList.contains('similar-details-btn')) {
            const button = event.target.classList.contains('similar-details-btn') ?
                event.target : event.target.parentElement;
            const productId = button.getAttribute('data-id');
            showProductDetails(productId);
        }
    });
}

// Order via WhatsApp function
function orderViaWhatsApp(productId) {
    const product = products.find(p => p.id === productId);
    if (product) {
        const message = `Hello, I'm interested in purchasing the ${product.name}. Please provide more details.`;
        const encodedMessage = encodeURIComponent(message);
        const whatsappURL = `https://wa.me/1234567890?text=${encodedMessage}`;
        window.open(whatsappURL, '_blank');
    }
}

// Show product details in modal
function showProductDetails(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const similarProducts = products.filter(p =>
        p.brand === product.brand && p.id !== product.id
    ).slice(0, 3);

    // Build modal content with carousel when multiple images exist
    modalContent.innerHTML = `
        <h2 class="modal-title">${product.brand} ${product.basicDetails.model}</h2>

        ${product.images && product.images.length > 0
            ? `
            <div class="carousel">
                <div class="carousel-slides">
                    ${product.images.map((src, idx) => `
                        <div class="carousel-slide" style="${idx === 0 ? 'display:block;' : 'display:none;'}">
                            <img class="product-image-details" src="${src}" alt="${(product.name || '').replace(/"/g, '&quot;')}" loading="lazy"
                                onerror="this.style.display='none'; this.parentElement.querySelector('.fallback-icon').style.display='flex';" />
                            <div class="fallback-icon" style="display:none;">
                                <i class="fas fa-mobile-alt"></i>
                            </div>
                        </div>
                    `).join('')}
                </div>

                ${product.images.length > 1 ? `
                    <button class="carousel-prev btn" aria-label="Previous image">&lt;</button>
                    <button class="carousel-next btn" aria-label="Next image">&gt;</button>

                    <div class="carousel-indicators" aria-hidden="false">   
                        ${product.images.map((_, i) => `
                            <button class="carousel-indicator ${i === 0 ? 'active' : ''}" data-index="${i}" aria-label="Go to image ${i + 1}"></button>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
            `
            : `
            <div class="image-placeholder">
                <div class="fallback-icon" style="display:flex;">
                    <i class="fas fa-mobile-alt"></i>
                </div>
            </div>
            `
        }
        <div class="product-actions" style="margin-top: 30px;">
            <button class="btn btn-primary order-btn" data-id="${product.id}">
                <i class="fab fa-whatsapp"></i> Commande via WhatsApp
            </button>
        </div>
        <div class="modal-price">${product.price} DH</div>
        
        <div class="modal-sections">
            <div class="modal-section">
                <h3><i class="fas fa-mobile-alt"></i> Détails de base de l'appareil</h3>
                <div class="spec-grid">
                    <div class="spec-item-detailed">
                        <span class="spec-label-detailed">Nom</span>
                        <span class="spec-value-detailed">${product.basicDetails.model}</span>
                    </div>
                    <div class="spec-item-detailed">
                        <span class="spec-label-detailed">Couleur</span>
                        <span class="spec-value-detailed">${product.basicDetails.color}</span>
                    </div>
                    <div class="spec-item-detailed">
                        <span class="spec-label-detailed">Stockage</span>
                        <span class="spec-value-detailed">${product.basicDetails.storage} GB</span>
                    </div>
                    <div class="spec-item-detailed">
                        <span class="spec-label-detailed">Batterie</span>
                        <span class="spec-value-detailed">${product.condition.batteryHealth}</span>
                    </div>
                </div>
            </div>
        </div>
        
        ${similarProducts.length > 0 ? `
        <div class="similar-products">
            <h3>Produits similaires</h3>
            <div class="similar-grid">
                ${similarProducts.map(similar => `
                    <div class="similar-card">
                        <div class="similar-image">
                            <i class="fas fa-mobile-alt"></i>
                        </div>
                        <div class="similar-info">
                            <h4 class="similar-title">${similar.basicDetails.model}</h4>
                            <div class="similar-price">$${similar.price}</div>
                            <button class="btn btn-secondary similar-details-btn" data-id="${similar.id}" style="margin-top: 8px; padding: 6px 12px;">
                                Afficher les détails
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}
    `;

    // Initialize carousel behavior if present
    (function initModalCarousel() {
        const carousel = modalContent.querySelector('.carousel');
        if (!carousel) return;

        const slides = Array.from(carousel.querySelectorAll('.carousel-slide'));
        if (slides.length === 0) return;

        let currentIndex = 0;
        const prevBtn = carousel.querySelector('.carousel-prev');
        const nextBtn = carousel.querySelector('.carousel-next');
        const indicators = Array.from(carousel.querySelectorAll('.carousel-indicator'));

        function showSlide(index) {
            index = (index + slides.length) % slides.length;
            slides.forEach((s, i) => s.style.display = i === index ? 'block' : 'none');
            indicators.forEach((dot, i) => dot.classList.toggle('active', i === index));
            currentIndex = index;
        }

        if (prevBtn) prevBtn.addEventListener('click', () => showSlide(currentIndex - 1));
        if (nextBtn) nextBtn.addEventListener('click', () => showSlide(currentIndex + 1));
        indicators.forEach(dot => dot.addEventListener('click', () => {
            const i = parseInt(dot.getAttribute('data-index'), 10);
            if (!Number.isNaN(i)) showSlide(i);
        }));

        // Allow keyboard navigation while modal is open
        function onKey(e) {
            if (e.key === 'ArrowLeft') showSlide(currentIndex - 1);
            if (e.key === 'ArrowRight') showSlide(currentIndex + 1);
        }
        document.addEventListener('keydown', onKey);

        // Cleanup when modal closes
        const removeKeyListener = () => {
            document.removeEventListener('keydown', onKey);
            productModal.removeEventListener('click', outsideHandler);
        };
        const outsideHandler = (ev) => {
            if (ev.target === productModal) removeKeyListener();
        };
        productModal.addEventListener('click', outsideHandler);

        // When modal is hidden remove handlers
        const observer = new MutationObserver(() => {
            if (productModal.style.display === 'none') {
                removeKeyListener();
                observer.disconnect();
            }
        });
        observer.observe(productModal, { attributes: true, attributeFilter: ['style'] });
    })();

    productModal.style.display = 'block';
}

// Helper function to generate spec grids
function generateSpecGrid(data) {
    return Object.entries(data).map(([key, value]) => `
        <div class="spec-item-detailed">
            <span class="spec-label-detailed">${formatKey(key)}</span>
            <span class="spec-value-detailed">${typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}</span>
        </div>
    `).join('');
}

// Helper function to format object keys for display
function formatKey(key) {
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
}

// Make the loadProductsFromAPI function available globally for retry
window.loadProductsFromAPI = loadProductsFromAPI;