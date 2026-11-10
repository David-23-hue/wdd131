function calculateWindChill(temp, speed) {
  return 35.74 + 0.6215 * temp - 35.75 * Math.pow(speed, 0.16) + 0.4275 * temp * Math.pow(speed, 0.16);
}

document.addEventListener("DOMContentLoaded", () => {
  const yearElement = document.getElementById("year");
  const lastModifiedElement = document.getElementById("lastModified");

  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }

  if (lastModifiedElement) {
    lastModifiedElement.textContent = document.lastModified;
  }

  const windChillValue = document.getElementById("windChillValue");
  const temperature = 38;
  const windSpeed = 12;

  if (windChillValue) {
    if (temperature <= 50 && windSpeed > 3) {
      const chill = calculateWindChill(temperature, windSpeed);
      windChillValue.textContent = `${Math.round(chill)}°F`;
    } else {
      windChillValue.textContent = "N/A";
    }
  }
});
