// Global utilities and shared functions

/**
 * Custom API request helper
 * Handles request configurations, JSON stringify, and errors.
 */
async function fetchAPI(url, options = {}) {
  // Set default headers
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Attach token from localStorage if present
  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || data.error || 'Something went wrong');
    }

    return data;
  } catch (error) {
    console.error(`API Error on ${url}:`, error.message);
    showToast(error.message, 'error');
    throw error;
  }
}

/**
 * Toast Notification System
 * Dynamically creates/displays Toast banners at the bottom right.
 */
function showToast(message, type = 'info') {
  // Remove existing toast if present
  const existingToast = document.querySelector('.alert-toast');
  if (existingToast) {
    existingToast.remove();
  }

  // Create toast elements
  const toast = document.createElement('div');
  toast.className = `alert-toast ${type}`;
  
  // Icon selector
  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  if (type === 'error') icon = '❌';
  if (type === 'warning') icon = '⚠️';

  toast.innerHTML = `
    <span>${icon}</span>
    <span>${message}</span>
  `;

  document.body.appendChild(toast);

  // Trigger animation
  setTimeout(() => {
    toast.classList.add('show');
  }, 100);

  // Auto remove after 4 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.remove();
    }, 400);
  }, 4000);
}

/**
 * Inject Footer Dynamically
 */
function injectFooter() {
  const footerElement = document.getElementById('footer');
  if (!footerElement) return;

  const currentYear = new Date().getFullYear();

  // Determine relative folder depth dynamically (safe for both HTTP and file:// protocols on Windows)
  const pathLower = window.location.pathname.toLowerCase();
  const isSubFolder = pathLower.includes('/farmer/') || 
                      pathLower.includes('/admin/') || 
                      pathLower.includes('\\farmer\\') || 
                      pathLower.includes('\\admin\\');
  const prefix = isSubFolder ? '../' : '';

  footerElement.innerHTML = `
    <footer>
      <div class="footer-content">
        <div>
          <div class="footer-logo">🌾 Farmer Procurement Hub</div>
          <p class="footer-text">
            Streamlining crop procurement process, reducing waiting times, and facilitating fast, transparent payments for farmers.
          </p>
        </div>
        <div>
          <div class="footer-header">Quick Links</div>
          <ul class="footer-links">
            <li><a href="${prefix}index.html">Home</a></li>
            <li><a href="${prefix}status.html">Track Status</a></li>
            <li><a href="${prefix}support.html">Help & Support</a></li>
          </ul>
        </div>
        <div>
          <div class="footer-header">Contact Support</div>
          <ul class="footer-links">
            <li><a href="mailto:support@procure.gov.in">support@procure.gov.in</a></li>
            <li><a href="tel:1800111400">Toll-free: 1800-111-400</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <p>Ministry of Consumer Affairs, Food & Public Distribution</p>
        <p class="footer-demo-badge">Academic / Demo Project — Presentation Version (${currentYear})</p>
      </div>
    </footer>
  `;
}

// Check auth state helper
function getAuthUser() {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch (e) {
    return null;
  }
}

// Run footer injection when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  injectFooter();
});
