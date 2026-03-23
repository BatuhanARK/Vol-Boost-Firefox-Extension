const slider = document.getElementById("slider");
const displayValue = document.getElementById("displayValue");
const presetBtns = document.querySelectorAll(".preset-btn");

const PRESETS = [0, 100, 200, 400, 600];

function getColorForPercent(percent) {
    const stops = [
        { p: 0,   r: 71,  g: 180, b: 255 }, // blue
        { p: 100, r: 80,  g: 230, b: 120 }, // green
        { p: 200, r: 232, g: 255, b: 71  }, // yellow
        { p: 400, r: 255, g: 140, b: 30  }, // orange
        { p: 600, r: 255, g: 55,  b: 55  }, // red
    ];

    for (let i = 0; i < stops.length - 1; i++) {
        const a = stops[i], b = stops[i + 1];
        if (percent >= a.p && percent <= b.p) {
            const t = (percent - a.p) / (b.p - a.p);
            const r = Math.round(a.r + (b.r - a.r) * t);
            const g = Math.round(a.g + (b.g - a.g) * t);
            const bl = Math.round(a.b + (b.b - a.b) * t);
            return `rgb(${r},${g},${bl})`;
        }
    }
    return `rgb(255,55,55)`;
}

const titleEl = document.querySelector(".title");
const statusDot = document.querySelector(".status-dot");
const statusText = document.querySelector(".status-text");
const refreshBtn = document.getElementById("refreshBtn");

function updateDisplay(percent) {
    displayValue.textContent = percent;
    const color = getColorForPercent(percent);
    const glow = `0 0 20px ${color}66`;

    displayValue.style.color = color;
    displayValue.style.textShadow = glow;

    titleEl.style.color = color;
    titleEl.style.textShadow = glow;

    statusDot.style.background = color;
    statusDot.style.boxShadow = `0 0 6px ${color}`;
    statusText.style.color = color;

    const isActive = percent !== 100;
    statusDot.style.opacity = isActive ? "1" : "0.2";
    statusText.style.opacity = isActive ? "1" : "0.2";
    statusDot.style.boxShadow = isActive ? `0 0 6px ${color}` : "none";
}

function updateActivePreset(percent) {
    const color = getColorForPercent(percent);
    presetBtns.forEach(btn => {
        const val = parseInt(btn.dataset.value);
        const isActive = val === percent;
        btn.classList.toggle("active", isActive);
        if (isActive) {
            btn.style.background = color;
            btn.style.borderColor = color;
            btn.style.color = "#0e0e0e";
        } else {
            btn.style.background = "";
            btn.style.borderColor = "";
            btn.style.color = "";
        }
    });
}

function applyGain(percent) {
    slider.value = percent;
    updateDisplay(percent);
    updateActivePreset(percent);

    const gainValue = percent / 100;
    browser.storage.local.set({ gain: gainValue });

    browser.tabs.query({ active: true, currentWindow: true }).then(tabs => {
        browser.tabs.sendMessage(tabs[0].id, {
            type: "SET_GAIN",
            gain: gainValue
        });
    });
}

// Load saved gain value
browser.storage.local.get("gain").then(res => {
    const gainValue = res.gain || 1;
    const percent = Math.round(gainValue * 100);
    slider.value = percent;
    updateDisplay(percent);
    updateActivePreset(percent);
});

// Slider input
slider.addEventListener("input", () => {
    const percent = parseInt(slider.value);
    applyGain(percent);
});

// Preset buttons
presetBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        const percent = parseInt(btn.dataset.value);
        applyGain(percent);
    });

    btn.addEventListener("mouseenter", () => {
        if (btn.classList.contains("active")) return;
        const percent = parseInt(slider.value);
        const color = getColorForPercent(percent);
        btn.style.borderColor = color;
        btn.style.color = color;
        btn.style.background = `${color}12`;
    });

    btn.addEventListener("mouseleave", () => {
        if (btn.classList.contains("active")) return;
        btn.style.borderColor = "";
        btn.style.color = "";
        btn.style.background = "";
    });
});

// Refresh button
refreshBtn.addEventListener("click", () => {
    const percent = parseInt(slider.value);
    const color = getColorForPercent(percent);
    refreshBtn.style.borderColor = color;
    refreshBtn.style.color = color;
    setTimeout(() => {
        refreshBtn.style.borderColor = "";
        refreshBtn.style.color = "";
    }, 600);

    browser.tabs.query({ active: true, currentWindow: true }).then(tabs => {
        browser.tabs.sendMessage(tabs[0].id, { type: "REFRESH" });
    });
});