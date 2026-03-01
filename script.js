const G_SHEET_URL = "https://script.google.com/macros/s/AKfycbwwB34oUSDeB6sOGKGDxA0bQjEjQZfsDeU1CvhKtOKP4OZAV23uTvADppf3i8vTBiak/exec";
const GEMINI_KEY = "AIzaSyCL6CcK13qZDPUyItfkY2Rnt5BxYLpCcUc";

let currentData = {};

// Fetch data from GSheet
async function updateDashboard() {
    try {
        const res = await fetch(G_SHEET_URL);
        const data = await res.json();
        currentData = data;
        
        document.getElementById('temp').innerText = data.temp;
        document.getElementById('hum').innerText = data.hum;
        document.getElementById('soil').innerText = data.soil;

        if(data.g1 > 1200 || data.g2 > 1200) {
            document.getElementById('gas-warning').innerText = "⚠️ Gas Hazard Detected!";
            document.getElementById('gas-warning').className = "danger";
        }
    } catch (e) { console.log("Waiting for data stream..."); }
}

// Gemini AI Advisory Logic
async function askGemini() {
    const query = document.getElementById('user-query').value;
    const lang = document.getElementById('lang').value;
    const chat = document.getElementById('chat-history');
    
    chat.innerHTML += `<p class='user-m'><b>You:</b> ${query}</p>`;

    const prompt = `Context: Plant is ${document.getElementById('plant-type').value}, Location Pincode: ${document.getElementById('pincode').value}, Soil Moisture: ${currentData.soil}%, Temp: ${currentData.temp}C. 
    Question: ${query}. 
    Task: Provide a strategic agricultural advice in ${lang} and predict if extra NPK nutrients are needed.`;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, {
        method: "POST",
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const result = await res.json();
    const responseText = result.candidates[0].content.parts[0].text;
    
    chat.innerHTML += `<p class='ai-m'><b>Gemini:</b> ${responseText}</p>`;
    document.getElementById('user-query').value = "";
}

function setMilestone() {
    const date = document.getElementById('seed-date').value;
    const plant = document.getElementById('plant-type').value;
    document.getElementById('milestone-output').innerHTML = `🌱 <b>${plant}</b> Lifecycle started on ${date}. AI will track growth stages.`;
}

setInterval(updateDashboard, 10000); // UI Refresh every 10s
updateDashboard();
