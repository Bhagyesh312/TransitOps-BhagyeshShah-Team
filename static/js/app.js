// ================================================================
// TransitOps — Premium App JS
// Main Application Module + Utility Functions
// ================================================================

// ================================================================
// PAGE LOADER
// ================================================================
function loadPage(pageName) {
    showLoading();

    // Animate nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-page') === pageName) {
            item.classList.add('active');
        }
    });

    // Update breadcrumb
    const titles = {
        'dashboard': 'Dashboard',
        'vehicles': 'Vehicles',
        'drivers': 'Drivers',
        'trips': 'Trips',
        'maintenance': 'Maintenance',
        'expenses': 'Expenses',
        'reports': 'Reports & Analytics'
    };
    const title = titles[pageName] || 'TransitOps';
    const titleEl = document.getElementById('pageTitle');
    if (titleEl) {
        titleEl.textContent = title;
        titleEl.style.animation = 'none';
        void titleEl.offsetWidth;
        titleEl.style.animation = 'slideRight 0.3s ease';
    }

    // Animate page content out then in
    const content = document.getElementById('pageContent');
    if (content) {
        content.style.opacity = '0';
        content.style.transform = 'translateY(12px)';
        content.style.transition = 'none';
        setTimeout(() => {
            content.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
            content.style.opacity = '1';
            content.style.transform = 'translateY(0)';
        }, 20);
    }

    // Load page content
    switch (pageName) {
        case 'dashboard':   loadDashboard();    break;
        case 'vehicles':    loadVehicles();     break;
        case 'drivers':     loadDrivers();      break;
        case 'trips':       loadTrips();        break;
        case 'maintenance': loadMaintenance();  break;
        case 'expenses':    loadExpenses();     break;
        case 'reports':     loadReports();      break;
        default:            loadDashboard();
    }

    // Close mobile menu
    document.getElementById('sidebar')?.classList.remove('active');

    // Close AI panel if open
    document.getElementById('aiPanel')?.classList.remove('open');

    hideLoading();
}

// ================================================================
// NAVIGATION EVENT LISTENERS
// ================================================================
document.addEventListener('DOMContentLoaded', () => {

    // Nav item clicks
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', e => {
            e.preventDefault();
            loadPage(item.getAttribute('data-page'));
        });
    });

    // Sidebar toggle
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            const sidebar = document.getElementById('sidebar');
            sidebar.classList.toggle('collapsed');
            const icon = sidebarToggle.querySelector('i');
            if (icon) {
                icon.className = sidebar.classList.contains('collapsed')
                    ? 'fas fa-chevron-right'
                    : 'fas fa-bars';
            }
        });
    }

    // Mobile menu toggle
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('active');
        });
    }

    // Close sidebar on outside click (mobile)
    document.addEventListener('click', e => {
        const sidebar = document.getElementById('sidebar');
        const toggle = document.getElementById('mobileMenuToggle');
        if (sidebar?.classList.contains('active')
            && !sidebar.contains(e.target)
            && e.target !== toggle) {
            sidebar.classList.remove('active');
        }
    });

    // Close modals on overlay click
    document.addEventListener('click', e => {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('active');
        }
    });

    // Dark mode toggle
    initDarkMode();

    // Notification panel
    initNotifications();

    // FAB
    initFAB();

    // AI Panel
    initAIPanel();

    // Scroll animations
    initScrollAnimations();

    // Keyboard shortcuts
    initKeyboardShortcuts();

    // Header search toggle
    const hsInput = document.getElementById('headerSearchInput');
    const hs = document.getElementById('headerSearch');
    if (hsInput && hs) {
        hsInput.addEventListener('focus', () => hs.classList.add('open'));
        hsInput.addEventListener('blur', () => {
            if (!hsInput.value) hs.classList.remove('open');
        });
    }
});

// ================================================================
// DARK MODE
// ================================================================
function initDarkMode() {
    const html = document.documentElement;
    const btn = document.getElementById('darkToggle');
    const icon = document.getElementById('darkToggleIcon');

    // Load saved preference
    const saved = localStorage.getItem('theme') || 'light';
    html.setAttribute('data-theme', saved);
    if (icon) icon.className = saved === 'dark' ? 'fas fa-sun' : 'fas fa-moon';

    if (btn) {
        btn.addEventListener('click', () => {
            const current = html.getAttribute('data-theme');
            const next = current === 'dark' ? 'light' : 'dark';
            html.setAttribute('data-theme', next);
            localStorage.setItem('theme', next);
            if (icon) {
                icon.className = next === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
                icon.style.animation = 'spin 0.4s ease';
                setTimeout(() => { if(icon) icon.style.animation = ''; }, 400);
            }
        });
    }
}

