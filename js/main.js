/**
 * js/main.js
 * Client-Side Logic using Store.js
 */

const SESSION_KEY = 'shreek_session_v1';

document.addEventListener('DOMContentLoaded', () => {

  // 1. ANALYTICS & THEME
  Store.trackVisit();

  // Apply Theme
  const config = Store.loadData('shreek_config');
  if (config && config.theme === 'dark') {
    document.body.classList.add('dark-mode');
    const btn = document.getElementById('themeToggle');
    if (btn) btn.innerHTML = '<i class="fas fa-sun"></i>';
  }

  // NAV HIGHLIGHTER
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html') || (href.includes('#') && currentPath === 'index.html')) {
      // Simple match
      if (href === currentPath) link.classList.add('active');
    }
  });

  /* ----------------------------------------------------
     2. DYNAMIC CONTENT RENDERING
     ---------------------------------------------------- */

  // RENDER PROJECTS
  const projectContainer = document.querySelector('#projects .row');
  const projects = Store.loadData('shreek_projects') || [];
  if (projectContainer && projects.length > 0) {
    projectContainer.innerHTML = projects.slice(0, 3).map(p => `
            <div class="col-md-4 mb-3">
              <div class="card h-100 project-card shadow-sm">
                <img src="${p.img}" alt="${p.title}" class="card-img-top">
                <div class="card-body">
                  <h6 class="card-title">${p.title}</h6>
                  <p class="small text-muted mb-0 text-truncate">${p.desc}</p>
                  <button class="btn btn-sm btn-outline-primary mt-2" onclick="viewProjectDetails('${p.id}')">View Details</button>
                </div>
              </div>
            </div>
         `).join('');
  }

  window.viewProjectDetails = function (id) {
    const projs = Store.loadData('shreek_projects');
    const p = projs.find(x => x.id === id);
    if (p) {
      document.getElementById('clientProjTitle').textContent = p.title;
      document.getElementById('clientProjDesc').textContent = p.desc;
      document.getElementById('clientProjImg').src = p.img;

      // New Fields
      const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val || 'N/A'; };
      setVal('projLoc', p.location);
      setVal('projType', p.serviceType);
      setVal('projDate', p.date);
      setVal('projTech', p.technician);
      setVal('projProb', p.problem);
      setVal('projSol', p.solution);
      setVal('projParts', p.parts);

      const el = document.getElementById('modalClientProject');
      let modal = bootstrap.Modal.getInstance(el);
      if (!modal) {
        modal = new bootstrap.Modal(el);
      }
      modal.show();
    }
  };

  /* ----------------------------------------------------
     3. FORM HANDLERS (Standalone Pages)
     ---------------------------------------------------- */

  // SERVICE SUBMISSION
  const serviceForm = document.querySelector('.service-form');
  if (serviceForm) {
    serviceForm.addEventListener('submit', e => {
      e.preventDefault();
      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;
      const phone = document.getElementById('phone').value;
      const address = document.getElementById('address').value;
      const service = document.getElementById('service').value;
      const reqDate = document.getElementById('reqDate').value;
      const msg = document.getElementById('message').value;

      const requests = Store.loadData('shreek_requests') || [];
      const newReq = {
        id: Store.uid(),
        clientName: name,
        clientContact: phone + ' / ' + email,
        clientAddress: address,
        service: service,
        reqDate: reqDate,
        details: msg,
        timestamp: new Date().toISOString(),
        status: 'Pending'
      };

      requests.push(newReq);
      Store.saveData('shreek_requests', requests);

      // Also update user history if logged in or email matches
      const clients = Store.loadData('shreek_clients_v2');
      const matchedClient = clients.find(c => c.email === email);
      if (matchedClient) {
        if (!matchedClient.history) matchedClient.history = [];
        matchedClient.history.push(`${new Date().toLocaleDateString()}: Requested ${service} for ${address}`);
        Store.saveData('shreek_clients_v2', clients);
      }

      alert('Service Request Submitted! We will contact you shortly.');
      serviceForm.reset();
      window.location.href = 'index.html';
    });

    // Auto-fill if logged in
    const s = sessionStorage.getItem(SESSION_KEY);
    if (s) {
      try {
        const uSession = JSON.parse(s);
        const allClients = Store.loadData('shreek_clients_v2');
        const u = allClients.find(c => c.id === uSession.id);
        if (u) {
          if (document.getElementById('name')) document.getElementById('name').value = u.name || '';
          if (document.getElementById('email')) document.getElementById('email').value = u.email || '';
          if (document.getElementById('phone')) document.getElementById('phone').value = u.phone || '';
        }
      } catch (e) {
        console.error('Session parse error', e);
      }
    }
  }

  // LOGIN HANDLER
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', e => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;

      const clients = Store.loadData('shreek_clients_v2') || [];
      const user = clients.find(c => c.email === email && c.password === password);

      if (user) {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify({ id: user.id }));
        alert('Login Successful!');
        window.location.href = 'index.html';
      } else {
        alert('Invalid email or password.');
      }
    });
  }

  // REGISTER HANDLER
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', e => {
      e.preventDefault();
      const name = document.getElementById('regName').value;
      const email = document.getElementById('regEmail').value;
      const phone = document.getElementById('regPhone').value;
      const plan = document.getElementById('regPlan').value;
      const password = document.getElementById('regPassword').value;

      const clients = Store.loadData('shreek_clients_v2') || [];
      if (clients.find(c => c.email === email)) {
        alert('Email already registered!');
        return;
      }

      const newUser = {
        id: Store.uid(),
        name,
        email,
        phone,
        plan,
        password,
        joined: new Date().toISOString(),
        history: []
      };

      clients.push(newUser);
      Store.saveData('shreek_clients_v2', clients);

      alert('Registration Successful! Please Login.');
      window.location.href = 'login.html';
    });
  }

  // Dashboard Logout
  const logoutBtn = document.getElementById('logoutClient');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      sessionStorage.removeItem(SESSION_KEY);
      location.reload();
    });
  }

  // FLOATING BUTTONS & THEME TOGGLE
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
      document.documentElement.classList.toggle('dark-mode');

      const isDark = document.body.classList.contains('dark-mode');
      themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';

      const config = Store.loadData('shreek_config') || {};
      config.theme = isDark ? 'dark' : 'light';
      Store.saveData('shreek_config', config);
    });
  }

  const scrollToTop = document.getElementById('scrollToTop');
  if (scrollToTop) {
    window.addEventListener('scroll', () => {
      // Scroll-to-top visibility
      if (window.scrollY > 300) scrollToTop.classList.add('visible');
      else scrollToTop.classList.remove('visible');

      // Navbar shadow on scroll
      const nav = document.querySelector('.navbar');
      if (nav) nav.classList.toggle('scrolled', window.scrollY > 60);
    });
    scrollToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // CHATBOT AUTO-OPEN
  const chatbotToggle = document.getElementById('chatbotToggle');
  const chatbotWidget = document.getElementById('chatbotWidget');
  const chatbotHeader = document.getElementById('chatbotHeader'); // Close button area inside header

  if (chatbotToggle && chatbotWidget) {
    chatbotToggle.addEventListener('click', () => {
      const isHidden = (chatbotWidget.style.display === 'none' || chatbotWidget.style.display === '');
      chatbotWidget.style.display = isHidden ? 'flex' : 'none';
      if (isHidden) loadChatbotOptions();
    });

    // Header click toggles/closes
    if (chatbotHeader) {
      chatbotHeader.addEventListener('click', () => {
        chatbotWidget.style.display = 'none';
      });
    }

    // Auto-Open after 4 seconds (Home Page Only)
    const isHomePage = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/') || window.location.pathname === '';
    if (isHomePage) {
      setTimeout(() => {
        if (chatbotWidget.style.display === 'none' || chatbotWidget.style.display === '') {
          chatbotWidget.style.display = 'flex';
          loadChatbotOptions();
        }
      }, 4000);
    }
  }

  function loadChatbotOptions() {
    const opts = document.getElementById('chatbotOptions');
    if (!opts) return;
    // Add Quick Actions
    const quickActions = `
        <div class="quick-links">
            <button onclick="location.href='service-request.html'">📅 Book Service</button>
            <button onclick="window.open('https://wa.me/9779767990237', '_blank')">💬 WhatsApp Us</button>
        </div>
      `;

    const faqs = Store.loadData('shreek_faqs') || [];
    const faqButtons = faqs.map(f => `
        <button onclick="askBot('${f.id}')">${f.question}</button>
      `).join('');

    opts.innerHTML = quickActions + faqButtons;
  }

  window.askBot = function (id) {
    const faqs = Store.loadData('shreek_faqs');
    const f = faqs.find(x => x.id === id);
    const log = document.getElementById('chatbotBody');
    if (f && log) {
      log.innerHTML += `<div class="user-msg">${f.question}</div>`;
      setTimeout(() => {
        log.innerHTML += `<div class="bot-msg">${f.answer}</div>`;
        log.scrollTop = log.scrollHeight;
      }, 500);
    }
  };

  // Check Session for Dashboard Button vs Login Button
  const session = sessionStorage.getItem(SESSION_KEY);
  if (session) {
    // If logged in, maybe change "Client Login" button in nav to "My Dashboard"
    // This is a nice-to-have visual update
    const navLoginBtn = document.querySelector('a[href="login.html"]'); // Updated selector
    if (navLoginBtn) {
      navLoginBtn.textContent = 'My Dashboard';
      navLoginBtn.classList.remove('btn-primary');
      navLoginBtn.classList.add('btn-warning');
      navLoginBtn.href = '#';
      navLoginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const u = JSON.parse(session);
        showClientDashboard(u.id);
      });
    }
  }

  // SCROLL REVEAL ANIMATION
  const revealElements = document.querySelectorAll('.reveal-on-scroll');
  if (revealElements.length > 0) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          // Optionally unobserve after revealing
          // revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    revealElements.forEach(el => revealObserver.observe(el));
  }

  // STATS ANIMATION
  const statsSection = document.querySelector('.stats-section');
  if (statsSection) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const counters = document.querySelectorAll('.stat-item h3');
          counters.forEach(counter => {
            const target = +counter.getAttribute('data-target');
            const suffix = (target >= 500 || target >= 2000) ? '+' : ((target >= 10 || target < 5) ? '+' : ''); // simple suffix logic
            const speed = 200;
            const updateCount = () => {
              const count = +counter.innerText.replace('+', '');
              const inc = target / speed;
              if (count < target) {
                counter.innerText = Math.ceil(count + inc);
                setTimeout(updateCount, 20);
              } else {
                counter.innerText = target + suffix;
              }
            };
            updateCount();
          });
          observer.disconnect();
        }
      });
    }, { threshold: 0.2 });
    observer.observe(statsSection);
  }

});

