import * as fs from 'fs';
import * as path from 'path';
import { Store } from '../models/Store';

// Default data directory relative to project root
const DATA_DIR = path.join(process.cwd(), 'data');
const DEFAULT_FILE = 'station-data.json';

export interface PersistedData {
  totalPowerKw: number;
  plugCount: number;
  plugMaxPowerKw: number;
  activePlugs: Array<{
    vehicleId: string;
    allocatedKw: number;
  }>;
  queue: Array<{
    vehicleId: string;
    requestedKwh: number;
    priority: string;
    timestamp: number;
  }>;
  vehicles: Record<string, {
    id: string;
    requestedKwh: number;
    priority: string;
    status: string;
    allocatedKw: number;
    chargedKwh: number;
    connectedAt: string;
  }>;
  isInitialized: boolean;
  stores?: Store[];
}

/**
 * Ensures the data directory exists
 */
function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

/**
 * Gets the full path to the data file
 */
function getFilePath(filename: string = DEFAULT_FILE): string {
  return path.join(DATA_DIR, filename);
}

/**
 * Reads JSON data from a file
 * @param filename - The name of the file to read (default: 'station-data.json')
 * @returns The parsed JSON data or null if the file doesn't exist or is invalid
 */
export function readData(filename: string = DEFAULT_FILE): PersistedData | null {
  const filePath = getFilePath(filename);
  
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(rawData);
    
    return data as PersistedData;
  } catch (error) {
    console.error(`Error reading data file ${filename}:`, error);
    return null;
  }
}

/**
 * Writes JSON data to a file
 * @param data - The data to write
 * @param filename - The name of the file to write (default: 'station-data.json')
 * @returns true if successful, false otherwise
 */
export function writeData(data: PersistedData, filename: string = DEFAULT_FILE): boolean {
  ensureDataDir();
  const filePath = getFilePath(filename);
  
  try {
    const jsonData = JSON.stringify(data, null, 2);
    fs.writeFileSync(filePath, jsonData, 'utf-8');
    return true;
  } catch (error) {
    console.error(`Error writing data file ${filename}:`, error);
    return false;
  }
}

/**
 * Checks if a data file exists
 * @param filename - The name of the file to check (default: 'station-data.json')
 */
export function dataExists(filename: string = DEFAULT_FILE): boolean {
  return fs.existsSync(getFilePath(filename));
}

/**
 * Deletes a data file
 * @param filename - The name of the file to delete (default: 'station-data.json')
 * @returns true if successful, false otherwise
 */
export function deleteData(filename: string = DEFAULT_FILE): boolean {
  const filePath = getFilePath(filename);
  
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return true;
  } catch (error) {
    console.error(`Error deleting data file ${filename}:`, error);
    return false;
  }
}

export default {
  readData,
  writeData,
  dataExists,
  deleteData
};