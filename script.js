const thingSpeakConfig = {
  channelId: "2900397",
  timePeriods: {
    "1h": "minutes=60",
    "1d": "days=1",
    "1w": "days=7",
    "1m": "days=30",
  },
  updateInterval: 15000,
};

const loginBtn = document.querySelector(".login-btn");
const loginModal = document.getElementById("login-modal");
const closeModal = document.querySelector(".close-modal");
const timeBtns = document.querySelectorAll(".time-btn");
const themeToggle = document.getElementById("theme-toggle");
const particles = document.getElementById("particles");

const temperatureValue = document.getElementById("temperature-value");
const lastUpdateValue = document.getElementById("last-update-value");
const statusValue = document.getElementById("status-value");
const statusContainer = document.getElementById("status-container");

function initApp() {
  setupEventListeners();
  startDataUpdates();
  initializeTheme();
  initParticles();
}

function initializeTheme() {
  const savedTheme = localStorage.getItem("theme");

  if (savedTheme) {
    applyTheme(savedTheme);
    themeToggle.checked = savedTheme === "dark";
  } else {
    const prefersDarkScheme = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    applyTheme(prefersDarkScheme ? "dark" : "light");
    themeToggle.checked = prefersDarkScheme;
  }
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
  updateChartTheme(theme);
}

function updateChartTheme(theme) {
  const chartFrame = document.querySelector(".thingspeak-chart iframe");
  if (!chartFrame) return;

  let src = chartFrame.src;
  const bgColor = theme === "dark" ? "%231c1c20" : "%23ffffff";
  if (src.includes("bgcolor=")) {
    src = src.replace(/(bgcolor=)(%23[a-f0-9]+)/i, `$1${bgColor}`);
    chartFrame.src = src;
  }
}

function setupEventListeners() {
  loginBtn.addEventListener("click", () => (loginModal.style.display = "flex"));
  closeModal.addEventListener(
    "click",
    () => (loginModal.style.display = "none")
  );
  window.addEventListener("click", (e) => {
    if (e.target === loginModal) loginModal.style.display = "none";
  });

  timeBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      timeBtns.forEach((b) => b.classList.remove("active"));
      e.target.classList.add("active");
      updateChartTimeframe(e.target.textContent);
    });
  });

  themeToggle.addEventListener("change", function () {
    const theme = this.checked ? "dark" : "light";
    applyTheme(theme);
    addStatusMessage(
      `${theme.charAt(0).toUpperCase() + theme.slice(1)} theme enabled`
    );
  });

  document.getElementById("login-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value;
    loginModal.style.display = "none";
    document.querySelector(".user-name").textContent = username;
    document.querySelector(".user-role").textContent = "Admin";
    loginBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';
    addStatusMessage("Login successful");
  });

  window.addEventListener("resize", handleResize);
}

function updateChartTimeframe(timePeriod) {
  const chartFrame = document.querySelector(".thingspeak-chart iframe");
  if (!chartFrame) return;

  const timeParam =
    thingSpeakConfig.timePeriods[timePeriod] ||
    thingSpeakConfig.timePeriods["1h"];
  let src = chartFrame.src;

  if (src.includes("minutes=") || src.includes("days=")) {
    src = src.replace(/(minutes=\d+|days=\d+)/, timeParam);
    chartFrame.src = src;
  }
}

function startDataUpdates() {
  updateLatestValues();
  setInterval(updateLatestValues, thingSpeakConfig.updateInterval);
}

function updateLatestValues() {
  const url = `https://api.thingspeak.com/channels/${thingSpeakConfig.channelId}/feeds/last.json?results=1`;

  fetch(url)
    .then((response) => {
      if (!response.ok) throw new Error("Network response was not ok");
      return response.json();
    })
    .then((data) => updateDisplayValues(data))
    .catch((error) => {
      console.error("Error fetching data:", error);
      statusValue.textContent = "Disconnected";
      addStatusMessage("Failed to fetch temperature data", "warning");
    });
}

function updateDisplayValues(data) {
  if (!data || !data.field1) return;

  const temperature = data.field1;
  temperatureValue.textContent = `${temperature} °C`;

  const now = new Date();
  lastUpdateValue.textContent = now.toLocaleTimeString();
  statusValue.textContent = "Connected";

  if (Math.random() > 0.7) {
    addStatusMessage(`Temperature reading: ${temperature} °C`);
  }
}

function addStatusMessage(message, type = "normal") {
  const statusCard = document.createElement("div");
  statusCard.className = "status-card";

  const statusIcon = document.createElement("div");
  statusIcon.className = `status-icon ${type}`;

  const icon = document.createElement("i");
  icon.className =
    type === "normal" ? "fas fa-check-circle" : "fas fa-exclamation-triangle";
  statusIcon.appendChild(icon);

  const statusInfo = document.createElement("div");
  statusInfo.className = "status-info";

  const statusTime = document.createElement("p");
  statusTime.className = "status-time";
  statusTime.textContent = getCurrentTime();

  const statusMessage = document.createElement("p");
  statusMessage.className = "status-message";
  statusMessage.textContent = message;

  statusInfo.appendChild(statusTime);
  statusInfo.appendChild(statusMessage);
  statusCard.appendChild(statusIcon);
  statusCard.appendChild(statusInfo);

  statusContainer.insertBefore(statusCard, statusContainer.firstChild);

  if (statusContainer.children.length > 5) {
    statusContainer.removeChild(statusContainer.lastChild);
  }
}

function getCurrentTime() {
  const now = new Date();
  return now.toLocaleTimeString();
}

function initParticles() {
  if (!particles) return;
  for (let i = 0; i < 30; i++) createParticle();
}

function createParticle() {
  const particle = document.createElement("div");
  particle.classList.add("particle");

  const posX = Math.random() * window.innerWidth;
  const posY = Math.random() * window.innerHeight;
  const size = Math.random() * 4 + 1;
  const opacity = Math.random() * 0.4 + 0.1;
  const speed = Math.random() * 1.5 + 0.2;
  const direction = Math.random() > 0.5 ? 1 : -1;

  particle.style.cssText = `
    position: absolute;
    width: ${size}px;
    height: ${size}px;
    left: ${posX}px;
    top: ${posY}px;
    background-color: var(--primary-color);
    border-radius: 50%;
    opacity: ${opacity};
    box-shadow: 0 0 ${size * 2}px var(--primary-color);
    pointer-events: none;
  `;

  particles.appendChild(particle);
  animateParticle(particle, speed * direction);
}

function animateParticle(particle, speed) {
  let posX = parseFloat(particle.style.left);
  let posY = parseFloat(particle.style.top);

  const animate = () => {
    posY -= speed;

    if (posY < -10 || posY > window.innerHeight + 10) {
      posX = Math.random() * window.innerWidth;
      posY = speed > 0 ? window.innerHeight + 10 : -10;
    }

    particle.style.left = posX + "px";
    particle.style.top = posY + "px";
    requestAnimationFrame(animate);
  };

  animate();
}

function handleResize() {
  while (particles && particles.firstChild) {
    particles.removeChild(particles.firstChild);
  }
  initParticles();
}

document.addEventListener("DOMContentLoaded", initApp);