function showClientDashboard(userId) {
  const clients = Store.loadData('shreek_clients_v2');
  const user = clients.find(c => c.id === userId);
  if (user) {
    updateDashboardUI(user);
    const modal = new bootstrap.Modal(document.getElementById('modalClientDashboard'));
    modal.show();
  }
}

function updateDashboardUI(user) {
  const nameEl = document.getElementById('dashName');
  if (nameEl) nameEl.textContent = user.name;

  const emailEl = document.getElementById('dashEmail');
  if (emailEl) emailEl.textContent = user.email;

  const phoneEl = document.getElementById('dashPhone');
  if (phoneEl) phoneEl.textContent = user.phone;

  // Plan Badge
  const planEl = document.getElementById('dashPlan');
  if (planEl) {
    planEl.textContent = (user.plan || 'No Plan').toUpperCase();
    if (user.plan === 'gold') planEl.className = 'badge bg-warning text-dark';
    else if (user.plan === 'silver') planEl.className = 'badge bg-secondary text-white';
    else if (user.plan === 'basic') planEl.className = 'badge bg-info text-dark';
    else planEl.className = 'badge bg-light text-dark border';
  }

  // Discount
  const discount = (user.plan === 'silver') ? 10 : (user.plan === 'gold' ? 15 : (user.plan === 'basic' ? 5 : 0));
  const discEl = document.getElementById('dashDiscountVal');
  if (discEl) discEl.textContent = discount + '%';

  // History
  const list = document.getElementById('dashHistory');
  if (list) {
    if (!user.history || !user.history.length) {
      list.innerHTML = '<p class="text-muted small text-center my-4">No service requests yet.</p>';
    } else {
      list.innerHTML = user.history.slice().reverse().map(h => `
                <div class="alert alert-light border mb-2 py-2 px-3 small">
                    ${h}
                </div>
            `).join('');
    }
  }
}