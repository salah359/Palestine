/**
 * ======================================================================
 * TATREEZ ELEGANCE - FULL STACK FRONTEND LOGIC (ENTERPRISE EDITION)
 * ======================================================================
 * Advanced architecture handling Cloud fetches, dynamic DOM building,
 * WhatsApp checkout flow routing, and persistent cart caching.
 */

// Global API Bridge Configuration
const API_URL = 'http://localhost:5000/api';

// WhatsApp Merchant Configuration (IMPORTANT: Update to your business number)
// Format must be country code without the '+' symbol or spaces (e.g., 447123456789)
const ADMIN_WHATSAPP_NUMBER = "447123456789"; 

// Global State Caching for Client-Side memory
let globalProducts = [];
let currentModalProduct = {};

// LocalStorage Hydration (Maintains cart if user closes browser)
let cart = JSON.parse(localStorage.getItem('tatreezCart')) || [];
let cartTotal = 0;

/**
 * --- CORE INITIALIZATION SEQUENCE ---
 * Triggers necessary fetch requests as soon as the DOM is structurally ready
 */
document.addEventListener('DOMContentLoaded', async () => {
    // Load visual preferences
    checkThemePreference();
    updateCartUI();
    
    // Dynamic Cloud Data Injection
    await fetchMainCarousel();
    await fetchProducts();
    
    // Set WhatsApp link for floating bubble
    const waLink = document.getElementById('floatingWhatsApp');
    if(waLink) waLink.href = `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=Hello%20Tatreez%20Elegance!%20I%20have%20a%20question.`;
    
    // Deep-Linking Engine (Detects if user came from a "Share" link)
    const urlParams = new URLSearchParams(window.location.search);
    const sharedProductId = urlParams.get('product');
    
    // If link contains ID, navigate to shop and auto-fire modal
    if (sharedProductId && globalProducts.length > 0) {
        showPage('shop');
        // Slight delay to ensure DOM paint
        setTimeout(() => { openQuickView(sharedProductId); }, 300);
    }
});

/**
 * --- CLOUD FETCH LOGIC: CAROUSEL ---
 * Replaces hardcoded HTML images with AWS/GCS definitions
 */
async function fetchMainCarousel() {
    try {
        const response = await fetch(`${API_URL}/products/settings`);
        const settings = await response.json();
        
        const container = document.getElementById('carousel-inner-container');
        container.innerHTML = ''; // Wipe loading spinner
        
        // Handle Empty DB State gracefully
        if (!settings.carouselImages || settings.carouselImages.length === 0) {
            container.innerHTML = `
                <div class="carousel-item active h-100">
                    <img src="https://images.unsplash.com/photo-1605337222543-85b4f620f4c3?auto=format&fit=crop&w=1920&q=80" class="d-block w-100 h-100 object-fit-cover">
                    <div class="carousel-caption h-100 d-flex flex-column justify-content-center">
                        <h1 class="display-2 fw-bold text-white shadow-text">Woven with History</h1>
                    </div>
                </div>`;
            return;
        }

        // Map over Cloud array and build complex DOM nodes
        settings.carouselImages.forEach((imgUrl, index) => {
            const isActive = index === 0 ? 'active' : '';
            container.innerHTML += `
                <div class="carousel-item ${isActive} h-100">
                    <div class="carousel-overlay position-absolute w-100 h-100 bg-dark opacity-50 z-1"></div>
                    <img src="${imgUrl}" class="d-block w-100 h-100 object-fit-cover position-relative z-0">
                    <div class="carousel-caption d-flex flex-column align-items-center justify-content-center h-100 z-2 pb-5">
                        <h1 class="display-1 fw-bold text-white mb-4 shadow-text" style="font-family: 'Georgia', serif;">Authentic Roots</h1>
                        <p class="lead text-white fw-bold mb-5 shadow-text">Hand-stitched narratives of the homeland.</p>
                        <button class="btn btn-light btn-lg px-5 py-3 fw-bold rounded-pill shadow-lg hover-lift text-danger" onclick="showPage('shop')">
                            Explore the Gallery
                        </button>
                    </div>
                </div>`;
        });
    } catch (error) {
        console.error("Critical Failure: Main Carousel API connection rejected.", error);
    }
}

/**
 * --- CLOUD FETCH LOGIC: INVENTORY ---
 */
