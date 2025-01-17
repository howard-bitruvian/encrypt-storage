export type EncAlgorithm = 'AES' | 'Rabbit' | 'RC4' | 'RC4Drop';

type StorageType = 'localStorage' | 'sessionStorage';

type ChangeType =
  | 'set'
  | 'get'
  | 'getMultiple'
  | 'setMultiple'
  | 'remove'
  | 'removeMultiple'
  | 'clear'
  | 'length'
  | 'key';

export interface NotifyHandlerParams {
  type: ChangeType;
  key?: string | string[];
  value?: any;
  index?: number;
}

export type NotifyHandler = (params: NotifyHandlerParams) => void;

export interface Encryptation {
  encrypt(value: string): string;
  decrypt(value: string): string;
}

export interface AsyncStorageInterface {
  setItem(key: string, value: any, options?: object): void;
  getItem(key: string): any;
  removeItem(key: string): any;
  clear(): any;
  key?(index: number): Promise<string> | string | null;
  keys?(): Promise<string[]> | string[];
  // keys? :() => Promise<string[]> | string[];
  length: number | (() => Promise<number>);
  // # This interface is only for async storage interface
}

export interface EncryptStorageOptions {
  prefix?: string;
  stateManagementUse?: boolean;
  storageType?: StorageType;
  encAlgorithm?: EncAlgorithm;
  doNotEncryptValues?: boolean;
  notifyHandler?: NotifyHandler;
  storage?: Storage | AsyncStorageInterface;
}

export interface RemoveFromPatternOptions {
  exact?: boolean;
}

export interface GetFromPatternOptions extends RemoveFromPatternOptions {
  multiple?: boolean;
  doNotDecrypt?: boolean;
}

export interface EncryptStorageInterface {
  // #  extends Storage //# NOTE: cannot extend typescript Storage because we want to define a length() method, not a getter
  /**
   * `setItem` - Is the function to be set `safeItem` in `selected storage`
   * @param {string} key - Is the key of `data` in `selected storage`.
   * @param {any} value - Value to be `encrypted`, the same being a `string` or `object`.
   * @return {void} `void`
   * @usage
   * 		setItem('any_key', {key: 'value', another_key: 2})
   * 		setItem('any_key', 'any value')
   */
  setItem(key: string, value: any, doNotEncrypt?: boolean): Promise<void>;

  /**
   * `setMultipeItems` - Is the function to be set `safeItem` in `selected storage`
   * @param {[string, any][]} param - .
   * @param {any} value - It's an `array` of `tuples` to be set at once...
   * @return {void} `void`
   * @usage
   * 		setItem(['any_key', {key: 'value', another_key: 2}])
   * 		setItem(['any_key', 'any value'])
   */
  setMultipleItems(
    param: [string, any][],
    doNotEncrypt?: boolean,
  ): Promise<void>;

  /**
   * `hash` - Is the function to be `hash` value width SHA256 encryptation
   * @param {any} value - Value to be `hashed`, the same being a `string`.
   * @return {string} `hashed string`
   * @usage
   * 		hash('any_string')
   */
  hash(value: string): string;

  /**
   * `md5Hash` - Is the function to be `hash` value width MD5 encryptation
   * @param {any} value - Value to be `hashed`, the same being a `string`.
   * @return {string} `hashed string`
   * @usage
   * 		md5Hash('any_string')
   */
  md5Hash(value: string): string;

  /**
   * `getItem` - Is the function to be get `safeItem` in `selected storage`
   * @param {string} key - Is the key of `data` in `selected storage`.
   * @return {string | any | undefined} - Returns a formatted value when the same is an object or string when not.
   * Returns `undefined` when value not exists.
   * @usage
   * 		getItem('any_key') -> `{key: 'value', another_key: 2}`
   * 		getItem('any_key') -> `'any value'`
   */
  getItem(
    key: string,
    doNotDecrypt?: boolean,
  ): Promise<string | any | undefined>;

  /**
   * `getMulpleItems` - Is the function to be get `safeItems` in `selected storage`
   * @param {string[]} keys - Is the keys of `data` in `selected storage`.
   * @return {Record<string, any> | undefined} - Returns a formatted value when the same is an object or string when not.
   * Returns `undefined` when value not exists.
   * @usage
   * 		getMultipleItems(['any_key']) -> `{any_key: {key: 'value', another_key: 2}}`
   * 		getMultipleItems(['any_key']) -> `{any_key: 'any value'}`
   */
  getMultipleItems(
    keys: string[],
    doNotDecrypt?: boolean,
  ): Promise<Record<string, any>>;

