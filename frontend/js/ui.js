/**
 * UI Controller module
 */
import { showToast } from './toast.js';

function normalizeScore(val) {
    if (val === null || val === undefined) return 0;
    const n = Number(val);
    if (isNaN(n)) return 0;
    if (n > 0 && n <= 1.0) return Math.round(n * 100);
    return Math.round(n);
}

export function showSection(sectionId) {
    const sections = ['section-upload', 'section-results', 'loading-overlay'];
    
    sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.classList.remove('active');
            el.classList.add('hidden');
        }
    });

    const targetEl = document.getElementById(sectionId);
    if (targetEl) {
        targetEl.classList.remove('hidden');
        setTimeout(() => targetEl.classList.add('active'), 10);
    }

    // Scroll Lock for Loading Overlay
    if (sectionId === 'loading-overlay') {
        document.body.classList.add('no-scroll');
    } else {
        document.body.classList.remove('no-scroll');
    }

    // Reset score animation if showing upload section
    if (sectionId === 'section-upload') {
        const scoreCircle = document.getElementById('score-path');
        const scoreText = document.getElementById('score-text');
        const atsCircle = document.getElementById('ats-circle-path');
        const atsText = document.getElementById('ats-text');
        
        if (scoreCircle) scoreCircle.setAttribute('stroke-dasharray', `0, 100`);
        if (scoreText) scoreText.textContent = '0%';
        if (atsCircle) atsCircle.setAttribute('stroke-dasharray', `0, 100`);
        if (atsText) atsText.textContent = '0%';
        
        // Reset loading bar and NLP bars
        if (document.getElementById('load-progress')) document.getElementById('load-progress').style.width = '0%';
        if (document.getElementById('verb-bar')) document.getElementById('verb-bar').style.width = '0%';
        if (document.getElementById('complexity-bar')) document.getElementById('complexity-bar').style.width = '0%';
        if (document.getElementById('verb-score-val')) document.getElementById('verb-score-val').textContent = '0%';
        if (document.getElementById('complexity-val')) document.getElementById('complexity-val').textContent = '0%';
    }

    if (sectionId === 'loading-overlay') {
        animateLoadingBar();
    }
}

function animateLoadingBar() {
    const bar = document.getElementById('load-progress');
    const stepText = document.getElementById('loading-step-text');
    if (!bar) return;

    const steps = [
        "Extracting semantic entities...",
        "Identifying missing skill gaps...",
        "Simulating ATS parsing...",
        "Generating professional rewrite...",
        "Calculating market salary data...",
        "Finalizing career roadmap..."
    ];

    let width = 0;
    let stepIdx = 0;
    const interval = setInterval(() => {
        if (width >= 90) {
            clearInterval(interval);
        } else {
            width += Math.random() * 5;
            bar.style.width = width + '%';
            
            // Cycle through steps
            if (width % 15 < 5 && stepIdx < steps.length - 1) {
                stepIdx++;
                if(stepText) stepText.textContent = steps[stepIdx];
            }
        }
    }, 300);
}

/**
 * Populates the V3 Dashboard with scan results
 */
