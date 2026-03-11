/**
 * js/admin.js
 * Admin Panel Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    const loginOverlay = document.getElementById('adminLoginOverlay');
    const adminApp = document.getElementById('adminApp');
    const navLinks = document.querySelectorAll('.admin-sidebar .nav-link');
    const tabs = document.querySelectorAll('.admin-tab');

    // 0. Apply Theme
    const config = Store.loadData('shreek_config');
    if (config && config.theme === 'dark') {
        document.body.classList.add('dark-mode');
    }

    // 1. Authentication Check
    const isAdmin = sessionStorage.getItem('shreek_admin_auth') === 'true';
    if (isAdmin) {
        showAdminPanel();
    } else {
        loginOverlay.classList.remove('d-none');
        adminApp.classList.add('d-none');
    }

    // 2. Login Handler
    document.getElementById('adminLoginForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const u = document.getElementById('adminUser').value;
        const p = document.getElementById('adminPass').value;
        // Simple mock auth
        if (u === 'admin' && p === 'admin123') {
            sessionStorage.setItem('shreek_admin_auth', 'true');
            showAdminPanel();
        } else {
            alert('Invalid credentials! (Try admin/admin123)');
        }
    });

    // 3. Logout Handler
    document.getElementById('adminLogout').addEventListener('click', () => {
        sessionStorage.removeItem('shreek_admin_auth');
        location.reload();
    });

    function showAdminPanel() {
        loginOverlay.classList.add('d-none');
        adminApp.classList.remove('d-none');
        loadDashboard();
    }

    // 4. Tab Navigation
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            // Update Active State
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            // Show Tab
            const targetId = link.getAttribute('data-tab');
            tabs.forEach(t => t.classList.add('d-none'));
            document.getElementById('tab-' + targetId).classList.remove('d-none');

            // Load specific tab data
            if (targetId === 'dashboard') loadDashboard();
            if (targetId === 'requests') loadRequests();
            if (targetId === 'clients') loadClients();
            if (targetId === 'projects') loadProjects();
            if (targetId === 'offers') loadOffers();
            if (targetId === 'faqs') loadFAQs();
            if (targetId === 'settings') loadSettings();
        });
    });

    // --- TAB: DASHBOARD ---
    function loadDashboard() {
        const textVisitors = document.getElementById('statVisitors');
        const textToday = document.getElementById('statToday');
        const textRequests = document.getElementById('statRequests');
        const textMembers = document.getElementById('statMembers');

        const analytics = Store.loadData('shreek_analytics') || {};
        const requests = Store.loadData('shreek_requests') || [];
        const clients = Store.loadData('shreek_clients_v2') || [];

        textVisitors.textContent = analytics.visitors || 0;

        const today = new Date().toISOString().split('T')[0];
        textToday.textContent = (analytics.visitsByDate && analytics.visitsByDate[today]) ? analytics.visitsByDate[today] : 0;

        textRequests.textContent = requests.length;
        textMembers.textContent = clients.filter(c => c.plan && c.plan !== 'none').length;

        // Recent Requests Table
        const recent = requests.slice(-5).reverse();
        const tbody = document.getElementById('dashboardRecentTable');
        tbody.innerHTML = recent.map(r => `
      <tr>
        <td>${r.service}</td>
        <td>${r.clientName}</td>
        <td><span class="status-badge-${getStatusClass(r.status)}">${r.status || 'Pending'}</span></td>
      </tr>
    `).join('');
    }

    function getStatusClass(status) {
        if (!status) return 'pending';
        if (status === 'Completed') return 'completed';
        if (status === 'In Progress') return 'progress';
        return 'pending';
    }

    // --- TAB: REQUESTS ---
    function loadRequests() {
        const requests = Store.loadData('shreek_requests') || [];
        const tbody = document.querySelector('#requestsTable tbody');
        tbody.innerHTML = '';

        requests.slice().reverse().forEach((r, idx) => {
            // Original index in reverse is derived, but easier to use ID if we had one. 
            // We'll trust the reverse order matches. Better to find by stored ID if available? 
            // Request objects didn't originally have IDs in main.js logic, we should try to add them.
            // Assuming store items have IDs or we use index (risky if deleted).
            // Let's assume we match by a unique timestamp/content signature or index.
            const tr = document.createElement('tr');
            tr.innerHTML = `
        <td>
            ${new Date(r.timestamp || Date.now()).toLocaleDateString()}<br>
            <span class="badge bg-light text-dark border">Pref: ${r.reqDate ? new Date(r.reqDate).toLocaleString() : 'Anytime'}</span>
        </td>
        <td>
          ${r.clientName}<br>
          <small class="text-muted"><i class="fas fa-map-marker-alt"></i> ${r.clientAddress || 'N/A'}</small>
        </td>
        <td>${r.clientContact}</td>
        <td>${r.service}</td>
        <td><small>${r.details}</small></td>
        <td>
          <select class="form-select form-select-sm status-select" data-id="${r.id}">
            <option value="Pending" ${r.status === 'Pending' ? 'selected' : ''}>Pending</option>
            <option value="In Progress" ${r.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
            <option value="Completed" ${r.status === 'Completed' ? 'selected' : ''}>Completed</option>
          </select>
        </td>
        <td>
          <button class="btn btn-sm btn-danger btn-delete-req" data-id="${r.id}">X</button>
        </td>
      `;
            tbody.appendChild(tr);
        });

        // Event Delegation for Table updates
        tbody.onclick = (e) => {
            if (e.target.classList.contains('btn-delete-req')) {
                if (confirm('Delete this request?')) {
                    deleteRequest(e.target.dataset.id);
                }
            }
        };

        tbody.onchange = (e) => {
            if (e.target.classList.contains('status-select')) {
                updateRequestStatus(e.target.dataset.id, e.target.value);
            }
        };
    }

    function deleteRequest(id) {
        let requests = Store.loadData('shreek_requests') || [];
        requests = requests.filter(r => r.id !== id);
        Store.saveData('shreek_requests', requests);
        loadRequests();
    }

    function updateRequestStatus(id, status) {
        let requests = Store.loadData('shreek_requests') || [];
        const req = requests.find(r => r.id === id);
        if (req) {
            req.status = status;
            Store.saveData('shreek_requests', requests);
            alert('Status updated!');
        }
    }

    // --- TAB: CLIENTS ---
    function loadClients() {
        const clients = Store.loadData('shreek_clients_v2') || [];
        const tbody = document.querySelector('#clientsTable tbody');
        tbody.innerHTML = clients.map(c => `
      <tr>
        <td>${c.name}</td>
        <td>${c.email}</td>
        <td>${c.phone}</td>
        <td><span class="badge bg-secondary">${c.plan || 'none'}</span></td>
        <td>${new Date(c.joined).toLocaleDateString()}</td>
        <td>
          <button class="btn btn-sm btn-warning" onclick="toggleMembership('${c.id}')">Toggle Membership</button>
        </td>
      </tr>
    `).join('');
    }

    window.toggleMembership = function (id) {
        let clients = Store.loadData('shreek_clients_v2');
        const c = clients.find(u => u.id === id);
        if (c) {
            c.plan = (c.plan === 'none' || !c.plan) ? 'silver' : 'none'; // Simple toggle for admin demo
            Store.saveData('shreek_clients_v2', clients);
            loadClients();
        }
    }

    window.exportClients = function () {
        const clients = Store.loadData('shreek_clients_v2');
        const csv = 'Name,Email,Phone,Plan\n' + clients.map(c => `${c.name},${c.email},${c.phone},${c.plan}`).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'clients_export.csv';
        a.click();
    }

    // --- TAB: PROJECTS ---
    function loadProjects() {
        const projects = Store.loadData('shreek_projects') || [];
        const list = document.getElementById('projectsList');
        list.innerHTML = '';
        projects.forEach(p => {
            list.innerHTML += `
        <div class="col-md-4">
          <div class="card h-100">
            <img src="${p.img}" class="card-img-top" style="height:150px;object-fit:cover;">
            <div class="card-body">
              <h6>${p.title}</h6>
              <p class="small text-muted">${p.desc}</p>
              <button class="btn btn-sm btn-outline-danger" onclick="deleteProject('${p.id}')">Delete</button>
              <button class="btn btn-sm btn-outline-primary" onclick="editProject('${p.id}')">Edit</button>
            </div>
          </div>
        </div>
      `;
        });
    }

    const projectModal = new bootstrap.Modal(document.getElementById('modalProject'));
    document.getElementById('projectForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('projId').value;
        const title = document.getElementById('projTitle').value;
        const desc = document.getElementById('projDesc').value;
        const img = document.getElementById('projImg').value; // In real app, file upload

        let projects = Store.loadData('shreek_projects') || [];

        if (id) {
            const idx = projects.findIndex(p => p.id === id);
            if (idx > -1) projects[idx] = { id, title, desc, img };
        } else {
            projects.push({ id: Store.uid(), title, desc, img });
        }

        Store.saveData('shreek_projects', projects);
        projectModal.hide();
        document.getElementById('projectForm').reset();
        document.getElementById('projId').value = '';
        loadProjects();
    });

    window.deleteProject = function (id) {
        if (!confirm('Delete this project?')) return;
        let projects = Store.loadData('shreek_projects') || [];
        Store.saveData('shreek_projects', projects.filter(p => p.id !== id));
        loadProjects();
    }

    window.editProject = function (id) {
        let projects = Store.loadData('shreek_projects') || [];
        const p = projects.find(x => x.id === id);
        if (p) {
            document.getElementById('projId').value = p.id;
            document.getElementById('projTitle').value = p.title;
            document.getElementById('projDesc').value = p.desc;
            document.getElementById('projImg').value = p.img;
            projectModal.show();
        }
    }

    // --- TAB: OFFERS ---
    function loadOffers() {
        const offers = Store.loadData('shreek_offers') || [];
        const list = document.getElementById('offersList');
        if (offers.length === 0) {
            list.innerHTML = '<p>No active offers. Create one!</p>';
        } else {
            list.innerHTML = offers.map(o => `
        <div class="d-flex justify-content-between align-items-center border p-2 mb-2 rounded">
          <div>
            <strong>${o.title}</strong> (${o.discount}% Off)<br>
            <small>Expires: ${new Date(o.end).toLocaleString()}</small>
          </div>
          <button class="btn btn-sm btn-danger" onclick="deleteOffer('${o.id}')">Delete</button>
        </div>
      `).join('');
        }
    }

    const offerModal = new bootstrap.Modal(document.getElementById('modalOffer'));
    document.getElementById('offerForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('offerTitle').value;
        const disc = document.getElementById('offerDisc').value;
        const date = document.getElementById('offerDate').value;

        let offers = Store.loadData('shreek_offers') || [];
        offers.push({ id: Store.uid(), title, discount: disc, end: date });
        Store.saveData('shreek_offers', offers);

        offerModal.hide();
        document.getElementById('offerForm').reset();
        loadOffers();
    });

    window.deleteOffer = function (id) {
        let offers = Store.loadData('shreek_offers') || [];
        Store.saveData('shreek_offers', offers.filter(o => o.id !== id));
        loadOffers();
    }

    // --- TAB: FAQs ---
    function loadFAQs() {
        const faqs = Store.loadData('shreek_faqs') || [];
        const tbody = document.querySelector('#faqsTable tbody');
        tbody.innerHTML = faqs.map(f => `
       <tr>
         <td>${f.question}</td>
         <td>${f.answer}</td>
         <td><button class="btn btn-sm btn-danger" onclick="deleteFAQ('${f.id}')">X</button></td>
       </tr>
     `).join('');
    }

    const faqModal = new bootstrap.Modal(document.getElementById('modalFAQ'));
    document.getElementById('faqForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const q = document.getElementById('faqQ').value;
        const a = document.getElementById('faqA').value;
        let faqs = Store.loadData('shreek_faqs') || [];
        faqs.push({ id: Store.uid(), question: q, answer: a });
        Store.saveData('shreek_faqs', faqs);
        faqModal.hide();
        document.getElementById('faqForm').reset();
        loadFAQs();
    });

    window.deleteFAQ = function (id) {
        let faqs = Store.loadData('shreek_faqs') || [];
        Store.saveData('shreek_faqs', faqs.filter(f => f.id !== id));
        loadFAQs();
    }

    // --- TAB: SETTINGS ---
    function loadSettings() {
        const config = Store.loadData('shreek_config') || {};
        document.getElementById('settingTheme').checked = (config.theme === 'dark');

        const plans = config.plans || {};
        if (plans.silver) {
            document.getElementById('priceSilver').value = plans.silver.price;
            document.getElementById('discSilver').value = plans.silver.discount;
        }
        if (plans.gold) {
            document.getElementById('priceGold').value = plans.gold.price;
            document.getElementById('discGold').value = plans.gold.discount;
        }
    }

    document.getElementById('settingsForm').addEventListener('submit', (e) => {
        e.preventDefault();
        let config = Store.loadData('shreek_config') || {};
        config.theme = document.getElementById('settingTheme').checked ? 'dark' : 'light';

        if (!config.plans) config.plans = {};
        config.plans.silver = { ...config.plans.silver, price: document.getElementById('priceSilver').value, discount: document.getElementById('discSilver').value };
        config.plans.gold = { ...config.plans.gold, price: document.getElementById('priceGold').value, discount: document.getElementById('discGold').value };

        Store.saveData('shreek_config', config);
        alert('Settings saved!');
    });

});