async function fetchProducts() {
    try {
        const response = await fetch(`${API_URL}/products`);
        if (!response.ok) throw new Error('API Rejection on /products');
        
        // Save to cache memory to prevent redundant database queries during filtering
        globalProducts = await response.json();
        
        // Trigger render
        applyFilters();
    } catch (error) {
        console.error("Database Connection Exception:", error);
        document.getElementById('dynamic-products-container').innerHTML = `
            <div class="col-12 text-center py-5 mt-5">
                <i class="fas fa-satellite-dish fa-4x text-danger mb-4"></i>
                <h3 class="fw-bold text-dark">System Offline</h3>
                <p class="text-muted fs-5">Could not establish connection to the primary node server.</p>
            </div>`;
    }
}

/**
 * --- SORTING & FILTERING ENGINE ---
 */
function applyFilters() {
    const sortValue = document.getElementById('sortFilter').value;
    
    // Clone array to prevent mutating global cache
    let sortedProducts = [...globalProducts];

    // Mathematical Sorting Logic
    if (sortValue === 'priceLow') {
        sortedProducts.sort((a, b) => {
            const priceA = a.discountPercentage > 0 ? a.price * (1 - a.discountPercentage/100) : a.price;
            const priceB = b.discountPercentage > 0 ? b.price * (1 - b.discountPercentage/100) : b.price;
            return priceA - priceB;
        });
    } else if (sortValue === 'priceHigh') {
        sortedProducts.sort((a, b) => {
            const priceA = a.discountPercentage > 0 ? a.price * (1 - a.discountPercentage/100) : a.price;
            const priceB = b.discountPercentage > 0 ? b.price * (1 - b.discountPercentage/100) : b.price;
            return priceB - priceA;
        });
    }
    // "newest" requires no math as DB fetch is naturally sorted by createdAt

    renderShop(sortedProducts);
}

/**
 * --- DYNAMIC DOM CONSTRUCTION: THE GALLERY ---
 */
function renderShop(productsArray) {
    const container = document.getElementById('dynamic-products-container');
    container.innerHTML = ''; // Wipe grid clean
    
    if(productsArray.length === 0) {
        container.innerHTML = '<div class="col-12 text-center text-muted py-5 fs-4">The gallery is currently being curated.</div>';
        return;
    }

    productsArray.forEach(product => {
        // Business Math Calculation
        const finalPrice = product.discountPercentage > 0 
            ? product.price - (product.price * (product.discountPercentage / 100)) 
            : product.price;
            
        // Legacy Image Fallback Logic (Handles DB arrays vs single strings)
        let mainImage = 'https://via.placeholder.com/800?text=No+Image';
        if (product.images && product.images.length > 0) mainImage = product.images[0];
        else if (product.image) mainImage = product.image;
        
        // Conditional DOM Elements
        const stockBadge = !product.inStock 
            ? `<span class="badge bg-dark bg-opacity-75 text-white position-absolute top-0 start-0 m-3 z-3 px-3 py-2 fs-6 rounded-1">OUT OF STOCK</span>` 
            : '';
            
        const discountBadge = product.discountPercentage > 0 
            ? `<span class="badge bg-danger position-absolute top-0 end-0 m-3 z-3 shadow px-3 py-2 fs-6 rounded-1">-${product.discountPercentage}% OFF</span>` 
            : '';

        const priceHTML = product.discountPercentage > 0 
            ? `<span class="text-decoration-line-through text-muted me-2 fs-5">$${product.price.toFixed(2)}</span>
               <span class="fw-bold fs-4 text-danger">$${finalPrice.toFixed(2)}</span>`
            : `<span class="fw-bold fs-4 text-dark">$${product.price.toFixed(2)}</span>`;

        // Inject Card
        container.innerHTML += `
            <div class="col-md-6 col-lg-4">
                <div class="card product-card h-100 shadow-sm border-0 position-relative rounded-4 overflow-hidden" style="cursor: pointer;" onclick="openQuickView('${product._id}')">
                    
                    ${stockBadge}
                    ${discountBadge}
                    
                    <button class="btn btn-light rounded-circle position-absolute shadow border border-dark" style="top:250px; right:15px; z-index:10; width:45px; height:45px;" onclick="shareProduct('${product._id}', event)" aria-label="Copy Direct Link">
                        <i class="fas fa-share-alt text-dark fs-5"></i>
                    </button>

                    <div class="card-img-wrapper overflow-hidden bg-light" style="height: 320px;">
                        <img src="${mainImage}" class="card-img-placeholder w-100 h-100 object-fit-cover transition-slow" alt="${product.name}">
                    </div>
                    
                    <div class="card-body text-center bg-card-custom d-flex flex-column p-4">
                        <h4 class="card-title fw-bold text-dark mb-1" style="font-family: 'Georgia', serif;">${product.name}</h4>
                        <div class="price-container mb-4 mt-3 bg-light p-2 rounded-3 border">
                            ${priceHTML}
                        </div>
                        <button class="btn btn-dark w-100 mt-auto fw-bold py-3 fs-5 rounded-pill hover-lift">
                            <i class="fas fa-search-plus me-2"></i> Inspect Detail
                        </button>
                    </div>
                </div>
            </div>`;
    });
}

