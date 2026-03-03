/**
 * ======================================================================
 * TATREEZ ELEGANCE - ADMIN DASHBOARD LOGIC
 * ======================================================================
 */

// Handle UI tab switching
function switchTab(tabName) {
    // Hide all view sections
    document.querySelectorAll('[id^="section-"]').forEach(el => el.classList.add('d-none'));
    // Remove active styles from sidebar links
    document.querySelectorAll('[id^="tab-"]').forEach(el => el.classList.remove('active'));
    
    // Reveal requested section
    document.getElementById(`section-${tabName}`).classList.remove('d-none');
    document.getElementById(`tab-${tabName}`).classList.add('active');

    // Auto-refresh orders if navigating there
    if(tabName === 'orders') fetchOrders();
}

// --- ADD PRODUCT LOGIC ---
document.getElementById('addProductForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Initialize payload container
    const formData = new FormData();
    
    // Append Text and Boolean Data
    formData.append('name', document.getElementById('p-name').value);
    formData.append('price', document.getElementById('p-price').value);
    formData.append('discountPercentage', document.getElementById('p-discount').value);
    formData.append('description', document.getElementById('p-desc').value);
    formData.append('sizes', document.getElementById('p-sizes').value);
    
    // Capture the switch state (true/false)
    const isStocked = document.getElementById('p-instock').checked;
    formData.append('inStock', isStocked);
    
    // Append Multiple Images via Loop
    const imageFiles = document.getElementById('p-images').files;
    for (let i = 0; i < imageFiles.length; i++) {
        formData.append('images', imageFiles[i]); // Must match the multer exact expected name
    }
    
    // Append Video if selected
    const videoFile = document.getElementById('p-video').files[0];
    if (videoFile) {
        formData.append('video', videoFile);
    }

    // Capture button and set visual loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Transmitting to Cloud Server...';
    submitBtn.disabled = true;

    try {
        // Execute POST Request
        const response = await fetch('http://localhost:5000/api/admin/products', {
            method: 'POST',
            body: formData 
        });
        
        if (response.ok) {
            alert('✅ Success! Product saved to MongoDB and media synced to Google Cloud.');
            document.getElementById('addProductForm').reset();
            // Reset stock toggle specifically to default state
            document.getElementById('p-instock').checked = true;
        } else {
            const errorData = await response.json();
            alert(`❌ Server Rejected Upload: ${errorData.error || 'Unknown Error'}`);
        }
    } catch (error) {
        console.error("Critical Upload Error Details:", error);
        alert('❌ Network Failure. Could not reach backend server on port 5000.');
    } finally {
        // Restore button state regardless of success/fail
        submitBtn.innerHTML = originalBtnText;
        submitBtn.disabled = false;
    }
});

// --- ORDER MANAGEMENT LOGIC ---
async function fetchOrders() {
    const tbody = document.getElementById('ordersTableBody');
    tbody.innerHTML = '<tr><td colspan="4" class="text-center py-5 text-muted fs-4"><i class="fas fa-spinner fa-spin me-3"></i> Loading secure database entries...</td></tr>';
    
    try {
        const response = await fetch('http://localhost:5000/api/admin/orders');
        const orders = await response.json();
        
        tbody.innerHTML = '';
        
        if(orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center py-5 text-muted fs-5">No customer orders have been placed yet.</td></tr>';
            return;
        }

        // Loop over the array and inject HTML rows
        orders.forEach(order => {
            const isApproved = order.adminStatus === 'Approved' || order.adminStatus === 'Shipped';
            
            // Generate a bulleted list of items for quick reading
            let itemSummary = '';
            order.items.forEach(i => {
                itemSummary += `<span class="badge bg-light text-dark border me-1">${i.quantity}x ${i.productName} (${i.size})</span>`;
            });

            tbody.innerHTML += `
                <tr>
                    <td class="px-4 py-4">
                        <span class="fw-bold text-dark fs-5">${order.customerName}</span><br>
                        <small class="text-muted"><i class="fas fa-envelope me-1"></i> ${order.email}</small><br>
                        <small class="text-info fw-bold"><i class="fab fa-whatsapp me-1"></i> ${order.phone}</small><br>
                        <div class="mt-2">${itemSummary}</div>
                    </td>
                    <td class="py-4 text-muted">
                        <i class="fas fa-map-marker-alt me-1 text-danger"></i> ${order.address}<br>
                        <span class="ms-3 fw-bold">${order.postCode}</span>
                    </td>
                    <td class="py-4">
                        <div class="fw-bold text-success fs-4">$${order.totalAmount.toFixed(2)}</div>
                        <span class="badge ${isApproved ? 'bg-success' : 'bg-warning text-dark'} px-2 py-1 rounded-pill mt-1">
                            Status: ${order.adminStatus}
                        </span>
                    </td>
                    <td class="text-end px-4 py-4">
                        <button class="btn btn-lg ${isApproved ? 'btn-outline-secondary disabled' : 'btn-dark shadow-sm'}" 
                                onclick="approveOrder('${order._id}')" ${isApproved ? 'disabled' : ''}>
                            ${isApproved ? '<i class="fas fa-check-double me-2"></i> Shipped' : '<i class="fas fa-box-open me-2"></i> Approve Shipment'}
                        </button>
                    </td>
                </tr>
            `;
        });
    } catch (error) {
        console.error("Error fetching orders from DB:", error);
        tbody.innerHTML = '<tr><td colspan="4" class="text-center py-5 text-danger fw-bold"><i class="fas fa-exclamation-triangle me-2"></i> Critical Database Disconnect.</td></tr>';
    }
}

async function approveOrder(orderId) {
    // Add a confirmation safety check
    if(confirm("Are you absolutely sure you want to approve this order? This action marks the items as ready for courier pickup.")) {
        try {
            const response = await fetch(`http://localhost:5000/api/admin/orders/${orderId}/approve`, { 
                method: 'PUT' 
            });
            
            if(response.ok) {
                // Silently trigger a table rebuild to show the updated status badge
                fetchOrders(); 
            } else {
                alert("Backend failed to process approval request.");
            }
        } catch (error) {
            console.error("Error PUT updating order:", error);
            alert("Network failure during approval.");
        }
    }
}

// --- CAROUSEL MEDIA SYNC ---
document.getElementById('carouselForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    const imageFiles = document.getElementById('c-images').files;

    // Safety checks before initiating heavy upload
    if (imageFiles.length === 0) {
        return alert("Please select at least one visual asset.");
    }
    if (imageFiles.length > 3) {
        return alert("⚠️ Global limitation: Maximum 3 images permitted for homepage slider performance.");
    }

    // Package payload
    for (let i = 0; i < imageFiles.length; i++) {
        formData.append('carouselImages', imageFiles[i]);
    }

    // Set UI loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Pushing Media Assets to Google Cloud...';
    submitBtn.disabled = true;

    try {
        const response = await fetch('http://localhost:5000/api/admin/settings/carousel', {
            method: 'PUT',
            body: formData
        });
        
        if (response.ok) {
            alert('✅ Success! Live website architecture has been updated globally.');
            document.getElementById('carouselForm').reset();
        } else {
            const errorData = await response.json();
            alert(`❌ Media Processing Error: ${errorData.error || 'Server rejected file chunk.'}`);
        }
    } catch (error) {
        console.error("GCS Upload Process Exception:", error);
        alert('❌ Network disconnection. Could not resolve Google Cloud handshakes.');
    } finally {
        submitBtn.innerHTML = originalBtnText;
        submitBtn.disabled = false;
    }
});