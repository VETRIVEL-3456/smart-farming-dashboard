// Configuration
const GS_URL = "https://script.google.com/a/macros/krct.ac.in/s/AKfycbx2lsCUJ7WxRfy1Scz-djH8QiseD-Lg-EZ90FnJkkRN-SexR1iTggKOMNG8rQ4nxTN1/exec";
const GEMINI_KEY = "AIzaSyCL6CcK13qZDPUyItfkY2Rnt5BxYLpCcUc";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;

let currentData = {};
let soilChart;

// 1. Initialize Real-time Chart (Chart.js)
function initChart() {
    const ctx = document.getElementById('soilChart').getContext('2d');
    soilChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Soil Moisture %',
                data: [],
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { min: 0, max: 100 }
            }
        }
    });
}

// 2. Fetch Latest Data from G-Sheet
async function updateDashboard() {
    try {
        const response = await fetch(GS_URL, { cache: "no-store" });
        const data = await response.json();
        currentData = data;

        // Update Text Indicators
        document.getElementById('temp').innerText = data.temp || "--";
        document.getElementById('hum').innerText = data.hum || "--";
        document.getElementById('soil-val').innerText = (data.soil || "--") + "%";

        // Update Chart Data (Max 10 points)
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        if (soilChart.data.labels.length > 10) {
            soilChart.data.labels.shift();
            soilChart.data.datasets[0].data.shift();
        }
        soilChart.data.labels.push(now);
        soilChart.data.datasets[0].data.push(data.soil);
        soilChart.update();

        // Safety Logic (MQ Sensors)
        const gasAlert = document.getElementById('gas-indicator');
        if (data.g1 > 1200 || data.g2 > 1200 || data.g3 > 1200) {
            gasAlert.innerText = "⚠️ HAZARD DETECTED";
            gasAlert.className = "danger-alert";
        } else {
            gasAlert.innerText = "✅ Air Quality: Safe";
            gasAlert.className = "safe-alert";
        }

    } catch (error) {
        console.error("Dashboard Sync Error:", error);
    }
}

// 3. Gemini AI Advisory Logic
async function askGemini() {
    const userInput = document.getElementById('user-input').value;
    const plant = document.getElementById('plant-type').value;
    const lang = document.getElementById('lang').value;
    const chatStream = document.getElementById('chat-stream');

    if (!userInput) return;

    chatStream.innerHTML += `<p class="user-msg"><b>You:</b> ${userInput}</p>`;
    
    // Strategic Prompt for Journal Quality Advice
    const prompt = `Context: Growing ${plant}. Current Moisture: ${currentData.soil || 'Unknown'}%, Temp: ${currentData.temp || 'Unknown'}°C. 
    Question: ${userInput}. 
    Provide strategic farming advice in ${lang}, including nutrient (NPK) prediction if relevant.`;

    try {
        const response = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const result = await response.json();
        const aiAdvice = result.candidates[0].content.parts[0].text;
        
        chatStream.innerHTML += `<p class="ai-msg"><b>Gemini:</b> ${aiAdvice}</p>`;
        chatStream.scrollTop = chatStream.scrollHeight;
        document.getElementById('user-input').value = "";
    } catch (err) {
        console.error("Gemini Error:", err);
    }
}

// 4. Milestone Tracker Logic
function setMilestone() {
    const plant = document.getElementById('plant-type').value;
    const date = document.getElementById('seed-date').value;
    const log = document.getElementById('milestone-log');

    if (!date) {
        alert("Please select a seeding date.");
        return;
    }

    log.innerHTML = `🌱 <b>${plant}</b> Lifecycle started on ${date}. AI will now provide growth-stage specific advice.`;
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    initChart();
    updateDashboard();
    setInterval(updateDashboard, 15000); // Sync every 15s
});