export function populateDashboard(data) {
    console.log("Scan Data Received:", data);
    
    // 1. Set Main Job Match Score
    const scoreCircle = document.getElementById('score-path');
    const scoreText = document.getElementById('score-text');
    const scoreStatus = document.getElementById('score-status');
    const score = normalizeScore(data.match_score);
    
    setTimeout(() => { scoreCircle.setAttribute('stroke-dasharray', `${score}, 100`); }, 100);
    animateValue(scoreText, 0, score, 1500);

    if (score >= 80) {
        scoreCircle.style.stroke = 'var(--success-color)';
        scoreText.style.color = 'var(--success-color)';
        scoreStatus.textContent = 'Excellent Match';
        scoreStatus.style.color = 'var(--success-color)';
    } else if (score >= 60) {
        scoreCircle.style.stroke = 'var(--warning-color)';
        scoreText.style.color = 'var(--warning-color)';
        scoreStatus.textContent = 'Good Match';
        scoreStatus.style.color = 'var(--warning-color)';
    } else {
        scoreCircle.style.stroke = 'var(--error-color)';
        scoreText.style.color = 'var(--error-color)';
        scoreStatus.textContent = 'Poor Match';
        scoreStatus.style.color = 'var(--error-color)';
    }

    // 2. Set Secondary ATS Readability Score
    const atsCircle = document.getElementById('ats-circle-path');
    const atsText = document.getElementById('ats-text');
    const atsScore = normalizeScore(data.ats_score);
    setTimeout(() => { if (atsCircle) atsCircle.setAttribute('stroke-dasharray', `${atsScore}, 100`); }, 300);
    if (atsText) animateValue(atsText, 0, atsScore, 1500);

    // 3. Populate Experience Match
    const expEl = document.getElementById('experience-match-text');
    if (expEl) expEl.textContent = data.experience_match || "N/A";

    // 4. Populate Skills Matrix
    populateSkills('matched-skills-container', data.found_skills);
    populateSkills('missing-skills-container', data.missing_skills);

    // 5. Populate SWOT (Strengths & Weaknesses)
    populateList('strengths-list', data.strengths);
    populateList('weaknesses-list', data.weaknesses);

    // 6. Set Recommendations
    document.getElementById('recommendations-text').textContent = data.recommendations || "No recommendations provided.";

    // 7. Populate Interview Questions
    populateList('interview-list', data.interview_questions);

    // 8. Populate Salary Insights
    const salaryRange = document.getElementById('salary-range-text');
    if (salaryRange) {
        salaryRange.textContent = data.salary_estimate || "Salary range unavailable";
    }
    populateList('negotiation-tips-list', data.negotiation_tips);

    // 9. Populate AI Resume Fixer
    const optimizedSummary = document.getElementById('optimized-summary-text');
    if (optimizedSummary) {
        optimizedSummary.textContent = data.optimized_summary || "AI was unable to generate a summary at this time.";
    }

    // 10. Populate NLP Insights
    const verbBar = document.getElementById('verb-bar');
    const verbText = document.getElementById('verb-score-val');
    const compBar = document.getElementById('complexity-bar');
    const compText = document.getElementById('complexity-val');
    
    if (verbBar) {
        const vScore = normalizeScore(data.verb_strength);
        verbBar.style.width = vScore + '%';
        verbText.textContent = vScore + '%';
    }
    if (compBar) {
        const cScore = normalizeScore(data.complexity_score);
        compBar.style.width = cScore + '%';
        compText.textContent = cScore + '%';
    }

    document.getElementById('tone-text').textContent = data.tone_analysis || "N/A";
    populateSkills('themes-container', data.keyword_themes);

    // 11. Populate Learning Roadmap
    populateRoadmap(data.learning_roadmap);

    // 12. Initialize Radar Chart
    if (data.radar_data) {
        initRadarChart(data.radar_data);
    }

    // 13. Populate Visual Feedback (Vision)
    if (data.visual_feedback) {
        populateVisualFeedback(data.visual_feedback);
    }

    // 14. Populate Tone Rewriter
    if (data.tone_rewriter) {
        renderToneRewriter(data.tone_rewriter);
    }

    // 15. Populate Keyword Heatmap
    if (data.keyword_heatmap) {
        renderKeywordHeatmap(data.keyword_heatmap);
    }

    // 16. Populate Role Fit Predictor
    if (data.role_fit_predictor) {
        renderRoleFit(data.role_fit_predictor);
    }

    // 17. Populate Culture Fit
    if (data.culture_fit) {
        renderCultureFit(data.culture_fit);
    }

    // 18. Populate Resume Age
    if (data.resume_age) {
        renderResumeAge(data.resume_age);
    }

    // 19. Populate Career Blueprint (V4)
    if (data.career_progression) {
        renderCareerBlueprint(data.career_progression);
    } else {
        const blueprintCard = document.getElementById('career-blueprint-card');
        if (blueprintCard) blueprintCard.style.display = 'none';
    }

    // Initialize Copy Button
    setupCopyButton(data.optimized_summary);
}