// ================================================================
// NOTIFICATIONS
// ================================================================
function initNotifications() {
    const btn = document.getElementById('notifBtn');
    const panel = document.getElementById('notifPanel');
    if (!btn || !panel) return;

    btn.addEventListener('click', e => {
        e.stopPropagation();
        panel.classList.toggle('open');
        btn.setAttribute('aria-expanded', panel.classList.contains('open'));
    });

    document.addEventListener('click', e => {
        if (!btn.contains(e.target) && !panel.contains(e.target)) {
            panel.classList.remove('open');
        }
    });
}

// ================================================================
// FAB
// ================================================================
function initFAB() {
    const fab = document.getElementById('fabBtn');
    const aiPanel = document.getElementById('aiPanel');
    if (!fab) return;

    fab.addEventListener('click', () => {
        if (aiPanel) {
            aiPanel.classList.toggle('open');
            fab.querySelector('i').className = aiPanel.classList.contains('open')
                ? 'fas fa-times'
                : 'fas fa-plus';
        }
    });
}

// ================================================================
// AI ASSISTANT PANEL
// ================================================================
const aiResponses = [
    "Your fleet utilization is currently tracking well. Consider dispatching idle vehicles for short-haul routes.",
    "I notice 2 vehicles are currently in maintenance. Expected availability: tomorrow.",
    "Driver Rajesh Kumar has the highest safety score this month at 4.8/5.0.",
    "Operational costs are within budget for this month. Fuel efficiency is 9.3 km/L.",
    "You have 3 pending trips waiting for dispatch. Would you like me to optimize the routes?",
    "Reminder: 2 driver licenses expire within 30 days. Please schedule renewals.",
    "Last week's fleet utilization was 68%. This is up 12% from the previous week.",
    "I recommend scheduling preventive maintenance for MH-03-EF-9012 — it's approaching 80,000 km.",
];

function initAIPanel() {
    const input = document.getElementById('aiInput');
    const sendBtn = document.getElementById('aiSendBtn');
    const messages = document.getElementById('aiMessages');
    if (!input || !sendBtn || !messages) return;

    function addUserMsg(text) {
        const div = document.createElement('div');
        div.className = 'ai-msg';
        div.style.cssText = 'background:var(--c-primary-ultra);color:var(--c-primary-dark);text-align:right;margin-left:20%;border-radius:var(--r) var(--r-xs) var(--r) var(--r);';
        div.textContent = text;
        messages.appendChild(div);
        messages.scrollTop = messages.scrollHeight;
    }

    function addBotMsg(text) {
        const typing = document.createElement('div');
        typing.className = 'ai-msg bot typing';
        messages.appendChild(typing);
        messages.scrollTop = messages.scrollHeight;

        setTimeout(() => {
            typing.classList.remove('typing');
            typing.textContent = text;
            messages.scrollTop = messages.scrollHeight;
        }, 1000 + Math.random() * 800);
    }

    function handleSend() {
        const text = input.value.trim();
        if (!text) return;
        addUserMsg(text);
        input.value = '';
        const resp = aiResponses[Math.floor(Math.random() * aiResponses.length)];
        addBotMsg(resp);
    }

    sendBtn.addEventListener('click', handleSend);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') handleSend(); });
}

// SCROLL ANIMATIONS
// ================================================================
function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    function observeAll() {
        document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    }

    observeAll();

    // Re-observe when page content changes
    const content = document.getElementById('pageContent');
    if (content) {
        const mut = new MutationObserver(() => {
            setTimeout(observeAll, 100);
        });
        mut.observe(content, { childList: true, subtree: false });
    }
}

// ================================================================
// KEYBOARD SHORTCUTS
// ================================================================
function initKeyboardShortcuts() {
    document.addEventListener('keydown', e => {
        // ESC closes modals
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal.active').forEach(m => m.classList.remove('active'));
            document.getElementById('aiPanel')?.classList.remove('open');
            document.getElementById('notifPanel')?.classList.remove('open');
        }
        // Ctrl+K focuses search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            const searchInput = document.getElementById('headerSearchInput');
            if (searchInput) {
                document.getElementById('headerSearch')?.classList.add('open');
                searchInput.focus();
            }
        }
    });
}

