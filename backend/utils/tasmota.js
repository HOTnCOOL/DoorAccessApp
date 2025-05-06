const fetch = require('node-fetch');

/**
 * Control a Tasmota switch
 * @param {string} ip - The IP address of the Tasmota device
 * @param {string} apiKey - API key (if required)
 * @param {boolean} state - True to turn on, false to turn off
 * @returns {Promise<Object>} Response from the Tasmota device
 */
async function toggleTasmotaSwitch(ip, apiKey = '', state) {
  try {
    const command = state ? 'Power%20On' : 'Power%20Off';
    const url = `http://${ip}/cm?cmnd=${command}`;
    
    const headers = {};
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }
    
    const response = await fetch.get(url, { headers });
    return response.data;
  } catch (error) {
    console.error('Tasmota command failed:', error);
    return { 
      error: error.message,
      stack: error.stack
    };
  }
}

/**
 * Unlock a door by turning on the Tasmota switch
 * @param {Object} door - Door object with tasmotaIp and tasmotaApiKey
 * @returns {Promise<Object>} Response from the Tasmota device
 */
async function unlockDoor(door) {
  return await toggleTasmotaSwitch(door.tasmotaIp, door.tasmotaApiKey, true);
}

/**
 * Lock a door by turning off the Tasmota switch
 * @param {Object} door - Door object with tasmotaIp and tasmotaApiKey
 * @returns {Promise<Object>} Response from the Tasmota device
 */
async function lockDoor(door) {
  return await toggleTasmotaSwitch(door.tasmotaIp, door.tasmotaApiKey, false);
}

/**
 * Toggle a door lock (unlock if locked, lock if unlocked)
 * @param {Object} door - Door object with tasmotaIp and tasmotaApiKey
 * @returns {Promise<Object>} Response from the Tasmota device
 */
async function toggleDoorLock(door) {
  try {
    const statusUrl = `http://${door.tasmotaIp}/cm?cmnd=Power`;
    const headers = {};
    
    if (door.tasmotaApiKey) {
      headers['Authorization'] = `Bearer ${door.tasmotaApiKey}`;
    }
    
    const response = await fetch.get(statusUrl, { headers });
    const currentState = response.data.POWER === 'ON';
    
    return await toggleTasmotaSwitch(door.tasmotaIp, door.tasmotaApiKey, !currentState);
  } catch (error) {
    console.error('Error toggling door lock:', error);
    throw error;
  }
}

module.exports = {
  toggleTasmotaSwitch,
  unlockDoor,
  lockDoor,
  toggleDoorLock,
};