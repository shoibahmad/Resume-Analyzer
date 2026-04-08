import { analyzeResume } from './api.js';
import { populateDashboard, showSection } from './ui.js';
import { saveScan } from './history.js';
import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { initOnboarding } from './onboarding.js';
import { showToast } from './toast.js';

onAuthStateChanged(auth, (user) => {
    if (user) {
        if (document.getElementById('user-name')) {
            document.getElementById('user-name').textContent = user.displayName || "User";
            initOnboarding(user);
        }
    } else {
        window.location.href = 'auth.html';
    }
});

document.addEventListener('DOMContentLoaded', () => {
    
    // --- State ---
    let selectedFile = null;

    // --- DOM Elements ---
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('resume');
    const form = document.getElementById('analyze-form');
    const analyzeBtn = document.getElementById('analyze-btn');
    const tryAgainBtn = document.getElementById('try-again-btn');
    const jdInput = document.getElementById('job-description');

    // --- Drag and Drop Events ---
    
    // Open file dialog on click
    dropZone.addEventListener('click', () => {
        fileInput.click();
    });

    // Handle file selection from dialog
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });

    // Drag over styling
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.add('dragover');
        }, false);
    });

    // Remove drag over styling
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.remove('dragover');
        }, false);
    });

    // Handle file drop
    dropZone.addEventListener('drop', (e) => {
        if (e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            fileInput.files = e.dataTransfer.files; // Sync with file input
            handleFile(file);
        }
    });

    function handleFile(file) {
        // Simple validation
        const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!validTypes.includes(file.type) && !file.name.endsWith('.pdf') && !file.name.endsWith('.docx') && !file.name.endsWith('.doc')) {
            showToast('Please upload a valid PDF or Word document.', 'error');
            return;
        }
        
        if (file.size > 2 * 1024 * 1024) { // 2MB limit
            showToast('File size exceeds 2MB limit.', 'warning');
            return;
        }

        selectedFile = file;
        updateFileDisplay(file);
    }

    // --- Form Submission ---
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log("Analyze form submitted!");
        
        const jobDesc = jdInput.value.trim();
        console.log("Job Description length:", jobDesc.length);
        console.log("Selected File:", selectedFile ? selectedFile.name : "None");
        
        if (!selectedFile) {
            showToast('Please upload a resume first.', 'warning');
            return;
        }
        
        if (!jobDesc) {
            showToast('Please paste a job description.', 'warning');
            return;
        }

        // 1. Show Loading UI
        showSection('loading-overlay');
        
        const pb = document.getElementById('load-progress');
        pb.style.width = '0%';

        try {
            // 2. Call API
            const resultData = await analyzeResume(selectedFile, jobDesc);
            
            // 3. Complete progress bar animation instantly before transitioning
            pb.style.width = '100%';
            
            // Allow a tiny delay so the user sees 100% completion
            setTimeout(async () => {
                // 4. Populate and Show Results
                populateDashboard(resultData);
                showSection('section-results');

                // 5. Save to History (Firestore)
                await saveScan(resultData);
            }, 500);

        } catch (error) {
            showToast('An error occurred during analysis. Please ensure the backend is running.', 'error');
            console.error(error);
            // Revert back to upload if error
            showSection('section-upload');
        }
    });

    // --- Try Again ---
    if (tryAgainBtn) {
        tryAgainBtn.addEventListener('click', () => {
            // Reset state
            selectedFile = null;
            fileInput.value = '';
            updateFileDisplay(null);
            jdInput.value = '';
            
            // Reset progress bar setup for next time
            const pb = document.getElementById('load-progress');
            if (pb) pb.style.width = '0%';

            // Clear any history view state
            sessionStorage.removeItem('viewScanData');
            const url = new URL(window.location);
            url.searchParams.delete('view');
            window.history.replaceState({}, '', url);

            showSection('section-upload');
            // Reset results section hidden status just in case
            const resultsSec = document.getElementById('section-results');
            if (resultsSec) resultsSec.classList.add('hidden');
        });
    }

    // --- Check for History View (arriving from Dashboard) ---
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('view') === 'history') {
        const storedData = sessionStorage.getItem('viewScanData');
        if (storedData) {
            try {
                const result = JSON.parse(storedData);
                populateDashboard(result);
                showSection('section-results');
            } catch (e) {
                console.error('Failed to parse stored scan data:', e);
            }
        }
    }

    function updateFileDisplay(file) {
        const fileLabel = document.getElementById('file-name');
        if (!fileLabel) return;
        
        if (file) {
            fileLabel.textContent = `Selected: ${file.name}`;
            fileLabel.style.color = 'var(--text-indigo)';
        } else {
            fileLabel.textContent = 'Drag & drop or Click to browse';
            fileLabel.style.color = 'inherit';
        }
    }

});