export function populateVisualFeedback(visualData) {
    const card = document.getElementById('shadow-recruiter-card');
    if (!card) return;

    // Show the card
    card.style.display = 'block';

    // Update Design Score Gauge
    const scoreValEl = document.getElementById('visual-score-val');
    const scorePathEl = document.getElementById('visual-score-path');
    const score = normalizeScore(visualData.score);

    if (scoreValEl && scorePathEl) {
        animateValue(scoreValEl, 0, score, 2000);
        scorePathEl.style.strokeDasharray = `${score}, 100`;
        
        // Dynamic coloring for the gauge
        if (score >= 85) scorePathEl.style.stroke = '#10b981'; // Green
        else if (score >= 70) scorePathEl.style.stroke = 'var(--indigo-primary)'; // Indigo
        else scorePathEl.style.stroke = '#f59e0b'; // Amber
    }

    // Update Text Content
    document.getElementById('visual-hierarchy-text').textContent = visualData.hierarchy || "N/A";
    document.getElementById('visual-typography-text').textContent = visualData.typography || "N/A";
    document.getElementById('visual-whitespace-text').textContent = visualData.white_space || "N/A";
    document.getElementById('visual-scanability-text').textContent = visualData.scanability || "N/A";
    
    // Update Scanability Badge
    const badge = document.getElementById('visual-scanability-badge');
    if (badge) {
        const val = (visualData.scanability || "").toLowerCase();
        if (val.includes('excellent')) {
            badge.textContent = 'Excellent';
            badge.style.background = '#dcfce7';
            badge.style.color = '#15803d';
        } else if (val.includes('good')) {
            badge.textContent = 'Good';
            badge.style.background = '#eff6ff';
            badge.style.color = '#1d4ed8';
        } else {
            badge.textContent = 'Needs Work';
            badge.style.background = '#fef2f2';
            badge.style.color = '#b91c1c';
        }
    }
}

