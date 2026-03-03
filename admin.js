/**
 * ======================================================================
 * TATREEZ ELEGANCE - ADMIN DASHBOARD LOGIC
 * ======================================================================
 * Handles physical file uploads via FormData to the Google Cloud backend,
 * Order management, and Carousel syncing.
 * ======================================================================
 */

// --- DASHBOARD NAVIGATION ---
function switchTab(tabName) {
    // Hide all sections
    document.getElementById('section-products').classList.add('d-none');
    document.getElementById('section-orders').classList.add('d-none');
    document.getElementById('section-carousel').classList.add('d-none');
    
    // Remove active styling from all sidebar links
    document.getElementById('tab-products').classList.remove('active');
    document.getElementById('tab-orders').classList.remove('active');
    document.getElementById('tab-carousel').classList.remove('active');
    
    // Show selected section and highlight sidebar link
    document.getElementById(`section-${tabName}`).classList.remove('d-none');
    document.getElementById(`tab-${tabName}`).classList.add('active');

    // Automatically fetch latest data if navigating to orders tab
    if(tabName === 'orders') fetchOrders();
}

// --- 1. ADD NEW PRODUCT (CLOUD UPLOAD LOGIC) ---
document.getElementById('addProductForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Using FormData to package text data AND physical files securely
    const formData = new FormData();
    
    // Append Text Data
    formData.append('name', document.getElementById('p-name').value);
    formData.append('price', document.getElementById('p-price').value);
    formData.append('region', document.getElementById('p-region').value);
    formData.append('discountPercentage', document.getElementById('p-discount').value);
    formData.append('description', document.getElementById('p-desc').value);
    formData.append('sizes', document.getElementById('p-sizes').value);
    formData.append('colors', document.getElementById('p-colors').value);
    
    // Append File Data (Extracting the physical file object from the DOM)
    const imageFile = document.getElementById('p-image').files[0];
    if (imageFile) {
        formData.append('image', imageFile);
    }
    
    const videoFile = document.getElementById('p-video').files[0];
    if (videoFile) {
        formData.append('video', videoFile);
    }

    // UI Loading State
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Syncing to Google Cloud...';
    submitBtn.disabled = true;

    try {
        // Fetch to backend. Note: We DO NOT set 'Content-Type'. 
        // The browser automatically sets it to 'multipart/form-data' with the correct boundary when passing FormData.
        const response = await fetch('http://localhost:5000/api/admin/products', {
            method: 'POST',
            body: formData 
        });
        
        if (response.ok) {
            alert('✅ Success! Product and media securely pushed to Google Cloud and MongoDB.');
            document.getElementById('addProductForm').reset();
        } else {
            const errorData = await response.json();
            alert(`❌ Error: ${errorData.error || 'Failed to upload product.'}`);
        }
    } catch (error) {
        console.error("Critical Upload Error:", error);
        alert('❌ Network error. Could not reach the server.');
    } finally {
        // Restore UI
        submitBtn.innerHTML = originalBtnText;
        submitBtn.disabled = false;
    }
});

// --- 2. ORDER MANAGEMENT ---
async function fetchOrders() {
    const tbody = document.getElementById('ordersTableBody');
    tbody.innerHTML = '<tr><td colspan="4" class="text-center py-5 text-muted"><i class="fas fa-spinner fa-spin me-2"></i> Loading secure order data...</td></tr>';
    
    try {
        const response = await fetch('http://localhost:5000/api/admin/orders');
        const orders = await response.json();
        
        tbody.innerHTML = '';
        
        if(orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center py-5 text-muted">No orders found.</td></tr>';
            return;
        }

        orders.forEach(order => {
            const isApproved = order.adminStatus === 'Approved' || order.adminStatus === 'Shipped';
            tbody.innerHTML += `
                <tr>
                    <td class="px-4 py-3">
                        <span class="fw-bold text-dark">${order.customerName}</span><br>
                        <small class="text-muted"><i class="fas fa-envelope me-1"></i> ${order.email}</small>
                    </td>
                    <td class="py-3 fw-bold text-success fs-5">$${order.totalAmount.toFixed(2)}</td>
                    <td class="py-3">
                        <span class="badge ${isApproved ? 'bg-success' : 'bg-warning text-dark'} px-3 py-2 rounded-pill">
                            ${order.adminStatus}
                        </span>
                    </td>
                    <td class="text-end px-4 py-3">
                        <button class="btn btn-sm ${isApproved ? 'btn-outline-secondary disabled' : 'btn-dark'}" 
                                onclick="approveOrder('${order._id}')" ${isApproved ? 'disabled' : ''}>
                            ${isApproved ? '<i class="fas fa-check-double me-1"></i> Processed' : '<i class="fas fa-truck-fast me-1"></i> Approve for Shipping'}
                        </button>
                    </td>
                </tr>
            `;
        });
    } catch (error) {
        console.error("Error fetching orders:", error);
        tbody.innerHTML = '<tr><td colspan="4" class="text-center py-5 text-danger">Failed to load orders. Check server connection.</td></tr>';
    }
}

async function approveOrder(orderId) {
    if(confirm("Are you sure you want to approve this order for shipping? The customer will be notified.")) {
        try {
            const response = await fetch(`http://localhost:5000/api/admin/orders/${orderId}/approve`, { 
                method: 'PUT' 
            });
            
            if(response.ok) {
                fetchOrders(); // Silently refresh the table to show updated status
            } else {
                alert("Failed to approve order.");
            }
        } catch (error) {
            console.error("Error updating order:", error);
        }
    }
}

// --- 3. CAROUSEL MEDIA SYNC (MULTI-FILE UPLOAD) ---
document.getElementById('carouselForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    const imageFiles = document.getElementById('c-images').files;

    // Validation: Enforce max 3 images limit before trying to send to server
    if (imageFiles.length === 0) {
        return alert("Please select at least one image.");
    }
    if (imageFiles.length > 3) {
        return alert("⚠️ You can only upload a maximum of 3 images for the homepage carousel.");
    }

    // Loop through the selected files and append them to FormData
    // The name 'carouselImages' must match the backend multer expected field name
    for (let i = 0; i < imageFiles.length; i++) {
        formData.append('carouselImages', imageFiles[i]);
    }

    // UI Loading State
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Pushing Media to Cloud...';
    submitBtn.disabled = true;

    try {
        const response = await fetch('http://localhost:5000/api/admin/settings/carousel', {
            method: 'PUT',
            body: formData
        });
        
        if (response.ok) {
            alert('✅ Success! The homepage carousel has been updated globally.');
            document.getElementById('carouselForm').reset();
        } else {
            const errorData = await response.json();
            alert(`❌ Error: ${errorData.error || 'Failed to update carousel.'}`);
        }
    } catch (error) {
        console.error("Error updating carousel:", error);
        alert('❌ Network error. Could not reach the server.');
    } finally {
        // Restore UI
        submitBtn.innerHTML = originalBtnText;
        submitBtn.disabled = false;
    }
});