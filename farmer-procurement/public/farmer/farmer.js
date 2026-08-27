// Farmer Client-Side Script

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Session verification check
  const user = getAuthUser();
  if (!user || user.role !== 'farmer') {
    // If not authenticated, redirect to login page
    window.location.href = 'login.html';
    return;
  }

  // 2. Personalize Dashboard greeting
  const welcomeTitle = document.getElementById('welcome-title');
  if (welcomeTitle) {
    welcomeTitle.textContent = `Namaste, ${user.name}!`;
  }

  // 3. Load bookings and lands from API
  await loadBookings();
  await loadLands();

  // 4. Attach Add Land Form submit listener
  const addLandForm = document.getElementById('add-land-form');
  if (addLandForm) {
    addLandForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const khasraNumber = document.getElementById('land-khasra').value;
      const area = document.getElementById('land-area').value;
      const cropType = document.getElementById('land-crop').value;
      const allowedQuantity = document.getElementById('land-quota').value;

      try {
        await fetchAPI('/api/lands', {
          method: 'POST',
          body: { khasraNumber, area, cropType, allowedQuantity }
        });
        showToast('Land record registered successfully!', 'success');
        addLandForm.reset();
        await loadLands();
      } catch (err) {
        // Handled in fetchAPI
      }
    });
  }
});

