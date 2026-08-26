/**
 * Admin Panel Client-Side Script
 * Handles state, district, and centre admin dashboards
 */

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Get authenticated user from localStorage
 */
function getAuthUser() {
  try {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (userStr && token) {
      return { ...JSON.parse(userStr), token };
    }
    return null;
  } catch (e) {
    return null;
  }
}

/**
 * Check authentication and redirect if not logged in
 */
function requireAuth(allowedRoles = ['state', 'district', 'centre']) {
  const user = getAuthUser();
  if (!user) {
    showToast('Please login to access this page', 'error');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1000);
    return null;
  }
  if (!allowedRoles.includes(user.role)) {
    showToast('You do not have permission to access this page', 'error');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1000);
    return null;
  }
  return user;
}

/**
 * API helper with authentication
 */
async function apiCall(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  };

  const mergedOptions = { ...defaultOptions, ...options };
  if (options.headers) {
    mergedOptions.headers = { ...defaultOptions.headers, ...options.headers };
  }

  try {
    const response = await fetch(`/api${endpoint}`, mergedOptions);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'API request failed');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

/**
 * Show toast notification
 */
function showToast(message, type = 'success') {
  // Remove existing toast
  const existingToast = document.querySelector('.alert-toast');
  if (existingToast) existingToast.remove();

  const toast = document.createElement('div');
  toast.className = `alert-toast ${type}`;
  toast.innerHTML = `
    <span>${type === 'success' ? '✓' : type === 'error' ? '✕' : '⚠'}</span>
    <span>${message}</span>
  `;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add('show'), 100);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

/**
 * Format currency (INR)
 */
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Format date
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

// ========================================
// STATE ADMIN FUNCTIONS
// ========================================

/**
 * Load state admin dashboard data
 */
async function loadStateDashboard() {
  const user = requireAuth(['state']);
  if (!user) return;

  try {
    const data = await apiCall('/admin/reports/state');

    // Update stats cards
    document.getElementById('total-storage').textContent = `${data.totalStorage.toLocaleString()} Qtl`;
    document.getElementById('total-procured').textContent = `${data.totalProcured.toLocaleString()} Qtl`;
    document.getElementById('total-released').textContent = formatCurrency(data.totalReleased);
    document.getElementById('total-pending').textContent = formatCurrency(data.totalPending);

    // Render district table
    renderDistrictTable(data.districts);

    // Update header
    document.getElementById('admin-state-name').textContent = data.state;
    document.getElementById('admin-centres-count').textContent = data.centresCount;

  } catch (error) {
    showToast('Failed to load dashboard data: ' + error.message, 'error');
  }
}

/**
 * Render district-wise table
 */
function renderDistrictTable(districts) {
  const tbody = document.getElementById('district-table-body');
  if (!tbody) return;

  tbody.innerHTML = districts.map(d => `
    <tr>
      <td>${d.name}</td>
      <td>${d.centresCount}</td>
      <td>${d.storageCapacity.toLocaleString()} Qtl</td>
      <td>${d.procured.toLocaleString()} Qtl</td>
      <td>${formatCurrency(d.released)}</td>
      <td>${formatCurrency(d.pending)}</td>
    </tr>
  `).join('');
}

/**
 * Export state report as CSV
 */
