const { ipcRenderer } = require('electron');

// UI Elements
const dlSpeedEl = document.getElementById('dl-speed');
const ulSpeedEl = document.getElementById('ul-speed');
const peakDlEl = document.getElementById('peak-dl');
const peakUlEl = document.getElementById('peak-ul');
const dlBarEl = document.getElementById('dl-bar');
const ulBarEl = document.getElementById('ul-bar');
const updateCounterEl = document.getElementById('update-counter');
const totalDlEl = document.getElementById('total-dl');
const totalUlEl = document.getElementById('total-ul');
const logOutputEl = document.getElementById('log-output');
const currentTimeEl = document.getElementById('current-time');
const adapterNameEl = document.getElementById('adapter-name');
const startBtn = document.getElementById('start-turbo');
const stopBtn = document.getElementById('stop-turbo');
const minimizeBtn = document.getElementById('minimize');
const closeBtn = document.getElementById('close');
const clearLogBtn = document.getElementById('clear-log-btn');
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const closeModalBtns = document.querySelectorAll('.close-modal');
const turboIndicator = document.getElementById('turbo-active');
const refreshIndicator = document.getElementById('refresh-running');

// State
let peakDl = 0;
let peakUl = 0;
let totalDl = 0;
let totalUl = 0;
let updateCount = 0;
let isRunning = false;

// Speed Graph Initialization
const ctx = document.getElementById('speed-graph').getContext('2d');
const speedChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: Array(30).fill(''),
        datasets: [
            {
                label: 'Download',
                borderColor: '#39ff14',
                backgroundColor: 'rgba(57, 255, 20, 0.1)',
                data: Array(30).fill(0),
                borderWidth: 2,
                pointRadius: 0,
                fill: true,
                tension: 0.4
            },
            {
                label: 'Upload',
                borderColor: '#ff8c00',
                backgroundColor: 'rgba(255, 140, 0, 0.1)',
                data: Array(30).fill(0),
                borderWidth: 2,
                pointRadius: 0,
                fill: true,
                tension: 0.4
            }
        ]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: { display: false },
            y: {
                beginAtZero: true,
                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                ticks: { color: '#6c7a8e', font: { size: 10 } }
            }
        },
        plugins: {
            legend: { display: false }
        },
        animation: { duration: 0 }
    }
});

// Update Clock
setInterval(() => {
    const now = new Date();
    currentTimeEl.textContent = now.toLocaleTimeString();
}, 1000);

// Window Controls
minimizeBtn.addEventListener('click', () => ipcRenderer.send('window-control', 'minimize'));
closeBtn.addEventListener('click', () => ipcRenderer.send('window-control', 'close'));

// Adapter Detection
function refreshAdapter() {
    ipcRenderer.send('get-adapter');
}

ipcRenderer.on('adapter-found', (event, name) => {
    if (name) {
        adapterNameEl.querySelector('span').textContent = name;
    } else {
        adapterNameEl.querySelector('span').textContent = 'No connection';
        addLogEntry('WARNING: No active network adapter detected.', 'error');
    }
});

// Initial Detection
refreshAdapter();
setInterval(refreshAdapter, 5000); // Check every 5s

// Turbo Logic
startBtn.addEventListener('click', () => {
    const currentAdapter = adapterNameEl.querySelector('span').textContent;
    if (!currentAdapter || currentAdapter === 'Scanning...' || currentAdapter === 'No connection') {
        alert('Please connect to a Hutch network first!');
        addLogEntry('ERROR: Turbo failed to start. No active adapter found.', 'error');
        return;
    }

    const intervalInput = document.getElementById('interval-input');
    const interval = intervalInput ? parseInt(intervalInput.value) : 1000;

    isRunning = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    turboIndicator.classList.add('on');
    refreshIndicator.classList.add('on');
    ipcRenderer.send('start-turbo', { interval: interval });
    addLogEntry(`Turbo activation sequence initiated (Interval: ${interval}ms)...`, 'system');
});

stopBtn.addEventListener('click', () => {
    ipcRenderer.send('stop-turbo');
    handleStop();
});

ipcRenderer.on('turbo-stopped', () => {
    handleStop();
});

function handleStop() {
    isRunning = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    turboIndicator.classList.remove('on');
    refreshIndicator.classList.remove('on');
    addLogEntry('Turbo sequence terminated.', 'system');
}

// IPC Handlers
ipcRenderer.on('script-output', (event, data) => {
    addLogEntry(data);
    parseOutput(data);
});