  /**
   * `removeItem` - Is the function to be remove `safeItem` in `selected storage`
   * @param {string} key - Is the key of `data` in `selected storage`.
   * @return {void}
   * Returns `void`.
   * @usage
   * 		removeItem('any_key')
   */
  removeItem(key: string): Promise<void>;

  /**
   * `removeMultipleItems` - Is the function to be remove `safeItems` in `selected storage`
   * @param {string[]} keys - Is the keys of `data` in `selected storage`.
   * @return {void}
   * Returns `void`.
   * @usage
   * 		removeMultipleItems(['any_key_1'm 'any_key_2'])
   */
  removeMultipleItems(keys: string[]): Promise<void>;

  /**
   * `keysFromPattern` - returns matching keys based on pattern
   * @param {string|RegExp} pattern - string match or RegExp match.
   * @return {string[]}
   * Returns `string[]`.
   * @usage
   *        itemKey = '12345678:user'
   *        another itemKey = '12345678:item'
   * 		keysFromPattern('12345678') -> ['12345678:user', '12345678:item']
   */
  keysFromPattern(
    pattern: string | RegExp,
    options?: RemoveFromPatternOptions,
  ): Promise<string[]>;

  /**
   * `getItemFromPattern` - Is the function to be get `safeItem` in `selected storage` from `pattern` based
   * @param {string} pattern - Is the pattern existent in keys of `selected storage`.
   * @return {any | Record<string, any> | undefined}
   * Returns `void`.
   * @usage
   *        itemKey = '12345678:user'
   *        another itemKey = '12345678:item'
   * 		getItemFromPattern('12345678') -> {'12345678:user': 'value', '12345678:item': 'otherValue'}
   */
  getItemFromPattern(
    pattern: string,
    options?: GetFromPatternOptions,
  ): Promise<Record<string, any> | any | undefined>;

  /**
   * `removeItemFromPattern` - Is the function to be remove `safeItem` in `selected storage` from `pattern` based
   * @param {string} pattern - Is the pattern existent in keys of `selected storage`.
   * @return {void}
   * Returns `void`.
   * @usage
   *        itemKey = '12345678:user'
   *        another itemKey = '12345678:item'
   * 		removeItem('12345678') -> item removed from `selected storage`
   */
  removeItemFromPattern(
    pattern: string,
    options?: RemoveFromPatternOptions,
  ): Promise<void>;

  /**
   * `clear` - Clear all selected storage
   */
  clear(): Promise<void>;

  /**
   * `key` - Return a `key` in selected storage index or `null`
   * @param {number} index - Index of `key` in `selected storage`
   */
  key(index: number): Promise<string | null>;

  /**
   *
   * `encryptString` - Is the function to be `encrypt` any string and return encrypted value
   * @param {string} str - A `string` to be encrypted.
   * @return {string} result
   * Returns `string`.
   * @usage
   * 		encryptString('any_string') -> 'encrypted value'
   */
  encryptString(str: string): string;

  /**
   *
   * `decryptString` - Is the function to be `decrypt` any string encrypted by `encryptString` and return decrypted value
   * @param {string} str - A `string` to be decrypted.
   * @return {string} result
   * Returns `string`.
   * @usage
   * 		decryptString('any_string') -> 'decrypted value'
   */
  decryptString(str: string): string;

  /**
   * `encryptValue` - Is the function to be `encrypt` any value and return encrypted value
   * @param {string} value - A `value|object|array` to be encrypted.
   * @return {string} result
   * Returns `string`.
   * @usage
   * 		encryptString('any_string') -> 'encrypted value'
   */
  encryptValue(value: any): string;

  /**
   * `decryptString` - Is the function to be `decrypt` any value encrypted by `encryptValue` and return decrypted value
   * @param {string} value - A `value|object|array` to be decrypted.
   * @return {T|any} result
   * Returns `string`.
   * @usage
   * 		decryptString('any_value') -> '{value: "decrypted value"}'
   */
  decryptValue<T = any>(key: string): T;
}