function exportStateReport() {
  apiCall('/admin/reports/state').then(data => {
    let csv = 'District,Centres,Storage Capacity (Qtl),Total Procured (Qtl),Payment Released,Payment Pending\n';
    data.districts.forEach(d => {
      csv += `${d.name},${d.centresCount},${d.storageCapacity},${d.procured},${d.released},${d.pending}\n`;
    });
    csv += `\nTotal,,,${data.totalProcured},${data.totalReleased},${data.totalPending}\n`;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `state_report_${data.state.replace(/ /g, '_')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    showToast('Report downloaded successfully', 'success');
  }).catch(err => {
    showToast('Failed to export report: ' + err.message, 'error');
  });
}

// ========================================
// DISTRICT ADMIN FUNCTIONS
// ========================================

/**
 * Load district admin dashboard data
 */
async function loadDistrictDashboard() {
  const user = requireAuth(['district']);
  if (!user) return;

  try {
    // Load district report
    const reportData = await apiCall('/admin/reports/district');

    // Update stats
    document.getElementById('district-procured').textContent = `${reportData.totalProcured.toLocaleString()} Qtl`;
    document.getElementById('district-released').textContent = formatCurrency(reportData.totalReleased);
    document.getElementById('district-pending').textContent = formatCurrency(reportData.totalPending);
    document.getElementById('district-name').textContent = reportData.district;

    // Render centres table
    renderCentresTable(reportData.centres);

    // Load pending payments
    const payments = await apiCall('/admin/payments/pending');
    renderPendingPayments(payments);

  } catch (error) {
    showToast('Failed to load dashboard data: ' + error.message, 'error');
  }
}

/**
 * Render centres table for district admin
 */
function renderCentresTable(centres) {
  const tbody = document.getElementById('centres-table-body');
  if (!tbody) return;

  tbody.innerHTML = centres.map(c => `
    <tr>
      <td>${c.name}</td>
      <td>${c.storageCapacity.toLocaleString()} Qtl</td>
      <td>${c.operatingHours}</td>
      <td>${c.slotsPerHour}</td>
      <td>${c.procured.toLocaleString()} Qtl</td>
      <td>${formatCurrency(c.released)}</td>
      <td>
        <button class="btn btn-outline" onclick="editCentre('${c.id}')" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;">Edit</button>
      </td>
    </tr>
  `).join('');
}

/**
 * Render pending payments for district admin
 */
function renderPendingPayments(payments) {
  const tbody = document.getElementById('payments-table-body');
  if (!tbody) return;

  if (payments.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No pending payments</td></tr>';
    return;
  }

  tbody.innerHTML = payments.map(p => `
    <tr>
      <td>${p.farmer?.firstName || 'N/A'} ${p.farmer?.lastName || ''}</td>
      <td>${p.farmer?.mobile || 'N/A'}</td>
      <td>${p.procurement?.booking?.tokenNumber || 'N/A'}</td>
      <td>${formatCurrency(p.amount)}</td>
      <td>${formatDate(p.createdAt)}</td>
      <td>
        <button class="btn btn-primary" onclick="releasePayment('${p._id}')" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;">Approve & Release</button>
      </td>
    </tr>
  `).join('');
}

/**
 * Edit centre details
 */
async function editCentre(centreId) {
  const modal = document.getElementById('edit-centre-modal');
  if (!modal) return;

  try {
    const centres = await apiCall(`/centres/${getAuthUser().district}`);
    const centre = centres.find(c => c._id === centreId);

    if (!centre) {
      showToast('Centre not found', 'error');
      return;
    }

    // Populate form
    document.getElementById('edit-centre-id').value = centre._id;
    document.getElementById('edit-centre-name').value = centre.name;
    document.getElementById('edit-centre-capacity').value = centre.storageCapacity;
    document.getElementById('edit-centre-hours').value = centre.operatingHours;
    document.getElementById('edit-centre-slots').value = centre.slotsPerHour;

    modal.style.display = 'flex';
  } catch (error) {
    showToast('Failed to load centre details', 'error');
  }
}

/**
 * Save centre edits
 */
async function saveCentreEdits() {
  const centreId = document.getElementById('edit-centre-id').value;
  const name = document.getElementById('edit-centre-name').value;
  const storageCapacity = document.getElementById('edit-centre-capacity').value;
  const operatingHours = document.getElementById('edit-centre-hours').value;
  const slotsPerHour = document.getElementById('edit-centre-slots').value;

  try {
    await apiCall(`/admin/centres/${centreId}`, {
      method: 'PATCH',
      body: JSON.stringify({ name, storageCapacity, operatingHours, slotsPerHour })
    });

    showToast('Centre updated successfully', 'success');
    document.getElementById('edit-centre-modal').style.display = 'none';
    loadDistrictDashboard(); // Reload data
  } catch (error) {
    showToast('Failed to update centre: ' + error.message, 'error');
  }
}

/**
 * Release payment
 */
async function releasePayment(paymentId) {
  if (!confirm('Are you sure you want to release this payment?')) return;

  try {
    await apiCall(`/admin/payments/${paymentId}/release`, { method: 'POST' });
    showToast('Payment released successfully', 'success');
    loadDistrictDashboard(); // Reload data
  } catch (error) {
    showToast('Failed to release payment: ' + error.message, 'error');
  }
}

// ========================================
// CENTRE OPERATOR FUNCTIONS
// ========================================

/**
 * Load centre operator dashboard
 */
async function loadCentreDashboard() {
  const user = requireAuth(['centre']);
  if (!user) return;

  try {
    const data = await apiCall('/centre/queue');

    // Update centre info
    document.getElementById('centre-name').textContent = data.centre.name;
    document.getElementById('centre-id').textContent = data.centre.centreId;
    document.getElementById('centre-date').textContent = formatDate(data.date);

    // Calculate storage usage
    const totalProcured = data.queue.reduce((sum, b) => sum + (b.status === 'Completed' ? b.quantity : 0), 0);
    document.getElementById('centre-storage').textContent = `${totalProcured} / ${data.centre.storageCapacity.toLocaleString()} Qtl`;

    // Render queue table
    renderQueueTable(data.queue);

  } catch (error) {
    showToast('Failed to load queue data: ' + error.message, 'error');
  }
}

/**
 * Render queue table for centre operator
 */
function renderQueueTable(queue) {
  const tbody = document.getElementById('queue-table-body');
  if (!tbody) return;

  if (queue.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: var(--text-muted);">No bookings for today</td></tr>';
    return;
  }

  tbody.innerHTML = queue.map(b => `
    <tr>
      <td><strong>${b.tokenNumber}</strong></td>
      <td>${b.farmerName}</td>
      <td>${b.farmerMobile}</td>
      <td>${b.cropType.toUpperCase()}</td>
      <td>${b.quantity} Qtl</td>
      <td>${b.timeWindow}</td>
      <td>
        <span class="status-badge status-${b.status.toLowerCase()}">${b.status}</span>
      </td>
      <td>
        ${getActionButtons(b)}
      </td>
    </tr>
  `).join('');
}

/**
 * Get action buttons based on booking status
 */
function getActionButtons(booking) {
  const { _id, status, tokenNumber } = booking;

  if (status === 'Booked') {
    return `
      <button class="btn btn-primary" onclick="updateBookingStatus('${_id}', 'Arrived')" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;">Check-In</button>
      <button class="btn btn-outline" onclick="updateBookingStatus('${_id}', 'Absent')" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; margin-left: 0.25rem;">Absent</button>
    `;
  } else if (status === 'Arrived') {
    return `
      <button class="btn btn-primary" onclick="updateBookingStatus('${_id}', 'Processing')" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;">Start Processing</button>
      <button class="btn btn-outline" onclick="updateBookingStatus('${_id}', 'Absent')" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; margin-left: 0.25rem;">Absent</button>
    `;
  } else if (status === 'Processing') {
    return `
      <button class="btn btn-accent" onclick="openWeighingModal('${_id}', '${tokenNumber}', ${booking.quantity})" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;">Weigh & Procure</button>
    `;
  }
  return '<span style="color: var(--text-muted);">Closed</span>';
}

/**
 * Update booking status
 */
async function updateBookingStatus(bookingId, newStatus) {
  try {
    await apiCall(`/centre/bookings/${bookingId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus })
    });

    showToast(`Status updated to ${newStatus}`, 'success');
    loadCentreDashboard(); // Reload
  } catch (error) {
    showToast('Failed to update status: ' + error.message, 'error');
  }
}

