/*
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License (UPL), Version 1.0  as shown at https://oss.oracle.com/licenses/upl/
 */

export interface BucketData {
    stringProperty?: string;
    fileProperty?: string;
    bucketName?: string;
    timestamp?: number;
}

export class StorageManager {
    private readonly STORAGE_PREFIX = "ofs-init-data-loading";
    private readonly DATA_RETRIEVED_KEY = `${this.STORAGE_PREFIX}:dataRetrieved`;
    private readonly BUCKET_DATA_KEY = `${this.STORAGE_PREFIX}:bucketData`;
    private readonly SECURED_DATA_KEY = `${this.STORAGE_PREFIX}:securedData`;

    /**
     * Store bucket data in localStorage
     */
    storeBucketData(data: BucketData): void {
        try {
            const dataWithTimestamp = {
                ...data,
                timestamp: Date.now()
            };
            localStorage.setItem(this.BUCKET_DATA_KEY, JSON.stringify(dataWithTimestamp));
            console.log(`[StorageManager] Stored bucket data:`, dataWithTimestamp);
        } catch (error) {
            console.error(`[StorageManager] Error storing bucket data:`, error);
        }
    }

    /**
     * Retrieve bucket data from localStorage
     */
    getBucketData(): BucketData | null {
        try {
            const data = localStorage.getItem(this.BUCKET_DATA_KEY);
            if (data) {
                const parsed = JSON.parse(data);
                console.log(`[StorageManager] Retrieved bucket data:`, parsed);
                return parsed;
            }
            console.log(`[StorageManager] No bucket data found`);
            return null;
        } catch (error) {
            console.error(`[StorageManager] Error retrieving bucket data:`, error);
            return null;
        }
    }

    /**
     * Set data retrieved flag
     */
    setDataRetrieved(retrieved: boolean): void {
        try {
            localStorage.setItem(this.DATA_RETRIEVED_KEY, String(retrieved));
            console.log(`[StorageManager] Set dataRetrieved flag to: ${retrieved}`);
        } catch (error) {
            console.error(`[StorageManager] Error setting dataRetrieved flag:`, error);
        }
    }

    /**
     * Check if data has been retrieved
     */
    isDataRetrieved(): boolean {
        try {
            const retrieved = localStorage.getItem(this.DATA_RETRIEVED_KEY);
            const isRetrieved = retrieved === "true";
            console.log(`[StorageManager] Data retrieved status: ${isRetrieved}`);
            return isRetrieved;
        } catch (error) {
            console.error(`[StorageManager] Error checking dataRetrieved flag:`, error);
            return false;
        }
    }

    /**
     * Store secured data for later use in wakeup
     */
    storeSecuredData(securedData: any): void {
        try {
            localStorage.setItem(this.SECURED_DATA_KEY, JSON.stringify(securedData));
            console.log(`[StorageManager] Stored secured data`);
        } catch (error) {
            console.error(`[StorageManager] Error storing secured data:`, error);
        }
    }

    /**
     * Retrieve secured data
     */
    getSecuredData(): any {
        try {
            const data = localStorage.getItem(this.SECURED_DATA_KEY);
            if (data) {
                return JSON.parse(data);
            }
            return null;
        } catch (error) {
            console.error(`[StorageManager] Error retrieving secured data:`, error);
            return null;
        }
    }

    /**
     * Clear all stored data
     */
    clearAllData(): void {
        try {
            localStorage.removeItem(this.BUCKET_DATA_KEY);
            localStorage.removeItem(this.DATA_RETRIEVED_KEY);
            localStorage.removeItem(this.SECURED_DATA_KEY);
            console.log(`[StorageManager] Cleared all data`);
        } catch (error) {
            console.error(`[StorageManager] Error clearing data:`, error);
        }
    }
}
