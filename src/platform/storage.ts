import { createJSONStorage } from 'zustand/middleware';

type StorageLike = {
  getItem: (name: string) => string | null | Promise<string | null>;
  setItem: (name: string, value: string) => void | Promise<void>;
  removeItem: (name: string) => void | Promise<void>;
};

type WxStorage = {
  getStorageSync: (key: string) => string | null | undefined;
  setStorageSync: (key: string, value: string) => void;
  removeStorageSync: (key: string) => void;
};

declare const wx: WxStorage | undefined;

const memoryStorage = new Map<string, string>();

function getRuntimeStorage(): StorageLike {
  if (typeof wx !== 'undefined' && wx.getStorageSync) {
    return {
      getItem: (name) => wx.getStorageSync(name) ?? null,
      setItem: (name, value) => wx.setStorageSync(name, value),
      removeItem: (name) => wx.removeStorageSync(name),
    };
  }

  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }

  return {
    getItem: (name) => memoryStorage.get(name) ?? null,
    setItem: (name, value) => {
      memoryStorage.set(name, value);
    },
    removeItem: (name) => {
      memoryStorage.delete(name);
    },
  };
}

export const appStorage = createJSONStorage(getRuntimeStorage);
