import { jsonParseSafe } from '@fxn/common';

export function getDataSavedInLocalStorage<T extends object>(key: string): T {
  return jsonParseSafe<T>(localStorage.getItem(key.toLowerCase()) || undefined) || ({} as T);
}

export function saveDataToLocalStorage(key: string, data?: object) {
  localStorage.setItem(key.toLowerCase(), JSON.stringify(data));
}
