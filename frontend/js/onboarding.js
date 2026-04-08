/**
 * Onboarding Wizard Module
 * Guides new users through the platform features
 */
import { auth, db } from './firebase-config.js';
import { showToast } from './toast.js';
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const steps = [
    {
        icon: '✨',
        title: 'Welcome to ResuMind',
        desc: "We've upgraded your career journey with Advanced AI. Let's show you what's new."
    },
    {
        icon: '🔍',
        title: 'Deep AI Analysis',
        desc: "Our new 'Shadow Recruiter' audits your resume's visual design, tone, and keyword density in real-time."
    },
    {
        icon: '🚀',
        title: 'Career Intelligence',
        desc: "Visualize your 10-year career trajectory and stay ahead with live market demand trends for your skills."
    },
    {
        icon: '🛡️',
        title: 'Privacy First',
        desc: "You have full control. Export your data or manage your profile anytime from the new Settings page."
    }
];

let currentStep = 0;

export async function initOnboarding(user) {
    if (!user) return;

    try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userData = userDoc.data();

        if (userData && userData.onboardingComplete) {
            console.log("Onboarding already completed");
            return;
        }

        renderOnboardingUI();
    } catch (e) {
        console.error("Onboarding init error:", e);
    }
}

function renderOnboardingUI() {
    const overlay = document.createElement('div');
    overlay.className = 'onboarding-overlay';
    overlay.id = 'onboarding-wizard';
    
    overlay.innerHTML = `
        <div class="onboarding-card">
            <div class="onboarding-bg-pattern"></div>
            <div id="onboarding-steps-container">
                ${steps.map((step, i) => `
                    <div class="onboarding-step ${i === 0 ? 'active' : ''}" data-step="${i}">
                        <div class="onboarding-icon">${step.icon}</div>
                        <h2 class="onboarding-title">${step.title}</h2>
                        <p class="onboarding-desc">${step.desc}</p>
                    </div>
                `).join('')}
            </div>
            <div class="onboarding-footer">
                <div class="step-dots">
                    ${steps.map((_, i) => `<div class="dot ${i === 0 ? 'active' : ''}" data-dot="${i}"></div>`).join('')}
                </div>
                <button class="btn btn-indigo" id="next-onboarding-btn">Next Step</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
    
    // Add CSS ref if not present
    if (!document.querySelector('link[href*="onboarding.css"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'css/onboarding.css';
        document.head.appendChild(link);
    }

    setTimeout(() => overlay.classList.add('active'), 100);

    const nextBtn = document.getElementById('next-onboarding-btn');
    nextBtn.addEventListener('click', handleNext);
}

async function handleNext() {
    if (currentStep < steps.length - 1) {
        currentStep++;
        updateStepUI();
    } else {
        await completeOnboarding();
    }
}

function updateStepUI() {
    const stepsEls = document.querySelectorAll('.onboarding-step');
    const dotsEls = document.querySelectorAll('.dot');
    const nextBtn = document.getElementById('next-onboarding-btn');

    stepsEls.forEach(el => el.classList.remove('active'));
    dotsEls.forEach(el => el.classList.remove('active'));

    stepsEls[currentStep].classList.add('active');
    dotsEls[currentStep].classList.add('active');

    if (currentStep === steps.length - 1) {
        nextBtn.textContent = "Start Building Future";
    }
}

async function completeOnboarding() {
    const overlay = document.getElementById('onboarding-wizard');
    overlay.classList.remove('active');
    
    const user = auth.currentUser;
    if (user) {
        try {
            await setDoc(doc(db, "users", user.uid), {
                onboardingComplete: true
            }, { merge: true });
            showToast("Welcome aboard! Let's build your future.", "success", "Setup Complete");
        } catch (e) {
            console.error("Failed to save onboarding status", e);
        }
    }

    setTimeout(() => overlay.remove(), 500);
}
