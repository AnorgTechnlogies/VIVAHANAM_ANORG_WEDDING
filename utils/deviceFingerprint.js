/**
 * Device Fingerprinting Utility
 * Generates a unique device ID based on browser and device characteristics
 */

/**
 * Generate a unique device fingerprint
 * @returns {string} Unique device ID
 */
export const generateDeviceId = () => {
  // Check if device ID already exists in localStorage
  const storedDeviceId = localStorage.getItem("vivahanamDeviceId");
  if (storedDeviceId) {
    return storedDeviceId;
  }

  // Generate device fingerprint
  const components = [];

  // Screen resolution
  if (window.screen) {
    components.push(
      `screen:${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`
    );
  }

  // Timezone
  if (Intl && Intl.DateTimeFormat) {
    components.push(`tz:${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
  }

  // Language
  components.push(`lang:${navigator.language || navigator.userLanguage}`);

  // Platform
  components.push(`platform:${navigator.platform || "unknown"}`);

  // User agent (first 50 chars)
  if (navigator.userAgent) {
    components.push(`ua:${navigator.userAgent.substring(0, 50)}`);
  }

  // Hardware concurrency
  if (navigator.hardwareConcurrency) {
    components.push(`cores:${navigator.hardwareConcurrency}`);
  }

  // Canvas fingerprint (if available)
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.textBaseline = "top";
      ctx.font = "14px 'Arial'";
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = "#f60";
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = "#069";
      ctx.fillText("Device fingerprint", 2, 15);
      ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
      ctx.fillText("Device fingerprint", 4, 17);
      const canvasFingerprint = canvas.toDataURL();
      components.push(`canvas:${canvasFingerprint.substring(0, 50)}`);
    }
  } catch (e) {
    // Canvas fingerprinting not available
  }

  // Combine all components
  const fingerprint = components.join("|");

  // Generate hash (simple hash function)
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Convert to positive hex string
  const deviceId = `device_${Math.abs(hash).toString(16)}_${Date.now().toString(36)}`;

  // Store in localStorage
  localStorage.setItem("vivahanamDeviceId", deviceId);

  return deviceId;
};

/**
 * Get device information
 * @returns {object} Device information object
 */
export const getDeviceInfo = () => {
  return {
    userAgent: navigator.userAgent || "unknown",
    platform: navigator.platform || "unknown",
    language: navigator.language || navigator.userLanguage || "unknown",
    screenWidth: window.screen?.width || 0,
    screenHeight: window.screen?.height || 0,
    timezone: Intl?.DateTimeFormat?.().resolvedOptions?.()?.timeZone || "unknown",
  };
};

/**
 * Clear device ID (useful for logout or testing)
 */
export const clearDeviceId = () => {
  localStorage.removeItem("vivahanamDeviceId");
};

