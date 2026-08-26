// Navigation Bar Generator

function injectNavbar() {
  const navbarElement = document.getElementById('navbar');
  if (!navbarElement) return;

  // Retrieve user authentication info
  const user = getAuthUser();
  
  // Determine relative folder depth dynamically (safe for both HTTP and file:// protocols on Windows)
  const pathLower = window.location.pathname.toLowerCase();
  const isSubFolder = pathLower.includes('/farmer/') || 
                      pathLower.includes('/admin/') || 
                      pathLower.includes('\\farmer\\') || 
                      pathLower.includes('\\admin\\');
  const prefix = isSubFolder ? '../' : '';
  
  let menuHtml = '';

  if (user) {
    if (user.role === 'farmer') {
      menuHtml = `
        <li><a href="${prefix}farmer/dashboard.html" class="nav-link">Dashboard</a></li>
        <li><a href="${prefix}farmer/profile.html" class="nav-link">Profile</a></li>
        <li><a href="${prefix}support.html" class="nav-link">Support</a></li>
        <li><a href="#" id="logout-btn" class="nav-link nav-btn-cta">Logout (${user.name})</a></li>
      `;
    } else {
      // Admin menu
      let dashboardUrl = `${prefix}admin/state-dashboard.html`;
      if (user.role === 'district') dashboardUrl = `${prefix}admin/district-dashboard.html`;
      if (user.role === 'centre') dashboardUrl = `${prefix}admin/centre-dashboard.html`;

      menuHtml = `
        <li><a href="${dashboardUrl}" class="nav-link">Admin Panel</a></li>
        <li><a href="${prefix}support.html" class="nav-link">Support</a></li>
        <li><a href="#" id="logout-btn" class="nav-link nav-btn-cta">Logout (${user.role.toUpperCase()})</a></li>
      `;
    }
  } else {
    // Guest public menu
    menuHtml = `
      <li><a href="${prefix}index.html" class="nav-link" id="nav-home">Home</a></li>
      <li><a href="${prefix}farmer/login.html" class="nav-link" id="nav-login">Farmer Login</a></li>
      <li><a href="${prefix}status.html" class="nav-link" id="nav-status">Track Status</a></li>
      <li><a href="${prefix}admin/login.html" class="nav-link" id="nav-admin">Admin</a></li>
      <li><a href="${prefix}support.html" class="nav-link" id="nav-support">Support</a></li>
    `;
  }

  navbarElement.innerHTML = `
    <header>
      <div class="navbar-container">
        <a href="${prefix}index.html" class="logo-link">
          <div class="logo-icon">🌾</div>
          <span>ProcureHub</span>
        </a>
        <button class="nav-toggle" aria-label="Toggle Navigation" id="nav-toggle-btn">☰</button>
        <nav>
          <ul class="nav-menu" id="nav-menu-list">
            ${menuHtml}
          </ul>
        </nav>
      </div>
    </header>
  `;

  // Set active link class
  const currentPath = window.location.pathname;
  const links = navbarElement.querySelectorAll('.nav-link');
  links.forEach(link => {
    const href = link.getAttribute('href');
    if (href && currentPath.endsWith(href)) {
      link.classList.add('active');
    }
  });

  // Mobile menu toggle logic
  const toggleBtn = document.getElementById('nav-toggle-btn');
  const menuList = document.getElementById('nav-menu-list');
  if (toggleBtn && menuList) {
    toggleBtn.addEventListener('click', () => {
      if (menuList.style.display === 'flex') {
        menuList.style.display = 'none';
        toggleBtn.textContent = '☰';
      } else {
        menuList.style.display = 'flex';
        menuList.style.flexDirection = 'column';
        menuList.style.position = 'absolute';
        menuList.style.top = '100%';
        menuList.style.left = '0';
        menuList.style.width = '100%';
        menuList.style.backgroundColor = 'white';
        menuList.style.boxShadow = '0 10px 15px rgba(0, 0, 0, 0.1)';
        menuList.style.padding = '1rem';
        menuList.style.gap = '1rem';
        menuList.style.zIndex = '999';
        toggleBtn.textContent = '✕';
      }
    });
  }

  // Logout handler
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      showToast('Logged out successfully!', 'success');
      setTimeout(() => {
        window.location.href = '/index.html';
      }, 800);
    });
  }
}

// Inject navbar on DOM load
document.addEventListener('DOMContentLoaded', () => {
  injectNavbar();
});