/**
 * Open weighing modal
 */
function openWeighingModal(bookingId, tokenNumber, expectedQty) {
  const modal = document.getElementById('weighing-modal');
  if (!modal) return;

  document.getElementById('weigh-booking-id').value = bookingId;
  document.getElementById('weigh-token').textContent = tokenNumber;
  document.getElementById('weigh-expected').value = expectedQty;
  document.getElementById('weigh-actual').value = '';
  document.getElementById('weigh-accepted').value = '';
  document.getElementById('weigh-rejected').value = '0';
  document.getElementById('weigh-reason').value = '';
  document.getElementById('weigh-reason-group').style.display = 'none';

  modal.style.display = 'flex';
}

/**
 * Calculate accepted/rejected quantities
 */
function calculateWeights() {
  const actual = parseFloat(document.getElementById('weigh-actual').value) || 0;
  const accepted = parseFloat(document.getElementById('weigh-accepted').value) || 0;
  const rejected = Math.max(0, actual - accepted);

  document.getElementById('weigh-rejected').value = rejected.toFixed(1);

  // Show reason field if there's rejection
  const reasonGroup = document.getElementById('weigh-reason-group');
  reasonGroup.style.display = rejected > 0 ? 'block' : 'none';
}

/**
 * Submit procurement record
 */
async function submitProcurement() {
  const bookingId = document.getElementById('weigh-booking-id').value;
  const expectedQty = parseFloat(document.getElementById('weigh-expected').value);
  const actualWeight = parseFloat(document.getElementById('weigh-actual').value);
  const acceptedQty = parseFloat(document.getElementById('weigh-accepted').value);
  const rejectedQty = parseFloat(document.getElementById('weigh-rejected').value) || 0;
  const rejectionReason = document.getElementById('weigh-reason').value;

  if (!actualWeight || !acceptedQty) {
    showToast('Please fill in all required quantities', 'error');
    return;
  }

  if (rejectedQty > 0 && !rejectionReason) {
    showToast('Please provide a reason for rejected quantity', 'error');
    return;
  }

  try {
    await apiCall('/procurements', {
      method: 'POST',
      body: JSON.stringify({
        bookingId,
        expectedQuantity: expectedQty,
        actualWeight,
        acceptedQuantity: acceptedQty,
        rejectedQuantity: rejectedQty,
        rejectionReason
      })
    });

    showToast('Procurement recorded successfully', 'success');
    document.getElementById('weighing-modal').style.display = 'none';
    loadCentreDashboard(); // Reload
  } catch (error) {
    showToast('Failed to record procurement: ' + error.message, 'error');
  }
}

// ========================================
// INITIALIZATION
// ========================================

// Initialize dashboard based on current page
document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;

  if (path.includes('state-dashboard')) {
    loadStateDashboard();
  } else if (path.includes('district-dashboard')) {
    loadDistrictDashboard();
  } else if (path.includes('centre-dashboard')) {
    loadCentreDashboard();
  }
});

console.log('Admin JS utilities loaded.');