// ================================================================
// AUTO-REFRESH DASHBOARD
// ================================================================
let autoRefreshInterval = null;

function startAutoRefresh() {
    if (autoRefreshInterval) clearInterval(autoRefreshInterval);
    autoRefreshInterval = setInterval(() => {
        const currentPage = document.querySelector('.nav-item.active')?.getAttribute('data-page');
        if (currentPage === 'dashboard') loadDashboard();
    }, 30000);
}

function stopAutoRefresh() {
    if (autoRefreshInterval) { clearInterval(autoRefreshInterval); autoRefreshInterval = null; }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = document.getElementById('appContainer');
    if (app && app.style.display !== 'none') startAutoRefresh();
});

// ================================================================
// TOAST SYSTEM (enhanced — keeps original showToast signature)
// ================================================================
const toastIcons = {
    success: 'fas fa-check-circle',
    error:   'fas fa-times-circle',
    warning: 'fas fa-exclamation-triangle',
    info:    'fas fa-info-circle',
    default: 'fas fa-bell'
};

function showToastPremium(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    container.innerHTML = '';

    const toast = document.createElement('div');
    toast.className = `toast-item toast-${type}`;
    toast.innerHTML = `
        <i class="${toastIcons[type] || toastIcons.default} toast-icon"></i>
        <div class="toast-content">
            <div class="toast-title">${capitalize(type)}</div>
            <div class="toast-msg">${message}</div>
        </div>
        <button class="toast-close-btn" onclick="dismissToast(this.parentElement)" aria-label="Dismiss">&times;</button>
    `;
    container.appendChild(toast);

    setTimeout(() => dismissToast(toast), duration);
}

function dismissToast(el) {
    if (!el || !el.parentElement) return;
    el.classList.add('hiding');
    setTimeout(() => el.remove(), 350);
}

// Override legacy showToast to also show premium version
const _origShowToast = window.showToast;
// We redefine showToast to also use the premium version
// The legacy #toast is kept for backward compatibility
function showToast(message, duration = 3000) {
    // Detect type from message content
    let type = 'info';
    const lm = message.toLowerCase();
    if (lm.includes('success') || lm.includes('created') || lm.includes('updated') || lm.includes('deleted') || lm.includes('completed') || lm.includes('welcome') || lm.includes('logged out')) type = 'success';
    else if (lm.includes('error') || lm.includes('failed') || lm.includes('invalid')) type = 'error';
    else if (lm.includes('warning') || lm.includes('expire') || lm.includes('overdue')) type = 'warning';

    showToastPremium(message, type, duration);
}

// ================================================================
// PREMIUM CONFIRM DIALOG (replaces window.confirm)
// ================================================================
let _confirmResolve = null;

function showConfirmDialog(message, title = 'Confirm Action', type = 'danger') {
    return new Promise(resolve => {
        _confirmResolve = resolve;

        const modal = document.getElementById('confirmModal');
        const titleEl = document.getElementById('confirmTitle');
        const textEl = document.getElementById('confirmText');
        const iconEl = document.getElementById('confirmIcon');
        const iconI = document.getElementById('confirmIconEl');
        const okBtn = document.getElementById('confirmOkBtn');
        const cancelBtn = document.getElementById('confirmCancelBtn');

        if (!modal) { resolve(window.confirm(message)); return; }

        titleEl.textContent = title;
        textEl.textContent = message;
        iconEl.className = `confirm-icon ${type}`;

        if (type === 'danger') {
            iconI.className = 'fas fa-exclamation-triangle';
            okBtn.className = 'btn btn-danger';
        } else if (type === 'warning') {
            iconI.className = 'fas fa-question-circle';
            okBtn.className = 'btn btn-warning';
        }

        modal.classList.add('active');

        // One-time handlers
        const handleOk = () => {
            modal.classList.remove('active');
            okBtn.removeEventListener('click', handleOk);
            cancelBtn.removeEventListener('click', handleCancel);
            resolve(true);
        };
        const handleCancel = () => {
            modal.classList.remove('active');
            okBtn.removeEventListener('click', handleOk);
            cancelBtn.removeEventListener('click', handleCancel);
            resolve(false);
        };

        okBtn.addEventListener('click', handleOk);
        cancelBtn.addEventListener('click', handleCancel);
    });
}

