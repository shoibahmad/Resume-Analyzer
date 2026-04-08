import { db, auth } from './firebase-config.js';
import { 
    collection, 
    addDoc, 
    query, 
    where, 
    getDocs, 
    orderBy, 
    limit,
    Timestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { populateDashboard, renderLineChart } from './ui.js';

/**
 * Saves a scan result to Firestore
 */
export async function saveScan(result) {
    const user = auth.currentUser;
    if (!user) return;

    try {
        await addDoc(collection(db, "users", user.uid, "scans"), {
            job_title: result.job_title || "Resume Analysis",
            match_score: result.match_score,
            ats_score: result.ats_score,
            missing_skills: result.missing_skills || [],
            result_data: JSON.stringify(result), // Store full JSON for retrieval
            timestamp: Timestamp.now()
        });
        console.log("Scan saved to history");
    } catch (e) {
        console.error("Error saving scan: ", e);
    }
}

/**
 * Fetches and displays scan history
 */
export async function loadHistory() {
    const user = auth.currentUser;
    if (!user) return;

    const container = document.getElementById('history-container');
    if (!container) return;

    try {
        const q = query(
            collection(db, "users", user.uid, "scans"), 
            orderBy("timestamp", "desc"),
            limit(10)
        );
        
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            container.innerHTML = '<div class="roadmap-placeholder">No scans found. Start your first analysis!</div>';
            return;
        }

        container.innerHTML = '';
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const date = data.timestamp.toDate().toLocaleDateString();

            // Fallback for older entries with "undefined" or missing titles
            let displayTitle = data.job_title;
            if (!displayTitle || displayTitle.includes('undefined')) {
                displayTitle = "Resume Analysis";
            }
            
            const item = document.createElement('div');
            item.className = 'card glass-panel history-item staggered-entry fade-in-up';
            item.innerHTML = `
                <div class="h-job-info">
                    <h4>${displayTitle}</h4>
                    <span>Analyzed on ${date}</span>
                </div>
                <div class="h-ats">
                    <span class="label" style="font-size: 0.7rem; font-weight: 800; color: var(--text-muted);">ATS</span>
                    <div style="font-weight: 700;">${data.ats_score}%</div>
                </div>
                <div class="h-score">${data.match_score}%</div>
                <button class="btn btn-outline btn-sm view-scan-btn" data-id="${doc.id}">View Analysis</button>
            `;
            
            // Attach view listener
            item.querySelector('.view-scan-btn').addEventListener('click', () => {
                const result = JSON.parse(data.result_data);
                
                // Switch to scan tab and show results
                document.querySelector('.nav-tab-btn[data-tab="new-scan"]').click();
                populateDashboard(result);
                
                // Scroll to top
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });

            container.appendChild(item);
        });

        updateAnalytics(querySnapshot.docs.map(d => d.data()));

    } catch (e) {
        console.error("Error loading history: ", e);
        container.innerHTML = '<p class="error-text">Failed to load history.</p>';
    }
}

/**
 * Updates analytics cards on the overview tab
 */
function updateAnalytics(scans) {
    if (scans.length === 0) return;

    const totalEl = document.getElementById('stat-total-scans');
    const avgEl = document.getElementById('stat-avg-score');
    const topGapEl = document.getElementById('stat-top-gap');

    if (!totalEl || !avgEl || !topGapEl) return;

    // 1. Total Scans
    totalEl.textContent = scans.length;

    // 2. Average Match Score
    const avg = Math.round(scans.reduce((acc, s) => acc + s.match_score, 0) / scans.length);
    avgEl.textContent = `${avg}%`;

    // 3. Top Skill Gap (Frequency analysis)
    const gapFreq = {};
    scans.forEach(s => {
        s.top_missing_skills.forEach(skill => {
            gapFreq[skill] = (gapFreq[skill] || 0) + 1;
        });
    });

    const topGap = Object.keys(gapFreq).reduce((a, b) => gapFreq[a] > gapFreq[b] ? a : b, "None");
    topGapEl.textContent = topGap !== "None" ? topGap : "N/A";

    // 4. Initialize History Chart
    renderLineChart(scans);
}

// Global Refresh Listener
window.addEventListener('refresh-dashboard', loadHistory);
