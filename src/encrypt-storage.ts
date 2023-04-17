import Bluebird from 'bluebird';
// # TODO: should we use this to override the global promise? https://stackoverflow.com/a/43892870
import _ from 'lodash';

import { InvalidSecretKeyError } from './errors';
import {
  Encryptation,
  NotifyHandler,
  GetFromPatternOptions,
  EncryptStorageOptions,
  EncryptStorageInterface,
  AsyncStorageInterface,
  RemoveFromPatternOptions,
} from './types';
import { getEncryptation, hashSHA256, hashMD5 } from './utils';

const secret = new WeakMap();
export class EncryptStorage implements EncryptStorageInterface {
  readonly #encryptation: Encryptation;

  public readonly storage: AsyncStorageInterface | null;

  readonly #prefix: string;

  #multiple = false;

  readonly #stateManagementUse: boolean;

  readonly #doNotEncryptValues: boolean;

  readonly #notifyHandler: NotifyHandler | undefined;

  /**
   * EncryptStorage provides a wrapper implementation of `localStorage` and `sessionStorage` for a better security solution in browser data store
   *
   * @param {string} secretKey - A secret to encrypt data must be contain min of 10 characters
   * @param {EncrytStorageOptions} options - A optional settings to set encryptData or select `sessionStorage` to browser storage
   */
  constructor(secretKey: string, options?: EncryptStorageOptions) {
    if (secretKey.length < 10) {
      throw new InvalidSecretKeyError();
    }

    const {
      storageType = 'localStorage',
      prefix = '',
      stateManagementUse = false,
      encAlgorithm = 'AES',
      doNotEncryptValues = false,
      notifyHandler,
    } = options || {};

    const {
      storage = typeof window === 'object' ? window[storageType] : null,
    } = options || {};

    secret.set(this, secretKey);

    this.#prefix = prefix;
    this.#notifyHandler = notifyHandler;
    this.#stateManagementUse = stateManagementUse;
    this.#doNotEncryptValues = doNotEncryptValues;
    this.#encryptation = getEncryptation(encAlgorithm, secret.get(this));

    // # If there's no storage, we should just fail since there's no reason why
    // # we'd have a storage-less module
    this.storage = storage;
  }

