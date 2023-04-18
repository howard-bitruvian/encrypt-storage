import { EncryptStorage } from './encrypt-storage';
// import { EncryptStorageOptions } from './types';

export const AsyncEncryptStorage = EncryptStorage;

/* istanbul ignore next */
if (window) {
  /* istanbul ignore next */
  (window as any).AsyncEncryptStorage = AsyncEncryptStorage;
}
/* istanbul ignore next */
if (window && window?.globalThis) {
  /* istanbul ignore next */
  (window?.globalThis as any).AsyncEncryptStorage = AsyncEncryptStorage;
}
