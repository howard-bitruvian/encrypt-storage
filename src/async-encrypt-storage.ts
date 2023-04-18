import { EncryptStorage } from './encrypt-storage';
// import { EncryptStorageOptions } from './types';

export const AsyncEncryptStorage = EncryptStorage;

/* istanbul ignore next */
if (typeof window !== 'undefined') {
  /* istanbul ignore next */
  (window as any).AsyncEncryptStorage = AsyncEncryptStorage;
}
/* istanbul ignore next */
if (typeof window !== 'undefined' && window?.globalThis) {
  /* istanbul ignore next */
  (window?.globalThis as any).AsyncEncryptStorage = AsyncEncryptStorage;
}
