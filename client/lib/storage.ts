/**
 * Utility functions for managing local storage with JSON serialization
 */

export interface StorageOptions {
  ttl?: number; // Time to live in milliseconds
}

interface StorageItem<T> {
  value: T;
  expiresAt?: number;
}

/**
 * Set a value in local storage
 */
export function setStorageItem<T>(
  key: string,
  value: T,
  options?: StorageOptions
): void {
  try {
    const item: StorageItem<T> = { value };
    if (options?.ttl) {
      item.expiresAt = Date.now() + options.ttl;
    }
    localStorage.setItem(key, JSON.stringify(item));
  } catch (error) {
    console.error(`Failed to set storage item "${key}":`, error);
  }
}

/**
 * Get a value from local storage
 */
export function getStorageItem<T>(key: string, defaultValue?: T): T | null {
  try {
    const item = localStorage.getItem(key);
    if (!item) {
      return defaultValue ?? null;
    }

    const parsed: StorageItem<T> = JSON.parse(item);

    // Check if item has expired
    if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
      localStorage.removeItem(key);
      return defaultValue ?? null;
    }

    return parsed.value;
  } catch (error) {
    console.error(`Failed to get storage item "${key}":`, error);
    return defaultValue ?? null;
  }
}

/**
 * Remove a value from local storage
 */
export function removeStorageItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Failed to remove storage item "${key}":`, error);
  }
}

/**
 * Clear all local storage
 */
export function clearStorage(): void {
  try {
    localStorage.clear();
  } catch (error) {
    console.error("Failed to clear storage:", error);
  }
}

/**
 * Check if a key exists in local storage
 */
export function hasStorageItem(key: string): boolean {
  try {
    return localStorage.getItem(key) !== null;
  } catch {
    return false;
  }
}

/**
 * Get all storage keys
 */
export function getStorageKeys(): string[] {
  try {
    return Object.keys(localStorage);
  } catch {
    return [];
  }
}
