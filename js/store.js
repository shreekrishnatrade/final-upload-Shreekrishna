/**
 * js/store.js
 * Centralized localStorage management for the application.
 * Handles Clients, Requests, Projects, Offers, FAQs, Analytics, and Config.
 */

const STORAGE_KEYS = {
  CLIENTS: 'shreek_clients_v2',
  REQUESTS: 'shreek_requests',
  PROJECTS: 'shreek_projects',
  OFFERS: 'shreek_offers',
  FAQS: 'shreek_faqs',
  ANALYTICS: 'shreek_analytics',
  CONFIG: 'shreek_config'
};

const Store = {
  // --- Core CRUD ---

  /**
   * Safe Load: Reads from localStorage with JSON.parse guard.
   * @param {string} key 
   * @returns {any|null} The parsed data or null if missing/corrupt.
   */
  loadData: function (key) {
    try {
      const data = localStorage.getItem(key);
      if (data === null || data === "undefined") return null;
      return JSON.parse(data);
    } catch (e) {
      console.error(`Error loading data for key ${key}:`, e);
      return null;
    }
  },

  /**
   * Safe Save: Writes to localStorage.
   * @param {string} key 
   * @param {any} data 
   */
  saveData: function (key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      // Dispatch a custom event for cross-tab/same-page sync updates
      window.dispatchEvent(new CustomEvent('shreek_data_updated', { detail: { key, data } }));
    } catch (e) {
      console.error(`Error saving data for key ${key}:`, e);
    }
  },

  /**
   * Atomic Update: Loads, modifies via callback, and saves.
   * @param {string} key 
   * @param {function} callback (currentData) => newData
   */
  update: function (key, callback) {
    const current = this.loadData(key);
    const updated = callback(current);
    if (updated !== undefined) {
      this.saveData(key, updated);
    }
  },

  // --- Defaults & Seeding ---

  initDefaults: function () {
    // 1. Config (Theme Default: LIGHT)
    if (!this.loadData(STORAGE_KEYS.CONFIG)) {
      this.saveData(STORAGE_KEYS.CONFIG, {
        theme: 'light', // User Requirement: Open in light mode
        plans: {
          basic: { discount: 5, price: 0, name: 'Basic' },
          silver: { discount: 10, price: 2000, name: 'Silver' },
          gold: { discount: 15, price: 5000, name: 'Gold' },
          platinum: { discount: 20, price: 10000, name: 'Platinum' }
        }
      });
    }

    // 2. Projects (Default content with Expanded Details)
    if (!this.loadData(STORAGE_KEYS.PROJECTS)) {
      this.saveData(STORAGE_KEYS.PROJECTS, [
        {
          id: 'p1',
          title: 'Samsung Washing Machine Repair',
          desc: 'Motor replacement & testing — Kirtipur',
          img: 'img/project1.jpeg',
          location: 'Kirtipur, Kathmandu',
          serviceType: 'Washing Machine Repair',
          date: 'January 2026',
          problem: 'Machine was making loud noise and not spinning.',
          solution: 'Diagnosed motor failure. Replaced carbon brushes and aligned the drum.',
          parts: 'Samsung Motor Carbon Brush Set',
          technician: 'Ramesh K.'
        },
        {
          id: 'p2',
          title: 'Whirlpool Top Load',
          desc: 'Servicing — completed in Boudhaa',
          img: 'img/project2.jpeg',
          location: 'Boudha, Kathmandu',
          serviceType: 'Maintenance',
          date: 'January 2026',
          problem: 'Regular maintenance requested. Water flow was slow.',
          solution: 'Cleaned inlet filters and drum descaling.',
          parts: 'Descaling Powder',
          technician: 'Sunil M.'
        },
        {
          id: 'p3',
          title: 'LG Washing Machine',
          desc: 'Minor glitch with major repair — completed in Thamel',
          img: 'img/project3.jpeg',
          location: 'Thamel, Kathmandu',
          serviceType: 'PCB Repair',
          date: 'December 2025',
          problem: 'Display error code PE. Not starting.',
          solution: 'Repaired PCB circuit connections and reset sensor.',
          parts: 'None (Soldering Work)',
          technician: 'Bikash T.'
        }
      ]);
    }

    // 3. Offers
    if (!this.loadData(STORAGE_KEYS.OFFERS)) {
      this.saveData(STORAGE_KEYS.OFFERS, []);
    }

    // 4. FAQs (Chatbot defaults)
    if (!this.loadData(STORAGE_KEYS.FAQS)) {
      this.saveData(STORAGE_KEYS.FAQS, [
        { id: 'f1', question: 'charges', answer: 'Our inspection charge is Rs. 500 inside Ringroad. Repair costs depend on the issue.' },
        { id: 'f2', question: 'warranty', answer: 'Yes, we provide 3 months warranty on replaced parts and service.' },
        { id: 'f3', question: 'member', answer: 'You can register on our website and choose a Silver or Gold plan to get up to 15% discount.' },
        { id: 'f4', question: 'location', answer: 'We are located at Chabahil, Kumarigal, Kathmandu.' },
        { id: 'f5', question: 'contact', answer: 'Call/WhatsApp us at +977 9767990237.' }
      ]);
    }

    // 5. Analytics
    if (!this.loadData(STORAGE_KEYS.ANALYTICS)) {
      this.saveData(STORAGE_KEYS.ANALYTICS, {
        visitors: 0,
        visitsByDate: {}
      });
    }

    // 6. Requests
    if (!this.loadData(STORAGE_KEYS.REQUESTS)) {
      this.saveData(STORAGE_KEYS.REQUESTS, []);
    }

    // 7. Clients
    if (!this.loadData(STORAGE_KEYS.CLIENTS)) {
      this.saveData(STORAGE_KEYS.CLIENTS, []);
    }
  },

  // --- Helpers ---

  uid: function () {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },

  trackVisit: function () {
    this.update(STORAGE_KEYS.ANALYTICS, (data) => {
      data = data || { visitors: 0, visitsByDate: {} };
      data.visitors++;
      const today = new Date().toISOString().split('T')[0];
      if (!data.visitsByDate[today]) data.visitsByDate[today] = 0;
      data.visitsByDate[today]++;
      return data;
    });
  }
};

// Initialize seeding immediately
Store.initDefaults();
window.Store = Store;

