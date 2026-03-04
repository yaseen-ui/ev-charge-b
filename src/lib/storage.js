const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

// Default data directory relative to project root
const DATA_DIR = path.join(__dirname, '../../data');
const DEFAULT_FILE = 'station-data.json';

/**
 * Ensures the data directory exists
 */
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
  }
}

/**
 * Gets the full path to the data file
 */
function getFilePath(filename = DEFAULT_FILE) {
  return path.join(DATA_DIR, filename);
}

/**
 * Reads JSON data from a file
 * @param {string} filename - The name of the file to read (default: 'station-data.json')
 * @returns {Promise<Object|null>} The parsed JSON data or null if the file doesn't exist or is invalid
 */
async function readData(filename = DEFAULT_FILE) {
  const filePath = getFilePath(filename);
  
  try {
    if (!fsSync.existsSync(filePath)) {
      return null;
    }
    
    const rawData = await fs.readFile(filePath, 'utf-8');
    if (!rawData || rawData.trim() === '') {
      console.warn(`Data file ${filename} is empty.`);
      return null;
    }

    try {
      return JSON.parse(rawData);
    } catch (parseError) {
      console.error(`Error parsing JSON from ${filename}:`, parseError);
      return null;
    }
  } catch (error) {
    console.error(`Error reading data file ${filename}:`, error);
    return null;
  }
}

/**
 * Writes JSON data to a file atomically using a temporary file
 * @param {Object} data - The data to write
 * @param {string} filename - The name of the file to write (default: 'station-data.json')
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
async function writeData(data, filename = DEFAULT_FILE) {
  await ensureDataDir();
  const filePath = getFilePath(filename);
  const tempPath = `${filePath}.tmp`;
  
  try {
    const jsonData = JSON.stringify(data, null, 2);
    // Write to temporary file first to ensure atomicity
    await fs.writeFile(tempPath, jsonData, 'utf-8');
    // Rename temp file to actual file (atomic operation on most OSs)
    await fs.rename(tempPath, filePath);
    return true;
  } catch (error) {
    console.error(`Error writing data file ${filename}:`, error);
    // Cleanup temp file if it exists
    try {
      if (fsSync.existsSync(tempPath)) {
        await fs.unlink(tempPath);
      }
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
    return false;
  }
}

/**
 * Checks if a data file exists
 * @param {string} filename - The name of the file to check (default: 'station-data.json')
 * @returns {boolean} true if the file exists
 */
function dataExists(filename = DEFAULT_FILE) {
  return fsSync.existsSync(getFilePath(filename));
}

/**
 * Deletes a data file
 * @param {string} filename - The name of the file to delete (default: 'station-data.json')
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
async function deleteData(filename = DEFAULT_FILE) {
  const filePath = getFilePath(filename);
  
  try {
    if (fsSync.existsSync(filePath)) {
      await fs.unlink(filePath);
    }
    return true;
  } catch (error) {
    console.error(`Error deleting data file ${filename}:`, error);
    return false;
  }
}

module.exports = {
  readData,
  writeData,
  dataExists,
  deleteData
};