/**
 * --- DEEP LINKING LOGIC ---
 * Copies a specifically formatted URL to the clipboard
 */
function shareProduct(productId, event) {
    // Stops the click from triggering the card's onclick modal opening
    event.stopPropagation(); 
    
    // Construct protocol://domain/path?product=id
    const shareLink = `${window.location.origin}${window.location.pathname}?product=${productId}`;
    
    // Interface with Browser Clipboard API
    navigator.clipboard.writeText(shareLink).then(() => {
        showToast("Product link securely copied to clipboard. Paste to share!");
    }).catch(err => {
        console.error('Clipboard permission denied', err);
        prompt("Copy this link manually:", shareLink);
    });
}

// Function to copy link specifically from inside the Modal
function copyShareLink(event) {
    if(!currentModalProduct._id) return;
    shareProduct(currentModalProduct._id, event);
}

/**
 * --- MULTI-MEDIA QUICK VIEW MODAL ---
 */
function openQuickView(productId) {
    const product = globalProducts.find(p => p._id === productId);
    if (!product) return;

    // Cache context for Cart logic
    currentModalProduct = product;

    // Inject Typography
    document.getElementById('modalTitle').innerText = product.name;
    document.getElementById('modalDesc').innerText = product.description || 'An elegant piece celebrating heritage.';

    // Manage Interactive Stock Badge
    const stockBadge = document.getElementById('modalStockBadge');
    if (product.inStock) {
        stockBadge.className = 'badge bg-dark fs-6 px-3 py-2 rounded-pill shadow-sm';
        stockBadge.innerHTML = '<i class="fas fa-box me-1"></i> Available Now';
    } else {
        stockBadge.className = 'badge bg-secondary opacity-75 fs-6 px-3 py-2 rounded-pill shadow-sm';
        stockBadge.innerHTML = '<i class="fas fa-times-circle me-1"></i> Out of Stock';
    }

    // Mathematical Formatting for Pricing UI
    const priceEl = document.getElementById('modalPrice');
    const origPriceEl = document.getElementById('modalOriginalPrice');
    
    if (product.discountPercentage > 0) {
        const dPrice = product.price * (1 - product.discountPercentage/100);
        priceEl.innerText = `$${dPrice.toFixed(2)}`;
        priceEl.className = 'fw-bold mb-0 display-4 text-danger';
        origPriceEl.innerText = `$${product.price.toFixed(2)}`;
        origPriceEl.classList.remove('d-none');
    } else {
        priceEl.innerText = `$${product.price.toFixed(2)}`;
        priceEl.className = 'fw-bold mb-0 display-4 text-dark';
        origPriceEl.classList.add('d-none');
    }

    // Complex Carousel Building (Handling Images + Video array logic)
    const mediaContainer = document.getElementById('modalMediaContainer');
    mediaContainer.innerHTML = ''; 
    let activeStateAssigned = false;
    
    // Map Images
    if (product.images && product.images.length > 0) {
        product.images.forEach((imgUrl) => {
            const activeClass = !activeStateAssigned ? 'active' : '';
            mediaContainer.innerHTML += `
                <div class="carousel-item ${activeClass} h-100">
                    <img src="${imgUrl}" class="d-block w-100 h-100 object-fit-cover">
                </div>`;
            activeStateAssigned = true;
        });
    } else if (product.image) {
        // Legacy Fallback
        mediaContainer.innerHTML += `<div class="carousel-item active h-100"><img src="${product.image}" class="d-block w-100 h-100 object-fit-cover"></div>`;
        activeStateAssigned = true;
    }
    
    // Map Video
    if (product.video) {
        const activeClass = !activeStateAssigned ? 'active' : '';
        mediaContainer.innerHTML += `
            <div class="carousel-item ${activeClass} h-100 position-relative">
                <video src="${product.video}" class="d-block w-100 h-100 object-fit-cover" controls autoplay muted loop playsinline></video>
            </div>`;
    }

    // Hide slider controls if only 1 piece of media exists
    const controlCount = (product.images ? product.images.length : 0) + (product.video ? 1 : 0);
    const btns = document.querySelectorAll('#productMediaCarousel button');
    btns.forEach(btn => btn.style.display = controlCount <= 1 ? 'none' : 'block');

    // Dropdown Architecture
    const sizeSelect = document.getElementById('modalSize');
    if (product.sizes && product.sizes.length > 0) {
        sizeSelect.innerHTML = product.sizes.map(s => `<option value="${s}">${s}</option>`).join('');
        sizeSelect.disabled = false;
    } else {
        sizeSelect.innerHTML = '<option>Standard</option>';
        sizeSelect.disabled = true;
    }
    
    // Security & Logic Interception on Buy Button
    const addBtn = document.getElementById('modalAddToCart');
    addBtn.disabled = !product.inStock;
    if (product.inStock) {
        addBtn.innerHTML = '<i class="fas fa-shopping-bag me-3"></i> Secure Item in Bag';
        addBtn.classList.remove('btn-secondary');
        addBtn.classList.add('btn-dark');
    } else {
        addBtn.innerHTML = '<i class="fas fa-ban me-2"></i> Currently Unavailable';
        addBtn.classList.remove('btn-dark');
        addBtn.classList.add('btn-secondary');
    }

    // Bootstrap Native Launch
    const modal = new bootstrap.Modal(document.getElementById('quickViewModal'));
    modal.show();
}

