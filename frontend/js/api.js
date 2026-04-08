/**
 * API communication module
 */

const API_BASE_URL = '';

export async function analyzeResume(file, jobDescription) {
    const formData = new FormData();
    formData.append('resume', file);
    formData.append('job_description', jobDescription);

    try {
        const response = await fetch(`${API_BASE_URL}/api/analyze`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API Request failed:', error);
        throw error;
    }
}
