/**
 * Career Path Module
 * Fetches trajectories based on user skills from Firestore
 */
import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { collection, query, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const API_BASE_URL = 'http://127.0.0.1:8000';

onAuthStateChanged(auth, async (user) => {
    if (user) {
        document.getElementById('user-name').textContent = user.displayName || "User";
        await initCareerPath(user.uid);
    } else {
        window.location.href = 'auth.html';
    }
});

async function initCareerPath(uid) {
    try {
        // 1. Get user's latest skills from history
        const q = query(
            collection(db, "users", uid, "scans"),
            orderBy("timestamp", "desc"),
            limit(1)
        );
        const snapshot = await getDocs(q);
        
        let skills = [];
        let currentRole = "Professional";

        if (!snapshot.empty) {
            const latestScan = snapshot.docs[0].data();
            skills = latestScan.found_skills || [];
            currentRole = latestScan.job_title || "Professional";
        }

        // 2. Fetch career trajectories from API
        const response = await fetch(`${API_BASE_URL}/api/career-path`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ skills, current_role: currentRole })
        });

        if (!response.ok) throw new Error("API failed");
        const data = await response.json();

        renderPaths(data);
    } catch (error) {
        console.error("Career path error:", error);
        document.getElementById('loading-overlay').innerHTML = `
            <div style="color: #ef4444; padding: 2rem;">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom:1rem;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <h3>Failed to generate paths</h3>
                <p>Please try again later. Ensure you have at least one scan in your history.</p>
            </div>
        `;
    }
}

function renderPaths(data) {
    const container = document.getElementById('paths-container');
    const loading = document.getElementById('loading-overlay');
    const adviceSection = document.getElementById('advice-section');
    const adviceText = document.getElementById('advice-text');

    loading.style.display = 'none';
    container.style.display = 'grid';
    container.innerHTML = '';

    if (data.advice) {
        adviceSection.style.display = 'block';
        adviceText.textContent = data.advice;
    }

    data.paths.forEach((path, idx) => {
        const card = document.createElement('div');
        card.className = 'card glass-panel path-card staggered-entry fade-in-up';
        card.style.borderTopColor = path.color || '#4f46e5';
        card.style.animationDelay = `${idx * 0.1}s`;

        let timelineHtml = path.stages.map(stage => `
            <div class="timeline-node">
                <div class="node-dot" style="border-color: ${path.color}"></div>
                <div class="node-content">
                    <span class="node-time">${stage.years_from_now === 0 ? 'Current' : stage.years_from_now + ' Years'}</span>
                    <div class="node-title">${stage.role}</div>
                    <div class="node-skills">
                        ${stage.skills_needed.map(s => `<span class="skill-tag">${s}</span>`).join('')}
                    </div>
                    <div class="salary-badge">${stage.salary_range}</div>
                </div>
            </div>
        `).join('');

        card.innerHTML = `
            <h3 class="path-title" style="color: ${path.color}">${path.path_name}</h3>
            <div class="timeline">${timelineHtml}</div>
        `;
        container.appendChild(card);
    });
}