/**
 * --- SHOPPING CART STATE MANAGEMENT ---
 */
document.getElementById('modalAddToCart').addEventListener('click', () => {
    // Failsafe validation
    if(!currentModalProduct.inStock) return;
    
    const size = document.getElementById('modalSize').value;
    const finalPrice = currentModalProduct.discountPercentage > 0 
        ? currentModalProduct.price * (1 - currentModalProduct.discountPercentage/100) 
        : currentModalProduct.price;
    
    // Append to runtime memory array
    cart.push({ 
        name: currentModalProduct.name, 
        price: finalPrice, 
        size: size,
        id: Date.now() // Unique ID for deletion logic
    });
    
    // Hydrate local storage persistence
    localStorage.setItem('tatreezCart', JSON.stringify(cart));
    
    // Trigger visual feedback mechanisms
    updateCartUI();
    showToast(`${currentModalProduct.name} added to your collection!`);
    
    // Programmatic closure
    bootstrap.Modal.getInstance(document.getElementById('quickViewModal')).hide();
});

function updateCartUI() {
    const container = document.getElementById('cart-items');
    container.innerHTML = ''; 
    cartTotal = 0;
    
    // Update numerical bubble indicators
    const countStr = cart.length.toString();
    document.getElementById('cart-count').innerText = countStr;
    document.getElementById('floating-cart-count').innerText = countStr;

    // Handle Empty State
    if (cart.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="3" class="text-center text-muted py-5">
                    <i class="fas fa-box-open fa-3x mb-4 opacity-25 d-block"></i>
                    <span class="fs-4">Your shopping bag is completely empty.</span>
                </td>
            </tr>`;
    } else {
        // Map HTML rows and perform sum reduction
        cart.forEach((item, arrayIndex) => {
            cartTotal += parseFloat(item.price); 
            container.innerHTML += `
                <tr class="border-bottom border-light">
                    <td class="fw-bold py-4 fs-4 text-dark">
                        ${item.name} 
                        <div class="mt-2">
                            <span class="badge bg-light text-dark border shadow-sm fs-6 px-3 py-2 rounded-pill">Size Selected: ${item.size}</span>
                        </div>
                    </td>
                    <td class="text-center py-4 fw-bold fs-4 text-danger">$${item.price.toFixed(2)}</td>
                    <td class="text-end py-4">
                        <button class="btn btn-outline-danger px-4 py-2 rounded-pill fw-bold hover-lift" onclick="removeFromCart(${arrayIndex})">
                            <i class="fas fa-trash-alt me-2"></i> Remove
                        </button>
                    </td>
                </tr>`;
        });
    }
    
    document.getElementById('cart-total').innerText = cartTotal.toFixed(2);
}

function removeFromCart(targetIndex) {
    cart.splice(targetIndex, 1);
    localStorage.setItem('tatreezCart', JSON.stringify(cart));
    updateCartUI();
}

/**
 * --- WHATSAPP INTEGRATION & CHECKOUT ENGINE ---
 */
function openCheckoutModal() {
    if(cart.length === 0) {
        return alert("Security Protocol: Your cart is empty! Please add a heritage piece before proceeding to checkout.");
    }
    const myModal = new bootstrap.Modal(document.getElementById('checkoutModal'));
    myModal.show();
}

document.getElementById('checkoutForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Security and Performance UI
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-satellite-dish fa-spin me-2"></i> Encrypting Payload...';
    submitBtn.disabled = true;
    
    // Value Extraction
    const cName = document.getElementById('co-name').value;
    const cEmail = document.getElementById('co-email').value;
    const cPhone = document.getElementById('co-phone').value;
    const cAddress = document.getElementById('co-address').value;
    const cPostCode = document.getElementById('co-postcode').value;

    // Build the DB Schema matched JSON
    const orderData = { 
        customerName: cName, 
        email: cEmail, 
        phone: cPhone, 
        address: cAddress, 
        postCode: cPostCode, 
        items: cart, 
        totalAmount: cartTotal 
    };

    try {
        // Step 1: POST to backend so it shows up in Admin Dashboard
        const dbResponse = await fetch(`${API_URL}/orders`, { 
            method: 'POST', 
            headers: {'Content-Type': 'application/json'}, 
            body: JSON.stringify(orderData) 
        });

        if(!dbResponse.ok) throw new Error("Database refused transaction");

        // Step 2: String Formatting for WhatsApp API limits
        let waMessage = `*NEW HERITAGE ORDER* 🛍️\n\n`;
        waMessage += `*Buyer Details:*\n`;
        waMessage += `👤 ${cName}\n`;
        waMessage += `📞 ${cPhone}\n`;
        waMessage += `✉️ ${cEmail}\n\n`;
        waMessage += `*Shipping Details:*\n`;
        waMessage += `📍 ${cAddress}\n`;
        waMessage += `📮 ${cPostCode}\n\n`;
        waMessage += `*Purchased Items:*\n`;
        
        cart.forEach((i, idx) => {
            waMessage += `${idx + 1}. ${i.name} (Size: ${i.size}) - $${i.price.toFixed(2)}\n`;
        });
        
        waMessage += `\n*Total Remittance Due:* $${cartTotal.toFixed(2)}\n`;
        waMessage += `\n_Please send payment instructions._`;

        // Step 3: Cache clearing
        cart = []; 
        localStorage.setItem('tatreezCart', JSON.stringify([])); 
        updateCartUI();
        
        // Modal cleanup
        bootstrap.Modal.getInstance(document.getElementById('checkoutModal')).hide();
        e.target.reset();
        
        // Step 4: Final URL Encoding and Execution
        const encodedURI = encodeURIComponent(waMessage);
        window.open(`https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodedURI}`, '_blank');
        
        // Route back
        showPage('home');
        
    } catch (err) { 
        console.error("Order Sequence Failed:", err);
        alert("Transaction Error: Could not connect to database servers. Please try again."); 
    } finally {
        // Fallback UI restore
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
});

/**
 * --- GLOBAL SPA & THEME ENGINE ---
 */
function showPage(targetId) {
    document.querySelectorAll('.page-section').forEach(node => {
        node.classList.remove('active');
    });
    
    const view = document.getElementById(targetId);
    if(view) view.classList.add('active');
    
    // Force browser to reset scroll physics to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function checkThemePreference() { 
    if(localStorage.getItem('theme') === 'dark') toggleDarkMode(); 
}

function toggleDarkMode() {
    const isDark = document.body.classList.toggle('dark-mode');
    
    // Toggle Icon FontAwesome class
    const icon = document.getElementById('darkModeIcon');
    if(icon) {
        icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    }
    
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

function showToast(messageString) {
    const el = document.getElementById('toastMessage');
    if(el) {
        el.innerText = messageString;
        const toastNode = document.getElementById('cartToast');
        const btToast = new bootstrap.Toast(toastNode, { delay: 4000 });
        btToast.show();
    }
}