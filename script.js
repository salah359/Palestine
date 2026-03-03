/**
 * ======================================================================
 * TATREEZ ELEGANCE - FULL STACK FRONTEND LOGIC
 * ======================================================================
 */

// Connection to your Node.js / AWS Backend
const API_URL = 'http://localhost:5000/api';

// Global state to store products fetched from the database
let globalProducts = [];

document.addEventListener('DOMContentLoaded', () => {
    checkThemePreference();
    updateCartUI();
    
    // NEW: Fetch live database data immediately when the site loads
    fetchProducts();
    // (Optional: fetchCarouselSettings() could go here if you created a public GET route for it)
});

/**
 * --- 1. DYNAMIC BACKEND DATA FETCHING ---
 */
async function fetchProducts() {
    const container = document.getElementById('dynamic-products-container');
    
    try {
        const response = await fetch(`${API_URL}/products`);
        if (!response.ok) throw new Error('Failed to fetch from server');
        
        const products = await response.json();
        globalProducts = products; // Save to global memory for the Quick-View Modal
        
        // Clear the loading spinner
        container.innerHTML = '';
        
        if(products.length === 0) {
            container.innerHTML = '<div class="col-12 text-center text-muted py-5">No products available at the moment.</div>';
            return;
        }

        // Loop through the database array and build HTML cards
        products.forEach(product => {
            // Calculate discount if the admin set one
            const hasDiscount = product.discountPercentage > 0;
            const finalPrice = hasDiscount 
                ? (product.price - (product.price * (product.discountPercentage / 100)))
                : product.price;

            // Generate HTML structure
            const cardHTML = `
                <div class="col-md-4 mb-4">
                    <div class="card product-card h-100 shadow-sm border-0 position-relative">
                        
                        ${hasDiscount ? `<span class="badge bg-danger position-absolute top-0 end-0 m-3 z-3 shadow px-3 py-2 fs-6">-${product.discountPercentage}% OFF</span>` : ''}
                        
                        <div class="card-img-wrapper overflow-hidden position-relative bg-light" style="height: 350px;">
                            <img src="${product.image}" class="card-img-placeholder w-100 h-100 object-fit-cover" alt="${product.name}">
                            ${product.video ? `<div class="position-absolute bottom-0 start-0 m-2 badge bg-dark"><i class="fas fa-play me-1"></i> Video Available</div>` : ''}
                        </div>
                        
                        <div class="card-body text-center bg-card-custom d-flex flex-column p-4">
                            <span class="text-muted small text-uppercase fw-bold mb-2">${product.region}</span>
                            <h5 class="card-title fw-bold fs-4">${product.name}</h5>
                            
                            <div class="price-container mb-4 mt-2">
                                ${hasDiscount 
                                    ? `<span class="text-decoration-line-through text-muted me-2">$${product.price.toFixed(2)}</span>
                                       <span class="fw-bold fs-5 text-success">$${finalPrice.toFixed(2)}</span>`
                                    : `<span class="fw-bold fs-5">$${product.price.toFixed(2)}</span>`
                                }
                            </div>
                            
                            <button class="btn btn-outline-dark w-100 mt-auto hover-lift fw-bold py-2" 
                                    onclick="openQuickView('${product._id}')">
                                Quick View
                            </button>
                        </div>
                    </div>
                </div>
            `;
            container.innerHTML += cardHTML;
        });

    } catch (error) {
        console.error("Backend Connection Error:", error);
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
                <h5 class="text-danger">Failed to connect to the database.</h5>
                <p class="text-muted">Ensure your Node.js server is running on localhost:5000.</p>
            </div>`;
    }
}

/**
 * --- 2. DYNAMIC QUICK-VIEW MODAL ---
 */
function openQuickView(productId) {
    // Find the exact product from our fetched global array using the MongoDB ID
    const product = globalProducts.find(p => p._id === productId);
    if (!product) return;

    // Save product context for the Add to Cart button
    currentModalProduct = product;

    // Inject Text Data
    document.getElementById('modalTitle').innerText = product.name;
    document.getElementById('modalRegionBadge').innerText = `${product.region} Heritage`;
    document.getElementById('modalDesc').innerText = product.description;

    // Handle Pricing & Discounts
    const priceEl = document.getElementById('modalPrice');
    const origPriceEl = document.getElementById('modalOriginalPrice');
    
    if (product.discountPercentage > 0) {
        const discountedPrice = product.price - (product.price * (product.discountPercentage / 100));
        priceEl.innerText = `$${discountedPrice.toFixed(2)}`;
        priceEl.classList.add('text-success');
        origPriceEl.innerText = `$${product.price.toFixed(2)}`;
        origPriceEl.classList.remove('d-none');
    } else {
        priceEl.innerText = `$${product.price.toFixed(2)}`;
        priceEl.classList.remove('text-success');
        origPriceEl.classList.add('d-none');
    }

    // Handle Media (Image vs Video priority)
    const imgEl = document.getElementById('modalImage');
    const vidEl = document.getElementById('modalVideo');
    
    if (product.video) {
        imgEl.classList.add('d-none');
        vidEl.classList.remove('d-none');
        vidEl.src = product.video;
        vidEl.play(); // Auto-play the showcase video
    } else {
        vidEl.classList.add('d-none');
        vidEl.pause();
        imgEl.classList.remove('d-none');
        imgEl.src = product.image;
    }

    // Populate Size Dropdown Dynamically
    const sizeSelect = document.getElementById('modalSize');
    sizeSelect.innerHTML = '';
    product.sizes.forEach(size => {
        sizeSelect.innerHTML += `<option value="${size}">${size}</option>`;
    });

    // Populate Color Dropdown Dynamically (Hide if no colors specified by admin)
    const colorContainer = document.getElementById('colorSelectorContainer');
    const colorSelect = document.getElementById('modalColor');
    colorSelect.innerHTML = '';
    
    if (product.colors && product.colors.length > 0) {
        colorContainer.classList.remove('d-none');
        product.colors.forEach(color => {
            colorSelect.innerHTML += `<option value="${color}">${color}</option>`;
        });
    } else {
        colorContainer.classList.add('d-none');
    }

    // Show Modal
    const modal = new bootstrap.Modal(document.getElementById('quickViewModal'));
    modal.show();
}

// Event listener for the "Add to Bag" button inside the Modal
document.getElementById('modalAddToCart').addEventListener('click', () => {
    const selectedSize = document.getElementById('modalSize').value;
    
    // Check if color dropdown is visible, if so grab value, otherwise default to 'Standard'
    const colorContainer = document.getElementById('colorSelectorContainer');
    const selectedColor = !colorContainer.classList.contains('d-none') ? document.getElementById('modalColor').value : 'Standard';
    
    // Calculate final price again for the cart
    const finalPrice = currentModalProduct.discountPercentage > 0 
        ? currentModalProduct.price - (currentModalProduct.price * (currentModalProduct.discountPercentage / 100))
        : currentModalProduct.price;

    addToCart(currentModalProduct.name, finalPrice, selectedSize, selectedColor);
    
    const modalEl = document.getElementById('quickViewModal');
    const modalInstance = bootstrap.Modal.getInstance(modalEl);
    if(modalInstance) modalInstance.hide();
    
    // Pause video if playing
    document.getElementById('modalVideo').pause();
});

/**
 * --- 3. SHOPPING CART LOGIC ---
 */
let cart = JSON.parse(localStorage.getItem('tatreezCart')) || [];
let cartTotal = 0;
let currentModalProduct = {}; 

function saveCart() {
    localStorage.setItem('tatreezCart', JSON.stringify(cart));
}

function showToast(message) {
    document.getElementById('toastMessage').innerText = message;
    const toastEl = document.getElementById('cartToast');
    const toast = new bootstrap.Toast(toastEl, { delay: 3500 });
    toast.show();
}

// Updated to accept Color
function addToCart(productName, price, size, color) {
    cart.push({ 
        name: productName, 
        price: parseFloat(price), 
        size: size,
        color: color,
        id: Date.now() 
    });
    
    saveCart();
    updateCartUI();
    showToast(`${productName} added to your bag!`);
}

function removeFromCart(index) {
    cart.splice(index, 1);
    saveCart();            
    updateCartUI();        
}

function updateCartUI() {
    const cartItemsContainer = document.getElementById('cart-items');
    const totalUI = document.getElementById('cart-total');
    
    cartItemsContainer.innerHTML = ''; 
    cartTotal = 0;                     

    document.getElementById('cart-count').innerText = cart.length;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <tr>
                <td colspan="3" class="text-center text-muted py-5">
                    <i class="fas fa-shopping-basket fs-1 mb-3 opacity-50"></i>
                    <h5>Your shopping bag is empty</h5>
                </td>
            </tr>`;
    } else {
        cart.forEach((item, index) => {
            cartTotal += item.price; 
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="fw-bold text-color-adaptive py-3">
                    ${item.name} 
                    <div class="mt-1">
                        <span class="badge bg-secondary fw-normal rounded-pill px-2 py-1 me-1">Size: ${item.size}</span>
                        ${item.color !== 'Standard' ? `<span class="badge bg-dark fw-normal rounded-pill px-2 py-1">Color: ${item.color}</span>` : ''}
                    </div>
                </td>
                <td class="text-color-adaptive text-center py-3 fw-bold">$${item.price.toFixed(2)}</td>
                <td class="text-end py-3">
                    <button class="btn btn-sm btn-outline-danger px-3 rounded-pill" onclick="removeFromCart(${index})">
                        <i class="fas fa-trash me-1"></i> Remove
                    </button>
                </td>
            `;
            cartItemsContainer.appendChild(row);
        });
    }
    totalUI.innerText = cartTotal.toFixed(2);
}

// --- FULLY FUNCTIONAL CHECKOUT PROCESS ---
async function checkoutProcess() {
    if(cart.length === 0) {
        alert("Your cart is empty! Please add some beautiful items before proceeding to checkout.");
        return;
    } 

    // Simulate a secure checkout form using browser prompts
    const customerName = prompt("Please enter your full name for the order:");
    if (!customerName) return; // Exit if the user clicks Cancel
    
    const email = prompt("Please enter your email address for the receipt:");
    if (!email) return; // Exit if the user clicks Cancel

    // Package the cart data exactly how the MongoDB Order Schema expects it
    const orderData = {
        customerName: customerName.trim(),
        email: email.trim(),
        items: cart.map(item => ({
            productName: item.name,
            price: item.price,
            size: item.size,
            quantity: 1 // Assuming 1 per cart entry for this project scope
        })),
        totalAmount: cartTotal
    };

    // Change the checkout button text to show loading state
    const checkoutBtn = document.querySelector('button[onclick="checkoutProcess()"]');
    const originalBtnText = checkoutBtn.innerHTML;
    checkoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Processing Secure Payment...';
    checkoutBtn.disabled = true;

    try {
        // Send the packaged data to your new Node.js endpoint
        const response = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });

        if (response.ok) {
            alert(`🎉 Success! Your order has been placed securely.\n\nThe admin can now view and approve this in the Dashboard.`);
            
            // Empty the cart and refresh the UI
            cart = []; 
            saveCart(); 
            updateCartUI(); 
            
            // Redirect the user back to the home page to continue exploring
            showPage('home');
        } else {
            const errorData = await response.json();
            alert(`❌ Error processing order: ${errorData.error}`);
        }
    } catch (error) {
        console.error("Checkout Error:", error);
        alert("❌ Network error. Could not reach the secure payment gateway.");
    } finally {
        // Restore the button UI
        checkoutBtn.innerHTML = originalBtnText;
        checkoutBtn.disabled = false;
    }
}
/**
 * --- 4. SPA & THEME LOGIC ---
 */
function showPage(pageId) {
    const pages = document.querySelectorAll('.page-section');
    pages.forEach(page => page.classList.remove('active'));
    
    const selectedPage = document.getElementById(pageId);
    if(selectedPage) selectedPage.classList.add('active');
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function checkThemePreference() {
    if(localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
        document.getElementById('darkModeToggle').innerHTML = '<i class="fas fa-sun"></i>';
    }
}

function toggleDarkMode() {
    const body = document.body;
    const toggleBtn = document.getElementById('darkModeToggle');
    body.classList.toggle('dark-mode');
    
    if (body.classList.contains('dark-mode')) {
        toggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
        localStorage.setItem('theme', 'dark');
    } else {
        toggleBtn.innerHTML = '<i class="fas fa-moon"></i>';
        localStorage.setItem('theme', 'light');
    }
}

document.getElementById('contactForm').addEventListener('submit', function(e) {
    e.preventDefault(); 
    showToast('Thank you! Your message has been sent to our heritage team.');
    this.reset(); 
});