// Fetch and display farmer's lands
async function loadLands() {
  try {
    const lands = await fetchAPI('/api/lands');
    const tbody = document.getElementById('land-rows');
    if (!tbody) return;

    if (lands.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 1.5rem; color: var(--text-muted);">No land records registered. Manually add a land record on the right.</td></tr>`;
      return;
    }

    tbody.innerHTML = lands.map(l => `
      <tr style="border-bottom: 1px solid var(--border-color);">
        <td style="padding: 0.75rem 0.5rem; font-weight: 600;">Khasra ${l.khasraNumber}</td>
        <td style="padding: 0.75rem 0.5rem;">${l.area} Ha</td>
        <td style="padding: 0.75rem 0.5rem;">${l.cropType.toUpperCase()}</td>
        <td style="padding: 0.75rem 0.5rem; font-weight: 600;">${l.allowedQuantity} Qtl</td>
        <td style="padding: 0.75rem 0.5rem; color: var(--success-color); font-weight: 600;">${l.bookedQuantity} Qtl</td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Failed to load lands:', err);
  }
}

// Fetch and display farmer's bookings
async function loadBookings() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/bookings/my', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch bookings');
    }

    const bookings = await response.json();
    renderBookings(bookings);

  } catch (error) {
    console.error('Error loading bookings:', error);
    showToast('Failed to load bookings. Please refresh the page.', 'error');
  }
}

// Render bookings to dashboard UI
function renderBookings(bookings) {
  const activePanel = document.getElementById('active-booking-panel');
  const prevRows = document.getElementById('previous-bookings-rows');

  // Filter active bookings (Booked, Arrived, Processing status)
  const activeBookings = bookings.filter(b =>
    b.status === 'Booked' || b.status === 'Arrived' || b.status === 'Processing'
  );

  // Filter completed bookings
  const completedBookings = bookings.filter(b =>
    b.status === 'Completed' || b.status === 'Absent'
  );

  // Render Active Booking
  if (activePanel) {
    if (activeBookings.length > 0) {
      const active = activeBookings[0]; // Show most recent active booking
      activePanel.innerHTML = `
        <h3 style="color: var(--primary-dark); margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
          🎫 Active Slot Booking
        </h3>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-top: 1rem;">
          <div>
            <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 600; display: block;">Token Number</span>
            <strong style="font-size: 1.25rem; color: var(--primary-dark);">${active.tokenNumber}</strong>
          </div>
          <div>
            <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 600; display: block;">Procurement Centre</span>
            <span style="font-size: 1rem; font-weight: 700;">${active.centre ? active.centre.name : 'N/A'}</span>
          </div>
          <div>
            <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 600; display: block;">Scheduled Date & Time</span>
            <span style="font-size: 1rem; font-weight: 700;">${active.date} (${active.timeWindow})</span>
          </div>
          <div>
            <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 600; display: block;">Queue Position</span>
            <strong style="font-size: 1.25rem; color: var(--success-color);">#${active.queuePosition} (approx. ${active.capacityUnits * 5} min wait)</strong>
          </div>
        </div>

        <div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid var(--border-color); display: flex; gap: 2rem; flex-wrap: wrap;">
          <div>
            <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 600;">Crop Type:</span>
            <span style="font-weight: 700; margin-left: 0.25rem;">${active.produceType.toUpperCase()}</span>
          </div>
          <div>
            <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 600;">Booked Quantity:</span>
            <span style="font-weight: 700; margin-left: 0.25rem;">${active.quantity} Quintals</span>
          </div>
          <div>
            <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 600;">Capacity Load:</span>
            <span style="font-weight: 700; margin-left: 0.25rem;">${active.capacityUnits} Capacity Unit${active.capacityUnits > 1 ? 's' : ''}</span>
          </div>
          <div>
            <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 600;">Status:</span>
            <span style="font-weight: 700; margin-left: 0.25rem; color: var(--primary-color);">${active.status}</span>
          </div>
        </div>
        ${active.status === 'Booked' ? `
        <div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid var(--border-color); display: flex; gap: 1rem; flex-wrap: wrap; align-items: center;">
          <button type="button" class="btn btn-outline" id="cancel-booking-btn" data-id="${active._id}" style="color: var(--danger-color); border-color: var(--danger-color);">❌ Cancel This Booking</button>
          <span style="font-size: 0.85rem; color: var(--text-muted);">You can cancel while the status is still "Booked".</span>
        </div>
        ` : ''}
      `;

      // Wire up the cancel button (only present when status is 'Booked')
      const cancelBtn = document.getElementById('cancel-booking-btn');
      if (cancelBtn) {
        cancelBtn.addEventListener('click', () => cancelBooking(active._id, active.tokenNumber));
      }
    } else {
      // No active booking - show empty state
      activePanel.innerHTML = `
        <h3 style="color: var(--primary-dark); margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
          🎫 Active Slot Booking
        </h3>
        <p style="color: var(--text-muted); font-size: 0.95rem; margin-top: 1rem;">
          No active slot booking found. Register your land crop details and book an available delivery slot.
        </p>
        <div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid var(--border-color);">
          <a href="booking.html" class="btn btn-primary">📅 Book New Slot Now</a>
        </div>
      `;
    }
  }

  // Render Previous Bookings
  if (prevRows) {
    if (completedBookings.length > 0) {
      prevRows.innerHTML = completedBookings.map(booking => {
        const statusColor = booking.status === 'Completed' ? 'var(--success-color)' : 'var(--danger-color)';
        const statusIcon = booking.status === 'Completed' ? '✅' : '❌';
        
        const acceptedQty = booking.procurement ? `${booking.procurement.acceptedQuantity} Qtl` : '-';
        const payout = booking.payment ? `₹${booking.payment.amount.toLocaleString('en-IN')}` : '-';
        
        let paymentStatusHtml = '-';
        if (booking.payment) {
          const payStatus = booking.payment.status;
          const payColor = payStatus === 'Released' ? 'var(--success-color)' : 'var(--warning-color)';
          const payBg = payStatus === 'Released' ? 'rgba(42, 157, 143, 0.15)' : 'rgba(244, 162, 97, 0.15)';
          paymentStatusHtml = `<span style="padding: 0.25rem 0.5rem; border-radius: 50px; font-size: 0.8rem; font-weight: 600; color: ${payColor}; background-color: ${payBg};">${payStatus}</span>`;
        }

        return `
          <tr style="border-bottom: 1px solid var(--border-color);">
            <td style="padding: 1rem 0.5rem; font-weight: 700;">${booking.tokenNumber}</td>
            <td style="padding: 1rem 0.5rem;">${booking.centre ? booking.centre.name : 'N/A'}</td>
            <td style="padding: 1rem 0.5rem;">${booking.date}</td>
            <td style="padding: 1rem 0.5rem;">${booking.produceType.toUpperCase()}</td>
            <td style="padding: 1rem 0.5rem;">${booking.quantity} Qtl</td>
            <td style="padding: 1rem 0.5rem; font-weight: 600;">${acceptedQty}</td>
            <td style="padding: 1rem 0.5rem; font-weight: 600; color: var(--primary-color);">${payout}</td>
            <td style="padding: 1rem 0.5rem;">${paymentStatusHtml}</td>
            <td style="padding: 1rem 0.5rem;"><span style="color: ${statusColor}; font-weight: 600;">${statusIcon} ${booking.status}</span></td>
          </tr>
        `;
      }).join('');
    } else {
      prevRows.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">
            No past transactions or procurements found.
          </td>
        </tr>
      `;
    }
  }
}

// Cancel an active booking (status must be 'Booked')
async function cancelBooking(bookingId, tokenNumber) {
  if (!confirm(`Are you sure you want to cancel booking ${tokenNumber || ''}? This cannot be undone.`)) {
    return;
  }
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/bookings/${bookingId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to cancel booking');
    }

    showToast(data.message || 'Booking cancelled successfully', 'success');
    await loadBookings();
  } catch (error) {
    console.error('Cancel booking error:', error);
    showToast(error.message || 'Failed to cancel booking. Please try again.', 'error');
  }
}