function populateRoadmap(roadmap) {
    const container = document.getElementById('roadmap-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!roadmap || roadmap.length === 0) {
        container.innerHTML = '<div class="roadmap-placeholder">No roadmap needed for the identified skills.</div>';
        return;
    }

    roadmap.forEach(path => {
        const card = document.createElement('div');
        card.className = 'roadmap-card glass-panel';
        
        const stepsHtml = path.steps.map(step => `<li>${step}</li>`).join('');
        
        card.innerHTML = `
            <div>
                <div class="skill-title">${path.skill_name}</div>
                <ul class="roadmap-steps">
                    ${stepsHtml}
                </ul>
            </div>
            <div class="roadmap-info">
                <div>
                    <span class="label">EST. TIME</span>
                    <span class="val">${path.time_estimate}</span>
                </div>
                <div>
                    <span class="label">PROJECT IDEA</span>
                    <span class="val">${path.project_idea}</span>
                </div>
                <div style="grid-column: span 2;">
                    <span class="label">RESOURCES</span>
                    <a href="${path.doc_link}" target="_blank" class="val">Official Documentation →</a>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

// Global variable to keep track of chart instances for cleanup
let radarChartInstance = null;
let historyChartInstance = null;

// initHistoryChart was replaced by renderLineChart below

export function initRadarChart(radarData) {
    const ctx = document.getElementById('skills-radar-chart');
    if (!ctx) return;

    // Cleanup existing chart if any
    if (radarChartInstance) {
        radarChartInstance.destroy();
    }

    const config = {
        type: 'radar',
        data: {
            labels: radarData.labels,
            datasets: [
                {
                    label: 'Your Profile',
                    data: (radarData.user_scores || []).map(s => normalizeScore(s)),
                    fill: true,
                    backgroundColor: 'rgba(79, 70, 229, 0.4)',
                    borderColor: 'rgba(79, 70, 229, 0.8)',
                    pointBackgroundColor: 'rgba(79, 70, 229, 1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(79, 70, 229, 1)',
                    borderWidth: 2
                },
                {
                    label: 'Job Requirements',
                    data: (radarData.required_scores || []).map(s => normalizeScore(s)),
                    fill: true,
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    borderColor: 'rgba(16, 185, 129, 0.6)',
                    pointBackgroundColor: 'rgba(16, 185, 129, 1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(16, 185, 129, 1)',
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    angleLines: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    suggestedMin: 0,
                    suggestedMax: 100,
                    ticks: {
                        display: false,
                        stepSize: 20
                    },
                    pointLabels: {
                        font: {
                            family: 'Outfit',
                            size: 11,
                            weight: '700'
                        },
                        color: '#6b7280'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false // We use our own custom legend for better design control
                }
            }
        }
    };

    radarChartInstance = new Chart(ctx, config);
}

export function setupCopyButton(text) {
    const btn = document.getElementById('copy-summary-btn');
    if (!btn) return;

    btn.onclick = async () => {
        if (!text) return;
        try {
            await navigator.clipboard.writeText(text);
            const originalText = btn.innerHTML;
            btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg> Copied!';
            btn.classList.add('btn-success');
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.classList.remove('btn-success');
            }, 2000);
        } catch (err) {
            console.error('Failed to copy: ', err);
            showToast('Could not copy text automatically.', 'error');
        }
    };
}

export function populateList(containerId, items) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    if (!items || items.length === 0) {
        container.innerHTML = '<li class="text-sm text-muted">None highlighted</li>';
        return;
    }

    items.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        container.appendChild(li);
    });
}

export function populateSkills(containerId, skills) {
    const container = document.getElementById(containerId);
    container.innerHTML = ''; 
    
    if (!skills || skills.length === 0) {
        container.innerHTML = '<span class="text-sm text-muted">None found</span>';
        return;
    }

    skills.forEach(skill => {
        const badge = document.createElement('div');
        badge.className = 'skill-badge';
        badge.textContent = skill;
        container.appendChild(badge);
    });
}

// --- NEW: Tone & Sentiment Rewriter ---
export function renderToneRewriter(data) {
    const card = document.getElementById('tone-rewriter-card');
    const container = document.getElementById('tone-rewriter-container');
    const badge = document.getElementById('tone-applied-badge');
    if (!card || !container) return;

    card.style.display = 'block';
    if (badge) badge.textContent = data.tone_applied || 'Optimized';

    container.innerHTML = '';
    const originals = data.original_bullets || [];
    const rewritten = data.rewritten_bullets || [];

    originals.forEach((orig, i) => {
        const pair = document.createElement('div');
        pair.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; padding: 1rem; background: #f8fafc; border-radius: 12px; border: 1px solid #f1f5f9;';
        pair.innerHTML = `
            <div>
                <span style="display: block; font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #ef4444; margin-bottom: 0.5rem;">✗ BEFORE</span>
                <p style="font-size: 0.88rem; color: var(--text-muted); line-height: 1.5; text-decoration: line-through; opacity: 0.7;">${orig}</p>
            </div>
            <div>
                <span style="display: block; font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #10b981; margin-bottom: 0.5rem;">✓ AFTER</span>
                <p style="font-size: 0.88rem; color: var(--text-main); line-height: 1.5; font-weight: 600;">${rewritten[i] || ''}</p>
            </div>
        `;
        container.appendChild(pair);
    });
}

// --- NEW: Keyword Density Heatmap ---
export function renderKeywordHeatmap(data) {
    const card = document.getElementById('keyword-heatmap-card');
    const container = document.getElementById('heatmap-container');
    if (!card || !container || !data || data.length === 0) return;

    card.style.display = 'block';
    container.innerHTML = '';

    data.forEach(item => {
        const color = item.status === 'strong' ? '#10b981' : item.status === 'moderate' ? '#f59e0b' : '#ef4444';
        const bgColor = item.status === 'strong' ? 'rgba(16,185,129,0.08)' : item.status === 'moderate' ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.08)';
        const row = document.createElement('div');
        row.innerHTML = `
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.4rem;">
                <span style="font-size: 0.85rem; font-weight: 700;">${item.section}</span>
                <span style="font-size: 0.8rem; font-weight: 800; color: ${color}; background: ${bgColor}; padding: 1px 8px; border-radius: 10px; text-transform: uppercase;">${item.status}</span>
            </div>
            <div style="height: 8px; background: #f1f5f9; border-radius: 4px; overflow: hidden;">
                <div style="height: 100%; width: 0%; background: ${color}; border-radius: 4px; transition: width 1.2s ease;" data-target-width="${normalizeScore(item.density)}%"></div>
            </div>
        `;
        container.appendChild(row);

        // Animate bar
        setTimeout(() => {
            row.querySelector('[data-target-width]').style.width = normalizeScore(item.density) + '%';
        }, 100);
    });
}

// --- NEW: Role Fit Predictor ---
export function renderRoleFit(data) {
    const card = document.getElementById('role-fit-card');
    const container = document.getElementById('role-fit-container');
    if (!card || !container || !data || data.length === 0) return;

    card.style.display = 'block';
    container.innerHTML = '';

    const sorted = [...data].sort((a, b) => b.fit_score - a.fit_score);
    sorted.forEach((role, i) => {
        const color = role.fit_score >= 80 ? '#10b981' : role.fit_score >= 60 ? '#f59e0b' : '#ef4444';
        const item = document.createElement('div');
        item.style.cssText = 'display: flex; align-items: center; gap: 1rem; padding: 1rem 1.25rem; background: #f8fafc; border-radius: 12px; border: 1px solid #f1f5f9; transition: all 0.3s ease;';
        const nScore = normalizeScore(role.fit_score);
        item.innerHTML = `
            <div style="width: 44px; height: 44px; border-radius: 50%; background: ${color}15; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                <span style="font-weight: 800; font-family: Outfit; font-size: 0.95rem; color: ${color};">${nScore}%</span>
            </div>
            <div style="flex: 1;">
                <div style="font-weight: 700; font-size: 0.95rem; margin-bottom: 0.15rem;">${role.role}</div>
                <div style="font-size: 0.8rem; color: var(--text-muted); line-height: 1.4;">${role.reason || ''}</div>
            </div>
            ${i === 0 ? '<span style="font-size: 0.65rem; font-weight: 800; padding: 2px 8px; border-radius: 10px; background: rgba(16,185,129,0.08); color: #10b981;">BEST FIT</span>' : ''}
        `;
        container.appendChild(item);
    });
}

// --- NEW: Culture Fit Analysis ---
export function renderCultureFit(data) {
    const card = document.getElementById('culture-fit-card');
    const bars = document.getElementById('culture-fit-bars');
    const assessmentEl = document.getElementById('culture-fit-assessment');
    if (!card || !bars) return;

    card.style.display = 'block';
    bars.innerHTML = '';

    const dimensions = [
        { key: 'collaboration', label: 'Collaboration', color: '#4f46e5' },
        { key: 'innovation', label: 'Innovation', color: '#7c3aed' },
        { key: 'leadership', label: 'Leadership', color: '#ec4899' },
        { key: 'adaptability', label: 'Adaptability', color: '#f59e0b' },
        { key: 'detail_orientation', label: 'Detail Orientation', color: '#10b981' }
    ];

    dimensions.forEach(dim => {
        const val = normalizeScore(data[dim.key]);
        const row = document.createElement('div');
        row.innerHTML = `
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.35rem;">
                <span style="font-size: 0.82rem; font-weight: 700;">${dim.label}</span>
                <span style="font-size: 0.82rem; font-weight: 800; color: ${dim.color};">${val}%</span>
            </div>
            <div style="height: 6px; background: #f1f5f9; border-radius: 3px; overflow: hidden;">
                <div style="height: 100%; width: 0%; background: ${dim.color}; border-radius: 3px; transition: width 1.2s ease;" data-target-width="${val}%"></div>
            </div>
        `;
        bars.appendChild(row);
        setTimeout(() => {
            row.querySelector('[data-target-width]').style.width = val + '%';
        }, 150);
    });

    if (assessmentEl) assessmentEl.textContent = data.assessment || '';
}

// --- NEW: Resume Age Detector ---
export function renderResumeAge(data) {
    const card = document.getElementById('resume-age-card');
    const container = document.getElementById('resume-age-outdated');
    const verdict = document.getElementById('resume-age-verdict');
    const badge = document.getElementById('freshness-badge');
    if (!card || !container) return;

    card.style.display = 'block';

    // Freshness badge
    const score = normalizeScore(data.freshness_score);
    if (badge) {
        if (score >= 80) {
            badge.textContent = 'Modern ✓';
            badge.style.background = '#dcfce7'; badge.style.color = '#15803d';
        } else if (score >= 50) {
            badge.textContent = 'Aging';
            badge.style.background = '#fef9c3'; badge.style.color = '#a16207';
        } else {
            badge.textContent = 'Outdated ✗';
            badge.style.background = '#fef2f2'; badge.style.color = '#b91c1c';
        }
    }

    container.innerHTML = '';
    const allItems = [
        ...(data.outdated_items || []).map(i => ({ text: i, type: 'tech' })),
        ...(data.stale_certs || []).map(i => ({ text: i, type: 'cert' })),
        ...(data.old_formatting || []).map(i => ({ text: i, type: 'format' }))
    ];

    if (allItems.length === 0) {
        container.innerHTML = '<p style="color: #10b981; font-weight: 700; font-size: 0.9rem;">🎉 No outdated items detected — your resume is modern!</p>';
    } else {
        allItems.forEach(item => {
            const tagColor = item.type === 'tech' ? '#ef4444' : item.type === 'cert' ? '#f59e0b' : '#6366f1';
            const tagLabel = item.type === 'tech' ? 'TECH' : item.type === 'cert' ? 'CERT' : 'FORMAT';
            const el = document.createElement('div');
            el.style.cssText = 'display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; background: #f8fafc; border-radius: 10px; border: 1px solid #f1f5f9;';
            el.innerHTML = `
                <span style="font-size: 0.6rem; font-weight: 800; padding: 2px 6px; border-radius: 6px; background: ${tagColor}12; color: ${tagColor}; text-transform: uppercase; flex-shrink: 0;">${tagLabel}</span>
                <span style="font-size: 0.88rem; font-weight: 600; color: var(--text-muted);">${item.text}</span>
            `;
            container.appendChild(el);
        });
    }

    if (verdict) verdict.textContent = data.verdict || '';
}

// --- NEW: Career Blueprint (V4 Forecast) ---
export function renderCareerBlueprint(data) {
    const card = document.getElementById('career-blueprint-card');
    const container = document.getElementById('career-timeline-container');
    if (!card || !container) return;

    // Show the card if we have data
    const stages = data.stages || data.paths?.[0]?.stages || [];
    if (stages.length === 0) {
        card.style.display = 'none';
        return;
    }

    card.style.display = 'block';
    container.innerHTML = '';

    stages.forEach((stage, i) => {
        const step = document.createElement('div');
        step.className = 'timeline-step staggered-entry fade-in-up';
        step.style.setProperty('--delay', (i * 0.1) + 's');

        const skillsHtml = (stage.skills_needed || []).map(skill => 
            `<span class="step-skill-tag">${skill}</span>`
        ).join('');

        step.innerHTML = `
            <div class="step-time">${stage.years_from_now || 0} YEARS FROM NOW</div>
            <div class="step-role">${stage.role}</div>
            <div style="font-size: 0.85rem; color: #10b981; font-weight: 800; margin-bottom: 0.75rem;">
                Target Salary: ${stage.salary_range || 'Market Rate'}
            </div>
            <div class="step-skills">
                <span style="font-size: 0.65rem; font-weight: 800; color: var(--text-muted); margin-right: 0.5rem; align-self: center;">SKILLS TO BUILD:</span>
                ${skillsHtml}
            </div>
        `;
        container.appendChild(step);
    });
}

export function animateValue(obj, start, end, duration) {
    if (!obj) return;
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.textContent = Math.floor(progress * (end - start) + start) + '%';
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

export function updateFileDisplay(file) {
    const fileDisplay = document.getElementById('file-name-display');
    const fileNameText = document.getElementById('file-name-text');
    if (file) {
        fileNameText.textContent = file.name;
        fileDisplay.classList.remove('hidden');
    } else {
        fileDisplay.classList.add('hidden');
    }
}

// --- Dashboard Specific UI Functions ---

export function updateStatCards(scans) {
    if (!scans || scans.length === 0) return;

    const total = scans.length;
    const avg = Math.round(scans.reduce((acc, s) => acc + (s.match_score || 0), 0) / total);
    const best = Math.max(...scans.map(s => s.match_score || 0));
    
    // Find most frequent missing skill
    const gaps = {};
    scans.forEach(s => {
        const skillsGaps = s.missing_skills || s.top_missing_skills || [];
        skillsGaps.forEach(sk => {
            gaps[sk] = (gaps[sk] || 0) + 1;
        });
    });
    const topGap = Object.keys(gaps).sort((a, b) => gaps[b] - gaps[a])[0] || "None";

    if (document.getElementById('dash-total-scans')) document.getElementById('dash-total-scans').textContent = total;
    if (document.getElementById('dash-avg-score')) document.getElementById('dash-avg-score').textContent = avg + "%";
    if (document.getElementById('dash-best-score')) document.getElementById('dash-best-score').textContent = best + "%";
    if (document.getElementById('dash-top-gap')) document.getElementById('dash-top-gap').textContent = topGap;
}

export function renderLineChart(scans) {
    // This targets 'dash-line-chart' in dashboard.html and 'history-line-chart' in results
    const canvasId = document.getElementById('dash-line-chart') ? 'dash-line-chart' : 'history-line-chart';
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    if (historyChartInstance) historyChartInstance.destroy();

    const data = [...scans].reverse();
    const labels = data.map(s => s.timestamp?.toDate ? s.timestamp.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '');
    
    historyChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Match Score',
                    data: data.map(s => s.match_score),
                    borderColor: '#4f46e5',
                    backgroundColor: 'rgba(79, 70, 229, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'ATS Score',
                    data: data.map(s => s.ats_score),
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, max: 100, ticks: { font: { family: 'Plus Jakarta Sans', weight: '600' } } },
                x: { grid: { display: false }, ticks: { font: { family: 'Plus Jakarta Sans', weight: '600' } } }
            }
        }
    });
}

export function renderDoughnutChart(scans) {
    const ctx = document.getElementById('dash-doughnut-chart');
    if (!ctx) return;

    if (radarChartInstance) radarChartInstance.destroy();

    const gaps = {};
    scans.forEach(s => {
        const skillsGaps = s.missing_skills || s.top_missing_skills || [];
        skillsGaps.forEach(sk => {
            gaps[sk] = (gaps[sk] || 0) + 1;
        });
    });

    const sortedGaps = Object.entries(gaps)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    radarChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: sortedGaps.map(g => g[0]),
            datasets: [{
                data: sortedGaps.map(g => g[1]),
                backgroundColor: ['#4f46e5', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: { legend: { display: false } }
        }
    });

    // Populate legend list
    const list = document.getElementById('dash-skill-gap-list');
    if (list) {
        list.innerHTML = sortedGaps.map((g, i) => `
            <li class="skill-gap-item">
                <span class="skill-name">
                    <span class="skill-dot" style="background: ${['#4f46e5', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'][i]}"></span>
                    ${g[0]}
                </span>
                <span class="skill-count">${g[1]} analyses</span>
            </li>
        `).join('');
    }
}

export function renderHistory(scans) {
    const container = document.getElementById('dash-history-container');
    if (!container) return;

    container.innerHTML = scans.map(s => {
        const dateStr = s.timestamp?.toDate ? s.timestamp.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent';
        const scoreClass = s.match_score >= 80 ? 'high' : s.match_score >= 60 ? 'medium' : 'low';
        
        return `
            <div class="card glass-panel dash-history-item" onclick="viewScan('${s.id}')">
                <div class="dash-h-info">
                    <h4>${s.job_title || 'Untitled Scan'}</h4>
                    <span>${dateStr}</span>
                </div>
                <div class="dash-h-ats">
                    <span class="label">ATS Readability</span>
                    <span class="val">${s.ats_score}%</span>
                </div>
                <div class="dash-h-score ${scoreClass}">
                    ${s.match_score}%
                </div>
                <div class="dash-h-arrow">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </div>
            </div>
        `;
    }).join('');

    // Add global viewScan function if not exists
    window.viewScan = (id) => {
        const scan = scans.find(s => s.id === id);
        if (scan && scan.result_data) {
            try {
                // Parse the full result data stored as a JSON string
                const result = JSON.parse(scan.result_data);
                sessionStorage.setItem('viewScanData', JSON.stringify(result));
                window.location.href = `analyzer.html?view=history&id=${id}`;
            } catch (e) {
                console.error("Failed to parse historical scan data:", e);
                showToast("Could not load that scan result.", "error");
            }
        }
    };
}

export function updateAITip(scans) {
    const tipEl = document.getElementById('dash-ai-tip');
    if (!tipEl || scans.length === 0) return;

    const avg = scans.reduce((acc, s) => acc + (s.match_score || 0), 0) / scans.length;
    let tip = "";

    if (avg >= 80) tip = "Excellent work! Your profiles consistently match target roles. Focus on networking and interview prep.";
    else if (avg >= 60) tip = "Good progress. To hit the 80%+ 'Interview Red Zone', try quantifying more of your achievements with metrics.";
    else tip = "You're building momentum. Your common skill gaps suggest focusing on technical certifications to boost your baseline scores.";

    tipEl.innerHTML = tip;
}