// ================================================================
// COUNT-UP ANIMATION FOR KPI NUMBERS
// ================================================================
function countUp(element, target, duration = 1200, suffix = '') {
    if (!element) return;
    const startTime = performance.now();
    const startVal = parseFloat(element.textContent) || 0;
    const targetVal = parseFloat(target) || 0;
    const isFloat = target.toString().includes('.');
    const decimals = isFloat ? (target.toString().split('.')[1]?.length || 1) : 0;

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = startVal + (targetVal - startVal) * eased;
        element.textContent = (isFloat ? current.toFixed(decimals) : Math.round(current)) + suffix;
        if (progress < 1) requestAnimationFrame(update);
        else { element.textContent = target + suffix; element.classList.add('count-animate'); setTimeout(() => element.classList.remove('count-animate'), 500); }
    }

    requestAnimationFrame(update);
}

// ================================================================
// SKELETON LOADER HELPERS
// ================================================================
function getSkeletonTable(cols = 6, rows = 5) {
    const headerCells = Array(cols).fill('<th><div class="skeleton skeleton-text"></div></th>').join('');
    const bodyCells = Array(cols).fill('<td><div class="skeleton skeleton-text"></div></td>').join('');
    const bodyRows = Array(rows).fill(`<tr>${bodyCells}</tr>`).join('');
    return `
        <div class="table-container">
            <table class="table">
                <thead><tr>${headerCells}</tr></thead>
                <tbody>${bodyRows}</tbody>
            </table>
        </div>`;
}

function getSkeletonCards(count = 4) {
    return Array(count).fill('').map(() => `
        <div class="metric-card reveal fade-up">
            <div class="metric-header">
                <div class="skeleton skeleton-circle" style="width:44px;height:44px;border-radius:12px;"></div>
                <div class="skeleton skeleton-text sm"></div>
            </div>
            <div class="skeleton skeleton-text lg" style="margin-top:16px;"></div>
            <div class="skeleton skeleton-text sm"></div>
        </div>`).join('');
}

// ================================================================
// UTILITY FUNCTIONS
// ================================================================
function formatNumber(num) {
    return parseFloat(num).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function timeAgo(dateString) {
    const date = new Date(dateString);
    const seconds = Math.floor((new Date() - date) / 1000);
    const intervals = [[31536000,'year'],[2592000,'month'],[86400,'day'],[3600,'hour'],[60,'minute']];
    for (const [secs, label] of intervals) {
        const val = Math.floor(seconds / secs);
        if (val > 1) return `${val} ${label}s ago`;
        if (val === 1) return `1 ${label} ago`;
    }
    return 'just now';
}

function capitalize(str) {
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : str;
}

function printPage() { window.print(); }

function toggleFullscreen() {
    if (!document.fullscreenElement) { document.documentElement.requestFullscreen(); }
    else if (document.exitFullscreen) { document.exitFullscreen(); }
}

// ================================================================
// RIPPLE EFFECT ON BUTTONS
// ================================================================
document.addEventListener('click', e => {
    const btn = e.target.closest('.btn');
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement('span');
    const size = Math.max(rect.width, rect.height);
    ripple.style.cssText = `
        position:absolute;
        width:${size}px; height:${size}px;
        top:${e.clientY - rect.top - size/2}px;
        left:${e.clientX - rect.left - size/2}px;
        background:rgba(255,255,255,0.3); border-radius:50%;
        transform:scale(0); animation:ripple 0.6s ease;
        pointer-events:none; z-index:10;
    `;
    btn.style.position = 'relative';
    btn.style.overflow = 'hidden';
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
});

// ================================================================
// USER AVATAR INITIALS
// ================================================================
function setUserAvatarInitials(name) {
    const el = document.getElementById('userAvatarLetter');
    if (el && name) {
        const parts = name.trim().split(' ');
        const initials = parts.length > 1
            ? parts[0][0] + parts[parts.length - 1][0]
            : parts[0][0];
        el.textContent = initials.toUpperCase();
    }
}

// ================================================================
// ERROR HANDLING
// ================================================================
window.addEventListener('error', e => console.error('Global error:', e.error));
window.addEventListener('unhandledrejection', e => console.error('Unhandled rejection:', e.reason));

// ================================================================
// CONSOLE BRANDING
// ================================================================
console.log('%c 🚛 TransitOps ', 'background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;font-size:18px;padding:10px 20px;border-radius:8px;font-weight:bold');
console.log('%c Premium Fleet Management Platform — Awwwards Edition ', 'font-size:11px;color:#6366f1;font-weight:600;');
