// Create a web storage adapter for Supabase
export const webStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === "undefined") {
      return null;
    }
    return window.localStorage.getItem(key);
  },
  setItem: (key: string, value: string) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(key, value);
    }
  },
  removeItem: (key: string) => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(key);
    }
  },
};
