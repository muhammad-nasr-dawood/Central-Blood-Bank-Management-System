// Sidebar role-based dynamic rendering and auth logic
function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
}

const SIDEBAR_ITEMS = {
  admin: [
    { href: 'admin-add-hospital.html', icon: 'bi-hospital', label: 'Add Hospital' },
    { href: 'admin-add-donation.html', icon: 'bi-plus-circle', label: 'Add Donation' },
    { href: 'admin-donations.html', icon: 'bi-list-check', label: 'View Donations' },
    { href: 'admin-blood-stock.html', icon: 'bi-droplet', label: 'View Blood Stock' },
    { href: 'admin-requests.html', icon: 'bi-clipboard-data', label: 'View Requests' },
    { href: 'admin-add-branch.html', icon: 'bi-geo-alt', label: 'Add Branch' },
    { href: 'admin-view-branches.html', icon: 'bi-geo', label: 'View Branches' },
    { href: 'admin-view-hospitals.html', icon: 'bi-building', label: 'View Hospitals' }
  ],
  donor: [
    { href: 'donor-donate.html', icon: 'bi-droplet', label: 'Donate' },
    { href: 'donor-my-donations.html', icon: 'bi-list-check', label: 'My Donations' }
  ],
  hospital: [
    { href: 'hospital-request.html', icon: 'bi-droplet', label: 'Request Blood' },
    { href: 'hospital-my-requests.html', icon: 'bi-list-check', label: 'My Requests' }
  ]
};

function renderSidebarForRole() {
  const token = localStorage.getItem('token');
  let role = null;
  let payload = null;
  if (token) {
    payload = parseJwt(token);
    if (payload && payload.role) role = payload.role;
  }
  // Debug logs
  console.log('[Sidebar Auth] Token payload:', payload);
  console.log('[Sidebar Auth] Detected role:', role);
  const nav = document.getElementById('sidebar-nav');
  if (!nav) return;
  nav.innerHTML = '';
  // Always inject a visible debug message
  const debugLi = document.createElement('li');
  debugLi.className = 'nav-item text-info';
  debugLi.style.padding = '1rem';
  debugLi.style.fontWeight = 'bold';
  debugLi.innerText = `SIDEBAR JS RAN | Role: ${role}`;
  nav.appendChild(debugLi);
  if (role && SIDEBAR_ITEMS[role]) {
    SIDEBAR_ITEMS[role].forEach(item => {
      const li = document.createElement('li');
      li.className = 'nav-item';
      li.innerHTML = `<a class="nav-link" href="${item.href}"><i class="bi ${item.icon}"></i> <span>${item.label}</span></a>`;
      nav.appendChild(li);
    });
  } else {
    // Show the detected role or error in the sidebar for debugging
    const li = document.createElement('li');
    li.className = 'nav-item text-danger';
    li.style.padding = '1rem';
    li.style.fontWeight = 'bold';
    li.innerText = `No valid role detected. Role: ${role}`;
    nav.appendChild(li);
  }
}

function highlightActiveSidebarLink() {
  const path = window.location.pathname.split('/').pop();
  document.querySelectorAll('.sidebar .nav-link').forEach(link => {
    if (link.getAttribute('href') === path) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

function updateNavbarAuth() {
  const token = localStorage.getItem('token');
  let role = null;
  if (token) {
    const payload = parseJwt(token);
    if (payload && payload.role) role = payload.role;
  }
  const navAuthBtn = document.getElementById('nav-auth-btn');
  if (!navAuthBtn) return;
  if (token && role) {
    navAuthBtn.innerHTML = `<span class="me-2 badge bg-secondary">${role ? role.charAt(0).toUpperCase() + role.slice(1) : ''}</span><a class="nav-link d-inline" href="#" id="logoutBtn"><i class="bi bi-box-arrow-right"></i> Logout</a>`;
  } else {
    navAuthBtn.innerHTML = '<a class="nav-link" href="donor-register.html"><i class="bi bi-person-plus"></i> Register</a>';
  }
}

document.addEventListener('DOMContentLoaded', function() {
  renderSidebarForRole();
  highlightActiveSidebarLink();
  updateNavbarAuth();
  // Logout logic
  document.addEventListener('click', function(e) {
    if (e.target && e.target.id === 'logoutBtn') {
      e.preventDefault();
      localStorage.removeItem('token');
      window.location.href = 'login.html';
    }
  });
}); 