  #getKey(key: string): string {
    return this.#prefix ? `${this.#prefix}:${key}` : key;
  }

  public async length(): Promise<number> {
    const { storage } = this;
    if (!storage) {
      return 0;
    }

    const value = _.isFunction(storage.length)
      ? await storage.length()
      : storage.length;

    if (this.#notifyHandler) {
      this.#notifyHandler({
        type: 'length',
        value,
      });
    }

    return value;
  }

  public async setItem(
    key: string,
    value: any,
    doNotEncrypt = false,
    options = {},
  ): Promise<void> {
    const encryptValues = this.#doNotEncryptValues || doNotEncrypt;
    const storageKey = this.#getKey(key);
    const valueToString =
      typeof value === 'object' ? JSON.stringify(value) : String(value);
    const encryptedValue = encryptValues
      ? valueToString
      : this.#encryptation.encrypt(valueToString);

    await this.storage?.setItem(storageKey, encryptedValue, options);

    if (this.#notifyHandler && !this.#multiple) {
      this.#notifyHandler({
        type: 'set',
        key,
        value: valueToString,
      });
    }
  }

  public async setMultipleItems(
    param: [string, any, object?][],
    doNotEncrypt?: boolean,
  ): Promise<void> {
    this.#multiple = true;
    await Bluebird.mapSeries(param, ([key, value, options]) => {
      return this.setItem(key, value, doNotEncrypt, options);
    });

    if (this.#notifyHandler) {
      const keys = param.map(([key]) => key);
      const values = param.map(([__, value]) =>
        typeof value === 'object' ? JSON.stringify(value) : String(value),
      );
      this.#notifyHandler({
        type: 'setMultiple',
        key: keys,
        value: values,
      });

      this.#multiple = false;
    }
  }

  public async getItem<T = any>(
    key: string,
    doNotDecrypt = false,
  ): Promise<T | undefined> {
    const decryptValues = this.#doNotEncryptValues || doNotDecrypt;
    const storageKey = this.#getKey(key);
    const item = await this.storage?.getItem(storageKey);

    if (item) {
      const decryptedValue = decryptValues
        ? item
        : this.#encryptation.decrypt(item);

      if (this.#stateManagementUse && !this.#multiple) {
        if (this.#notifyHandler) {
          this.#notifyHandler({
            type: 'get',
            key,
            value: decryptedValue,
          });
        }
        return decryptedValue as unknown as T;
      }

      try {
        const value = JSON.parse(decryptedValue) as T;

        if (this.#notifyHandler && !this.#multiple) {
          this.#notifyHandler({
            type: 'get',
            key,
            value,
          });
        }

        return value;
      } catch (error) {
        if (this.#notifyHandler && !this.#multiple) {
          this.#notifyHandler({
            type: 'get',
            key,
            value: decryptedValue,
          });
        }
        return decryptedValue as unknown as T;
      }
    }

    if (this.#notifyHandler && !this.#multiple) {
      this.#notifyHandler({
        type: 'get',
        key,
        value: undefined,
      });
    }

    return undefined;
  }

  public async getMultipleItems(
    keys: string[],
    doNotDecrypt?: boolean,
  ): Promise<Record<string, any>> {
    this.#multiple = true;
    const result = await Bluebird.reduce(
      keys,
      async (accumulator: Record<string, any>, key) => {
        accumulator[key] = await this.getItem(key, doNotDecrypt);

        return accumulator;
      },
      {},
    );

    if (this.#notifyHandler) {
      this.#notifyHandler({
        type: 'getMultiple',
        key: keys,
        value: result,
      });

      this.#multiple = false;
    }

    return result;
  }

  public async removeItem(key: string): Promise<void> {
    const storageKey = this.#getKey(key);
    await this.storage?.removeItem(storageKey);

    if (this.#notifyHandler && !this.#multiple) {
      this.#notifyHandler({
        type: 'remove',
        key,
      });
    }
  }

  public async removeMultipleItems(keys: string[]): Promise<void> {
    this.#multiple = true;
    await Bluebird.mapSeries(keys, key => {
      return this.removeItem(key);
    });

    if (this.#notifyHandler) {
      this.#notifyHandler({
        type: 'removeMultiple',
        key: keys,
      });
    }

    this.#multiple = false;
  }

  public async keysFromPattern(
    pattern: string | RegExp,
    options: RemoveFromPatternOptions = {} as RemoveFromPatternOptions,
  ): Promise<string[]> {
    const { exact = false } = options;

    const storageKeys =
      (await this.storage?.keys?.()) || Object.keys(this.storage || {}) || [];
    const filteredKeys = storageKeys.filter(key => {
      if (exact) {
        return _.isString(pattern) && key === this.#getKey(pattern);
      }

      const prefixMatched =
        (this.#prefix && key.includes(this.#prefix)) || true;

      return (
        (_.isRegExp(pattern) ? key.match(pattern) : key.includes(pattern)) &&
        prefixMatched
      );
    });

    const keysStrippedOfPrefix = filteredKeys.map(key => {
      const formattedKey = this.#prefix
        ? key.replace(`${this.#prefix}:`, '')
        : key;

      return formattedKey;
    });

    return keysStrippedOfPrefix;
  }

  public async getItemFromPattern(
    pattern: string,
    options: GetFromPatternOptions = {} as GetFromPatternOptions,
  ): Promise<Record<string, any> | undefined> {
    const { multiple = true, doNotDecrypt = false } = options;
    const decryptValues = this.#doNotEncryptValues || doNotDecrypt;

    const filteredKeys = await this.keysFromPattern(pattern, options);

    // # NOTE: TODO: we can probably use node-persist's valuesWithKeyMatch()
    // # instead of processing it here. However, we would need to decrypt each value

    if (!filteredKeys.length) {
      return undefined;
    }

    if (!multiple) {
      return this.getItem(filteredKeys[0], decryptValues);
    }

    return this.getMultipleItems(filteredKeys, decryptValues);
  }

  public async removeItemFromPattern(
    pattern: string,
    options: RemoveFromPatternOptions = {} as RemoveFromPatternOptions,
  ): Promise<void> {
    const filteredKeys = await this.keysFromPattern(pattern, options);

    if (filteredKeys.length === 1) {
      return this.removeItem(filteredKeys[0]);
    }

    return this.removeMultipleItems(filteredKeys);
  }

  public async clear(): Promise<void> {
    await this.storage?.clear();

    if (this.#notifyHandler) {
      this.#notifyHandler({
        type: 'clear',
      });
    }
  }

  public async key(index: number): Promise<string | null> {
    const value =
      (await this.storage?.keys?.())?.[index] ||
      this.storage?.key?.(index) ||
      null;

    if (this.#notifyHandler) {
      this.#notifyHandler({
        type: 'key',
        index,
        value,
      });
    }

    return value;
  }

  /**
   * @deprecated This function will be `deprecated` in ^3.x versions in favor of the encryptValue function and will be removed in the future.
   */
  public encryptString(str: string): string {
    const encryptedValue = this.#encryptation.encrypt(str);

    return encryptedValue;
  }

  /**
   * @deprecated This function will be `deprecated` in ^3.x versions in favor of the decryptValue function and will be removed in the future.
   */
  public decryptString(str: string): string {
    const decryptedValue = this.#encryptation.decrypt(str);

    return decryptedValue;
  }

  public encryptValue(value: any): string {
    const encryptedValue = this.#encryptation.encrypt(JSON.stringify(value));

    return encryptedValue;
  }

  public decryptValue<T = any>(value: string): T {
    const decryptedValue = this.#encryptation.decrypt(value);

    return JSON.parse(decryptedValue) as T;
  }

  public hash(value: string): string {
    return hashSHA256(value, secret.get(this));
  }

  public md5Hash(value: string): string {
    return hashMD5(value, secret.get(this));
  }
}

/* istanbul ignore next */
if (window) {
  /* istanbul ignore next */
  (window as any).EncryptStorage = EncryptStorage;
}

/* istanbul ignore next */
if (window && window?.globalThis) {
  /* istanbul ignore next */
  (window?.globalThis as any).EncryptStorage = EncryptStorage;
}

export default EncryptStorage;
