// Authentication Module

function fillLogin(email) {
    document.getElementById('loginEmail').value = email;
    document.getElementById('loginPassword').value = 'password123';
}

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            
            try {
                showLoading();
                loginError.style.display = 'none';
                
                const response = await api.login(email, password);
                
                api.setToken(response.token);
                localStorage.setItem('user', JSON.stringify(response.user));
                
                // Hide login page, show app
                document.getElementById('loginPage').style.display = 'none';
                document.getElementById('appContainer').style.display = 'flex';
                
                // Initialize app
                initializeApp(response.user);
                
                const roleLabel = response.user.role.replace('_', ' ').toUpperCase();
                showToast(`${roleLabel} login successful! Welcome ${response.user.name}`);
                
            } catch (error) {
                loginError.textContent = error.message;
                loginError.style.display = 'block';
            } finally {
                hideLoading();
            }
        });
    }
    
    // Check if already logged in
    checkAuth();
});

async function checkAuth() {
    const token = localStorage.getItem('token');
    
    if (token) {
        try {
            showLoading();
            const response = await api.getCurrentUser();
            
            // User is authenticated
            document.getElementById('loginPage').style.display = 'none';
            document.getElementById('appContainer').style.display = 'flex';
            
            initializeApp(response.user);
            
        } catch (error) {
            // Token is invalid, clear and show login
            api.clearToken();
            localStorage.removeItem('user');
            document.getElementById('loginPage').style.display = 'flex';
            document.getElementById('appContainer').style.display = 'none';
        } finally {
            hideLoading();
        }
    } else {
        document.getElementById('loginPage').style.display = 'flex';
        document.getElementById('appContainer').style.display = 'none';
    }
}

function initializeApp(user) {
    // Set user info in sidebar
    document.getElementById('userName').textContent = user.name;
    document.getElementById('userRole').textContent = user.role.replace('_', ' ').toUpperCase();
    
    // Store user globally for role-based access
    window.currentUser = user;
    
    // Hide/Show menu items based on role
    setupRoleBasedUI(user.role);
    
    // Load dashboard by default
    loadPage('dashboard');
}

function setupRoleBasedUI(role) {
    // Get all nav items
    const navItems = document.querySelectorAll('.nav-item');
    
    // Role-based menu visibility
    const rolePermissions = {
        'fleet_manager': ['dashboard', 'vehicles', 'drivers', 'trips', 'maintenance', 'expenses', 'reports'],
        'driver': ['dashboard', 'trips', 'expenses'],
        'safety_officer': ['dashboard', 'drivers', 'trips', 'reports'],
        'financial_analyst': ['dashboard', 'expenses', 'reports']
    };
    
    const allowedPages = rolePermissions[role] || ['dashboard'];
    
    navItems.forEach(item => {
        const page = item.getAttribute('data-page');
        if (!allowedPages.includes(page)) {
            item.style.display = 'none';
        } else {
            item.style.display = 'flex';
        }
    });
}

// Logout functionality
document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            api.clearToken();
            localStorage.removeItem('user');
            
            document.getElementById('appContainer').style.display = 'none';
            document.getElementById('loginPage').style.display = 'flex';
            
            showToast('Signed out successfully');
        });
    }
});
