import { config } from '../../config';
import { logger } from '../../logger';
import { StorageDriver } from '../../types/storage.types';
import { createLocalStorage } from './local.storage';
import { createR2Storage } from './r2.storage';

// Chosen once at start-up from STORAGE_DRIVER. Every caller goes through this one instance, so
// nothing else in the app needs to know whether a file lives in R2 or on the disk.
export const storage: StorageDriver =
  config.storage.driver === 'r2' ? createR2Storage() : createLocalStorage();

logger.info({ driver: storage.provider }, 'file storage ready');

export { createLocalStorage, createR2Storage };
