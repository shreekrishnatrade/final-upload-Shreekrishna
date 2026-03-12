/**
 * js/backend-forms.js
 * Handles backend form submissions using Fetch API
 */

// Helper to show messages
const showMsg = (msg, type = 'success') => alert((type === 'success' ? '✅ ' : '❌ ') + msg);

// A. Service Request Form
const serviceForm = document.querySelector('.service-form'); // or ID serviceRequestForm
if (serviceForm) {
    serviceForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const btn = this.querySelector('button[type="submit"]');
        const originalText = btn.innerHTML;
        btn.innerHTML = 'Submitting...';
        btn.disabled = true;

        try {
            const formData = new FormData(this);
            const response = await fetch('https://shreekrishna-backend.rf.gd/backend/process-service-request.php', {
                method: 'POST',
                credentials: 'include',
                body: formData
            });
            const result = await response.json();

            if (result.success) {
                showMsg(result.message);
                this.reset();
                window.location.href = 'index.html';
            } else {
                showMsg(result.message, 'error');
            }
        } catch (error) {
            console.error(error);
            showMsg('An error occurred. Please try again.', 'error');
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    });
}

// B. Registration Form
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const btn = this.querySelector('button[type="submit"]');
        btn.innerHTML = 'Creating Account...';
        btn.disabled = true;

        try {
            const formData = new FormData(this);
            // Ensure passwords match if using separate JS check, usually handled by backend too
            const response = await fetch('https://shreekrishna-backend.rf.gd/backend/process-registration.php', {
                method: 'POST',
                credentials: 'include',
                body: formData
            });
            const result = await response.json(); // backend returns json

            if (result.success) {
                showMsg(result.message);
                if (result.data && result.data.redirect) window.location.href = result.data.redirect;
            } else {
                showMsg(result.message, 'error');
                btn.innerHTML = 'Create Account';
                btn.disabled = false;
            }
        } catch (error) {
            showMsg('Connection Failed', 'error');
            btn.disabled = false;
        }
    });
}

// C. Login Form
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const btn = this.querySelector('button');
        btn.innerHTML = 'Logging in...';

        try {
            const formData = new FormData(this);
            const response = await fetch('https://shreekrishna-backend.rf.gd/backend/process-login.php', {
                method: 'POST',
                credentials: 'include',
                body: formData
            });
            const result = await response.json();

            if (result.success) {
                showMsg(result.message);
                if (result.data.redirect) window.location.href = result.data.redirect;
            } else {
                showMsg(result.message, 'error');
                btn.innerHTML = 'Login';
            }
        } catch (e) {
            showMsg('Error logging in', 'error');
            btn.innerHTML = 'Login';
        }
    });
}

// D. Statistics
async function loadRealStats() {
    const statsContainer = document.querySelector('.stats-section');
    if (!statsContainer) return;

    try {
        const res = await fetch('https://shreekrishna-backend.rf.gd/backend/get-statistics.php');
        const data = await res.json();

        if (data.success) {
            const stats = data.data;
            // Update DOM
            // Expecting elements with data-target or specific IDs
            // Mapping to the specific structure in index.html: h3 data-target="500"
            // We need to update the data-target attribute OR the innerText directly if we run the animation again

            // Example mapping assuming order or IDs. 
            // Better to use IDs in HTML, but based on previous code:
            // "Happy Customers" -> satisfied_clients
            // "Repairs Completed" -> services_delivered
            // "Years Experience" -> years_experience
            // "Average Rating" -> average_rating

            // NOTE: This requires HTML update to add IDs or we infer by index
            // For now, let's try to update if we can identify them.
            // Or just update the text content directly and skip animation logic for now, or reset animation.
        }
    } catch (e) {
        console.log('Could not load stats', e);
    }
}
document.addEventListener('DOMContentLoaded', loadRealStats);
