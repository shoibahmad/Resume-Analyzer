/**
 * Dashboard Controller — Dedicated dashboard page logic
 * Loads user stats, renders charts, populates history
 */
import { db, auth } from './firebase-config.js';
import {
    collection,
    query,
    where,
    getDocs,
    orderBy,
    limit,
    Timestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { updateStatCards, renderLineChart, renderDoughnutChart, renderHistory, updateAITip } from './ui.js';
import { initOnboarding } from './onboarding.js';
import { showToast } from './toast.js';

let lineChartInstance = null;
let doughnutChartInstance = null;

// Wait for auth state to load dashboard
onAuthStateChanged(auth, async (user) => {
    if (user) {
        document.getElementById('user-name').textContent = user.displayName || "User";
        const dashName = document.getElementById('dash-user-name');
        if (dashName) dashName.textContent = user.displayName || "User";
        await loadDashboardData(user.uid);
        initOnboarding(user);
    } else {
        window.location.href = 'auth.html';
    }
});

async function loadDashboardData(uid) {
    try {
        const q = query(
            collection(db, "users", uid, "scans"),
            orderBy("timestamp", "desc"),
            limit(20)
        );

        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            renderEmptyState();
            return;
        }

        const scans = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

        updateStatCards(scans);
        renderLineChart(scans);
        renderDoughnutChart(scans);
        renderHistory(scans.slice(0, 10));
        updateAITip(scans);
        
        // NEW Phase 2: Market Trends
        const allSkills = new Set();
        scans.forEach(s => (s.found_skills || []).forEach(sk => allSkills.add(sk)));
        if (allSkills.size > 0) {
            fetchMarketTrends(Array.from(allSkills).slice(0, 10));
        }

    } catch (e) {
        console.error("Error loading dashboard data:", e);
        showToast("Failed to load dashboard statistics.", "error");
    }
}

async function fetchMarketTrends(skills) {
    const section = document.getElementById('market-trends-section');
    if (!section) return;

    try {
        const response = await fetch('http://127.0.0.1:8000/api/market-trends', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ skills })
        });
        
        if (!response.ok) throw new Error("Trends API failed");
        const data = await response.json();
        
        section.style.display = 'grid';
        renderMarketTrendsChart(data);
    } catch (err) {
        console.error("Market trends error:", err);
        showToast("Market trends data is currently unavailable.", "info");
    }
}

let marketChartInstance = null;
function renderMarketTrendsChart(data) {
    const ctx = document.getElementById('market-trends-chart');
    const outlookContainer = document.getElementById('market-outlook-container');
    const summaryBadge = document.getElementById('market-summary-badge');
    
    if (!ctx) return;
    if (marketChartInstance) marketChartInstance.destroy();

    if (summaryBadge && data.summary) summaryBadge.textContent = data.summary;

    const labels = data.trends.map(t => t.skill);
    const demandValues = data.trends.map(t => t.demand);
    const backgroundColors = data.trends.map(t => 
        t.trend === 'rising' ? 'rgba(16, 185, 129, 0.6)' : 
        t.trend === 'declining' ? 'rgba(239, 68, 68, 0.6)' : 
        'rgba(79, 70, 229, 0.6)'
    );

    marketChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Market Demand',
                data: demandValues,
                backgroundColor: backgroundColors,
                borderRadius: 6,
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { beginAtZero: true, max: 100, ticks: { font: { family: 'Plus Jakarta Sans', weight: '600' } } },
                y: { ticks: { font: { family: 'Plus Jakarta Sans', weight: '700' } } }
            },
            plugins: {
                legend: { display: false },
                tooltip: { 
                    backgroundColor: '#fff', titleColor: '#1f2937', bodyColor: '#1f2937', 
                    borderColor: '#e2e8f0', borderWidth: 1, padding: 12,
                    titleFont: { family: 'Outfit', weight: '800' },
                    callbacks: {
                        afterLabel: (ctx) => {
                            const item = data.trends[ctx.dataIndex];
                            return `Outlook: ${item.outlook}`;
                        }
                    }
                }
            }
        }
    });

    // Outlook Cards
    if (outlookContainer) {
        outlookContainer.innerHTML = data.trends.slice(0, 4).map(t => `
            <div style="background: rgba(248, 250, 252, 0.8); padding: 1rem; border-radius: 12px; border: 1px solid #f1f5f9;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                    <span style="font-weight: 800; font-size: 0.85rem;">${t.skill}</span>
                    <span style="font-size: 0.65rem; font-weight: 800; text-transform: uppercase; color: ${t.trend === 'rising' ? '#10b981' : t.trend === 'declining' ? '#ef4444' : '#4f46e5'}">${t.trend}</span>
                </div>
                <p style="font-size: 0.75rem; color: var(--text-muted); line-height: 1.4;">${t.outlook}</p>
            </div>
        `).join('');
    }
}

function renderEmptyState() {
    const container = document.getElementById('dash-history-container');
    if (!container) return;
    container.innerHTML = `
        <div class="card glass-panel dash-empty-state">
            <div class="empty-icon">📄</div>
            <h3>No analyses yet</h3>
            <p>Start your first resume analysis to see results here.</p>
            <a href="analyzer.html" class="btn-new-scan" style="display: inline-flex; margin-top: 0.5rem;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                Start First Analysis
            </a>
        </div>
    `;
}
