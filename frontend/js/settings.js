/**
 * Settings Module
 * Handles profile updates, data export, and account deletion
 */
import { auth, db } from './firebase-config.js';
import { showToast } from './toast.js';
import { 
    onAuthStateChanged, 
    updateProfile, 
    sendPasswordResetEmail,
    reauthenticateWithCredential,
    EmailAuthProvider,
    deleteUser
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc, setDoc, collection, query, getDocs, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let currentUser = null;

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        document.getElementById('user-name').textContent = user.displayName || "User";
        loadProfileData(user);
    } else {
        window.location.href = 'auth.html';
    }
});

// --- Tab Switching ---
const tabs = document.querySelectorAll('.side-nav-item');
const sections = document.querySelectorAll('.settings-section');

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const target = tab.dataset.tab;
        tabs.forEach(t => t.classList.remove('active'));
        sections.forEach(s => s.classList.remove('active'));
        
        tab.classList.add('active');
        document.getElementById(`tab-${target}`).classList.add('active');
    });
});

// --- Profile Management ---
async function loadProfileData(user) {
    document.getElementById('set-name').value = user.displayName || "";
    document.getElementById('set-email').value = user.email || "";
    
    const recoveryEmail = document.getElementById('display-email-recovery');
    if (recoveryEmail) recoveryEmail.textContent = user.email || "your email";

    try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            document.getElementById('set-role').value = data.targetRole || "";
            document.getElementById('set-industry').value = data.preferredIndustry || "";
        }
    } catch (e) {
        console.error("Error loading profile:", e);
    }
}

document.getElementById('profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const newName = document.getElementById('set-name').value;
    const newRole = document.getElementById('set-role').value;
    const newIndustry = document.getElementById('set-industry').value;

    try {
        // Update Firebase Auth Profile
        await updateProfile(currentUser, { displayName: newName });
        await currentUser.reload(); // Force refresh local user object
        
        // Update Firestore
        await setDoc(doc(db, "users", currentUser.uid), {
            displayName: newName,
            targetRole: newRole,
            preferredIndustry: newIndustry,
            updatedAt: new Date()
        }, { merge: true });

        // Update UI immediately in case the reload is slow
        document.getElementById('user-name').textContent = newName || "User";

        showToast("Profile updated successfully!", "success");
        setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
        console.error("Update failed:", error);
        showToast("Failed to update profile: " + error.message, "error");
    }
});

// --- Password Reset ---
document.getElementById('reset-pwd-btn').addEventListener('click', async () => {
    try {
        await sendPasswordResetEmail(auth, currentUser.email);
        showToast(`Reset email sent to ${currentUser.email}`, "success");
    } catch (e) {
        showToast("Failed to send reset email.", "error");
    }
});

// --- Data Export (GDPR) ---
document.getElementById('export-json-btn').addEventListener('click', () => exportData('json'));
document.getElementById('export-csv-btn').addEventListener('click', () => exportData('csv'));

async function exportData(format) {
    try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        const scansSnap = await getDocs(collection(db, "users", currentUser.uid, "scans"));
        
        const exportData = {
            profile: userDoc.exists() ? userDoc.data() : {},
            history: scansSnap.docs.map(d => ({ id: d.id, ...d.data() }))
        };

        if (format === 'json') {
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            downloadFile(blob, `resumind-data-${currentUser.uid}.json`);
        } else {
            // Simple CSV conversion for history
            const headers = ['job_title', 'match_score', 'ats_score', 'timestamp'];
            const rows = exportData.history.map(h => [
                h.job_title, h.match_score, h.ats_score, h.timestamp?.toDate().toISOString() || ''
            ].join(','));
            const csvContent = [headers.join(','), ...rows].join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv' });
            downloadFile(blob, `resumind-history-${currentUser.uid}.csv`);
        }
    } catch (e) {
        showToast("Export failed.", "error");
    }
}

function downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

// --- Account Deletion ---
const reauthModal = document.getElementById('reauth-modal');
document.getElementById('delete-account-btn').addEventListener('click', () => {
    reauthModal.classList.remove('hidden');
});

document.getElementById('cancel-reauth').addEventListener('click', () => {
    reauthModal.classList.add('hidden');
});

document.getElementById('confirm-delete').addEventListener('click', async () => {
    const password = document.getElementById('reauth-password').value;
    if (!password) return showToast("Password required", "warning");

    try {
        const credential = EmailAuthProvider.credential(currentUser.email, password);
        await reauthenticateWithCredential(currentUser, credential);
        
        // Delete Firestore Data
        // Note: For deep deletion of subcollections in production, use a Cloud Function.
        // Here we attempt to delete the user doc.
        await deleteDoc(doc(db, "users", currentUser.uid));
        
        // Delete Auth User
        await deleteUser(currentUser);
        
        showToast("Account deleted successfully.", "success");
        setTimeout(() => window.location.href = 'index.html', 2000);
    } catch (e) {
        console.error(e);
        showToast("Deletion failed. Please verify your password.", "error");
    }
});
