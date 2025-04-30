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
const heartbeatValue = document.getElementById("heartbeat-value");
const lastUpdateValue = document.getElementById("last-update-value");
const statusValue = document.getElementById("status-value");
const statusContainer = document.getElementById("status-container");
const dashboardElement = document.querySelector(".dashboard"); // Get dashboard element

let isLoggedIn = false; // Track login state

function initApp() {
  setupEventListeners();
  // Don't start data updates immediately
  // startDataUpdates();
  initializeTheme();
  initParticles();
  checkLoginState(); // Check login state on load
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
  const tempChartFrame = document.querySelector("#temperature-chart iframe");
  const heartbeatChartFrame = document.querySelector("#heartbeat-chart iframe");
  const bgColor = theme === "dark" ? "%231e1e1e" : "%23ffffff";

  if (tempChartFrame) {
    let src = tempChartFrame.src;
    if (src.includes("bgcolor=")) {
      src = src.replace(/(bgcolor=)(%23[a-fA-F0-9]+)/i, `$1${bgColor}`);
      tempChartFrame.src = src;
    }
  }
  if (heartbeatChartFrame) {
    let src = heartbeatChartFrame.src;
    if (src.includes("bgcolor=")) {
      src = src.replace(/(bgcolor=)(%23[a-fA-F0-9]+)/i, `$1${bgColor}`);
      heartbeatChartFrame.src = src;
    }
  }
}

function setupEventListeners() {
  loginBtn.addEventListener("click", () => {
    if (isLoggedIn) {
      logoutUser();
    } else {
      // Only show modal if not already displayed (e.g., on initial load)
      if (loginModal.style.display !== "flex") {
        loginModal.style.display = "flex";
      }
    }
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
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const username = usernameInput.value;
    const password = passwordInput.value;

    if (username === "user12345" && password === "admin@123") {
      loginModal.style.display = "none";
      document.querySelector(".user-name").textContent = username;
      document.querySelector(".user-role").textContent = "Admin";
      loginBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';
      addStatusMessage("Login successful");
      isLoggedIn = true;
      dashboardElement.classList.remove("hidden"); // Show dashboard
      // Restore visibility and interaction
      document.querySelector(".sidebar").style.opacity = "1";
      document.querySelector("header").style.opacity = "1";
      document.querySelector("main").style.pointerEvents = "auto";
      startDataUpdates(); // Start data updates after login
      usernameInput.value = "";
      passwordInput.value = "";
    } else {
      addStatusMessage("Invalid username or password", "warning");
      passwordInput.value = "";
    }
  });

  window.addEventListener("resize", handleResize);
}

function checkLoginState() {
  // In a real app, you'd check localStorage/sessionStorage or make an API call
  if (!isLoggedIn) {
    dashboardElement.classList.add("hidden");
    loginModal.style.display = "flex"; // Show login modal immediately
    // Ensure sidebar and header are less prominent or hidden when logged out
    document.querySelector(".sidebar").style.opacity = "0.5";
    document.querySelector("header").style.opacity = "0.5";
    document.querySelector("main").style.pointerEvents = "none"; // Prevent interaction with main content
  } else {
    dashboardElement.classList.remove("hidden");
    // Restore visibility and interaction
    document.querySelector(".sidebar").style.opacity = "1";
    document.querySelector("header").style.opacity = "1";
    document.querySelector("main").style.pointerEvents = "auto";
    startDataUpdates(); // Start updates only if logged in
  }
}

function logoutUser() {
  document.querySelector(".user-name").textContent = "Guest User";
  document.querySelector(".user-role").textContent = "IoT Specialist";
  loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
  addStatusMessage("Logout successful");
  isLoggedIn = false;
  dashboardElement.classList.add("hidden"); // Hide dashboard
  // Optionally stop data updates if they run in intervals
  // clearInterval(dataUpdateInterval); // Assuming you store the interval ID
  loginModal.style.display = "flex"; // Show login modal again after logout
  // Make background less prominent again
  document.querySelector(".sidebar").style.opacity = "0.5";
  document.querySelector("header").style.opacity = "0.5";
  document.querySelector("main").style.pointerEvents = "none";
}

function updateChartTimeframe(timePeriod) {
  const tempChartFrame = document.querySelector("#temperature-chart iframe");
  const heartbeatChartFrame = document.querySelector("#heartbeat-chart iframe");
  if (!tempChartFrame && !heartbeatChartFrame) return;

  const timeParam =
    thingSpeakConfig.timePeriods[timePeriod] ||
    thingSpeakConfig.timePeriods["1h"];

  if (tempChartFrame) {
    let src = tempChartFrame.src;
    if (
      src.includes("minutes=") ||
      src.includes("days=") ||
      src.includes("results=")
    ) {
      if (src.includes("results=")) {
        src = src.replace(
          /results=\d+/,
          timeParam.replace("minutes=", "results=").replace("days=", "results=")
        );
      } else if (src.includes("minutes=") || src.includes("days=")) {
        src = src.replace(/(minutes=\d+|days=\d+)/, timeParam);
      }
      tempChartFrame.src = src;
    }
  }

  if (heartbeatChartFrame) {
    let src = heartbeatChartFrame.src;
    if (
      src.includes("minutes=") ||
      src.includes("days=") ||
      src.includes("results=")
    ) {
      if (src.includes("results=")) {
        src = src.replace(
          /results=\d+/,
          timeParam.replace("minutes=", "results=").replace("days=", "results=")
        );
      } else if (src.includes("minutes=") || src.includes("days=")) {
        src = src.replace(/(minutes=\d+|days=\d+)/, timeParam);
      }
      heartbeatChartFrame.src = src;
    }
  }
}

function startDataUpdates() {
  // Check if already logged in before starting interval
  if (isLoggedIn) {
    updateLatestValues();
    // Store interval ID if you need to clear it on logout
    // dataUpdateInterval = setInterval(updateLatestValues, thingSpeakConfig.updateInterval);
    setInterval(updateLatestValues, thingSpeakConfig.updateInterval); // Simplified for now
  }
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
  if (data && data.field1) {
    const temperature = data.field1;
    temperatureValue.textContent = `${temperature} °C`;
    if (Math.random() > 0.8) {
      addStatusMessage(`Temperature reading: ${temperature} °C`);
    }
  } else {
    temperatureValue.textContent = `-- °C`;
  }

  if (data && data.field2) {
    const heartbeat = data.field2;
    heartbeatValue.textContent = `${heartbeat} BPM`;
    if (Math.random() > 0.8) {
      addStatusMessage(`Heartbeat reading: ${heartbeat} BPM`);
    }
  } else {
    heartbeatValue.textContent = `-- BPM`;
  }

  const now = new Date();
  lastUpdateValue.textContent = now.toLocaleTimeString();
  statusValue.textContent = "Connected";
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

  if (statusContainer.children.length > 10) {
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
