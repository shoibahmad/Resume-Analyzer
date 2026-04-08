import { auth, db } from './firebase-config.js';
import { showToast } from './toast.js';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    sendPasswordResetEmail, 
    onAuthStateChanged,
    signOut,
    updateProfile
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    doc, 
    setDoc, 
    getDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// --- Form Selectors ---
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const forgotForm = document.getElementById('forgot-form');
const authMessage = document.getElementById('auth-message');

// --- Helper Functions ---
const showMessage = (msg, type = 'error') => {
    showToast(msg, type);
};

// --- Authentication Logic ---

// Signup
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Update Auth Profile
            await updateProfile(user, { displayName: name });

            // Store in Firestore
            await setDoc(doc(db, "users", user.uid), {
                name: name,
                email: email,
                createdAt: new Date().toISOString()
            });

            showToast("Account created successfully! Welcome to ResuMind AI.", "success");
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        } catch (error) {
            showToast(error.message, "error");
        }
    });
}

// Login
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            await signInWithEmailAndPassword(auth, email, password);
            showToast("Signed in successfully! Welcome back.", "success");
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        } catch (error) {
            showMessage("Invalid email or password. Please try again.");
        }
    });
}

// Forgot Password
if (forgotForm) {
    forgotForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('forgot-email').value;

        try {
            await sendPasswordResetEmail(auth, email);
            showToast("Password reset link sent! Check your inbox.", "success");
        } catch (error) {
            showToast(error.message, "error");
        }
    });
}

// --- Global Auth State Mapping to UI ---
onAuthStateChanged(auth, async (user) => {
    const isAuthPage = window.location.pathname.includes('auth.html');
    const isProtectedPage = window.location.pathname.includes('dashboard.html') || 
                           window.location.pathname.includes('analyzer.html') ||
                           window.location.pathname.includes('career-path.html') ||
                           window.location.pathname.includes('settings.html');

    if (user) {
        // User is signed in
        if (isAuthPage) window.location.href = 'dashboard.html';
        
        // Update Header Info across all pages
        const userNameEl = document.getElementById('user-name');
        const userEmailEl = document.getElementById('user-email');
        const authBtnEl = document.getElementById('auth-btn');
        const logoutBtnEl = document.getElementById('logout-btn');

        if (userNameEl) userNameEl.textContent = user.displayName || "User";
        if (userEmailEl) userEmailEl.textContent = user.email;
        if (authBtnEl) authBtnEl.style.display = 'none';
        if (logoutBtnEl) logoutBtnEl.style.display = 'flex';

    } else {
        // User is signed out
        if (isProtectedPage) window.location.href = 'auth.html';
    }
});

// --- Logout Confirmation Modal Logic ---
function injectLogoutModal() {
    if (document.getElementById('logout-confirm-modal')) return;
    
    const modalHtml = `
        <div id="logout-confirm-modal" class="logout-modal">
            <div class="logout-modal-overlay"></div>
            <div class="logout-modal-card">
                <div class="logout-icon-wrapper">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                </div>
                <h2>Sign Out?</h2>
                <p>Are you sure you want to sign out? You will need to sign back in to access your saved analyses and career data.</p>
                <div class="logout-actions">
                    <button class="btn btn-sm" id="cancel-logout">Cancel</button>
                    <button class="btn btn-sm" id="confirm-logout-btn">Sign Out</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Add Listeners
    document.getElementById('cancel-logout').addEventListener('click', () => {
        document.getElementById('logout-confirm-modal').classList.remove('active');
    });

    document.querySelector('.logout-modal-overlay').addEventListener('click', () => {
        document.getElementById('logout-confirm-modal').classList.remove('active');
    });

    document.getElementById('confirm-logout-btn').addEventListener('click', async () => {
        try {
            await signOut(auth);
            showToast("Signed out successfully. See you soon!", "success");
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } catch (error) {
            console.error("Logout Error:", error);
            showToast("Error signing out. Please try again.", "error");
        }
    });
}

// Inject on load if not on auth page
if (!window.location.pathname.includes('auth.html')) {
    injectLogoutModal();
}

// Logout Helper (Triggered by Navbar)
window.handleLogout = () => {
    const modal = document.getElementById('logout-confirm-modal');
    if (modal) {
        modal.classList.add('active');
    } else {
        // Fallback if modal isn't injected
        signOut(auth).then(() => {
            window.location.href = 'index.html';
        });
    }
};