// Output Parsing
function parseOutput(data) {
    // Parsing logic based on the PowerShell script output format
    // Example: "Download Speed : 123.45 KB/s  (0.12 MB/s)   Peak: 456.78 KB/s"

    // Extract Adapter
    const adapterMatch = data.match(/Adapter\s*:\s*(.+)/);
    if (adapterMatch) {
        adapterNameEl.querySelector('span').textContent = adapterMatch[1].trim();
    }

    // Extract Speed Metrics
    const dlMatch = data.match(/Download Speed\s*:\s*[\d.]+\s*KB\/s\s*\(([\d.]+)\s*MB\/s\)\s*Peak:\s*([\d.]+)\s*KB\/s/);
    const ulMatch = data.match(/Upload Speed\s*:\s*[\d.]+\s*KB\/s\s*\(([\d.]+)\s*MB\/s\)\s*Peak:\s*([\d.]+)\s*KB\/s/);

    if (dlMatch) {
        const currentDl = parseFloat(dlMatch[1]);
        const peakDlKB = parseFloat(dlMatch[2]);
        dlSpeedEl.textContent = currentDl.toFixed(1);
        peakDl = Math.max(peakDl, currentDl);
        peakDlEl.textContent = (peakDlKB / 1024).toFixed(1);

        // Update Progress Bar
        const dlPercent = Math.min((currentDl / 20) * 100, 100); // Assume 20MB/s as 100%
        dlBarEl.style.width = `${dlPercent}%`;

        // Update Chart
        updateChart(currentDl, 'dl');
    }

    if (ulMatch) {
        const currentUl = parseFloat(ulMatch[1]);
        const peakUlKB = parseFloat(ulMatch[2]);
        ulSpeedEl.textContent = currentUl.toFixed(1);
        peakUl = Math.max(peakUl, currentUl);
        peakUlEl.textContent = (peakUlKB / 1024).toFixed(1);

        // Update Progress Bar
        const ulPercent = Math.min((currentUl / 10) * 100, 100); // Assume 10MB/s as 100%
        ulBarEl.style.width = `${ulPercent}%`;

        // Update Chart
        updateChart(currentUl, 'ul');
    }

    // Extract Totals and Updates
    const totalDlMatch = data.match(/Total Download\s*:\s*([\d.]+)\s*KB/);
    const totalUlMatch = data.match(/Total Upload\s*:\s*([\d.]+)\s*KB/);
    const updatesMatch = data.match(/Updates\s*:\s*(\d+)/);

    if (totalDlMatch) {
        totalDl = parseFloat(totalDlMatch[1]) / 1024; // to MB
        totalDlEl.textContent = `${totalDl.toFixed(2)} MB`;
    }
    if (totalUlMatch) {
        totalUl = parseFloat(totalUlMatch[1]) / 1024; // to MB
        totalUlEl.textContent = `${totalUl.toFixed(2)} MB`;
    }
    if (updatesMatch) {
        updateCount = parseInt(updatesMatch[1]);
        updateCounterEl.textContent = updateCount;
    }
}

function updateChart(value, type) {
    const index = type === 'dl' ? 0 : 1;
    speedChart.data.datasets[index].data.push(value);
    speedChart.data.datasets[index].data.shift();
    speedChart.update();
}

// Utils
function addLogEntry(text, type = '') {
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    const ts = new Date().toLocaleTimeString();
    entry.innerHTML = `<span class="ts">[${ts}]</span> <span class="src">HUTCH:</span> ${text}`;
    logOutputEl.appendChild(entry);
    logOutputEl.scrollTop = logOutputEl.scrollHeight;
}

clearLogBtn.addEventListener('click', () => {
    logOutputEl.innerHTML = '';
});

// Settings Modal
settingsBtn.addEventListener('click', () => settingsModal.classList.add('active'));
closeModalBtns.forEach(btn => {
    btn.addEventListener('click', () => settingsModal.classList.remove('active'));
});

// Theme Toggle logic
document.querySelectorAll('.theme-btn:not(.modal-tab-btn)').forEach(btn => {
    btn.addEventListener('click', () => {
        const theme = btn.dataset.theme;
        document.body.parentElement.setAttribute('data-bs-theme', theme);
        document.body.parentElement.setAttribute('data-theme', theme);

        document.querySelectorAll('.theme-btn:not(.modal-tab-btn)').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

// Modal Tab Logic
document.querySelectorAll('.modal-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const targetView = btn.dataset.modalView;

        // Update Buttons
        document.querySelectorAll('.modal-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Update Views
        document.querySelectorAll('.modal-tab-content').forEach(view => {
            if (view.id === targetView) {
                view.classList.remove('d-none');
            } else {
                view.classList.add('d-none');
            }
        });
    });
});
