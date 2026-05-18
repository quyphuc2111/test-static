// @ts-ignore - No type definitions available
import Cookies from 'js-cookie';

class StorageService {
  private readonly isBrowser: boolean;
  private readonly prefix: string = "bkt";
  private readonly defaultExpires: number = 365; //1 năm

  constructor() {
    this.isBrowser = typeof window !== "undefined";
  }

  set<T>(key: string, value: T, expires?: number): void {
    if (!this.isBrowser) return;
    
    const expirationDays = key === 'refresh_token' ? 365 : (expires || this.defaultExpires);
    
    Cookies.set(`${this.prefix}_${key}`, JSON.stringify(value), {
      expires: expirationDays,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    
    if (key === 'access_token' || key === 'refresh_token') {
      window.dispatchEvent(new CustomEvent('tokenUpdated', { detail: { key, action: 'set' } }));
    }
  }

  get<T>(key: string): T | null {
    if (!this.isBrowser) return null;
    const item = Cookies.get(`${this.prefix}_${key}`);
    if (!item) return null;
    
    try {
      return JSON.parse(item) as T; 
    } catch (e) {
      console.warn(`Error parsing cookie key "${key}"`, e);
      return null;
    }
  }

  remove(key: string): void {
    if (!this.isBrowser) return;
    Cookies.remove(`${this.prefix}_${key}`, { path: '/' });
    
    if (key === 'access_token' || key === 'refresh_token') {
      window.dispatchEvent(new CustomEvent('tokenUpdated', { detail: { key, action: 'remove' } }));
    }
  }

  clear(): void {
    if (!this.isBrowser) return;
    // Xóa tất cả các cookie có prefix
    Object.keys(Cookies.get())
      .filter(key => key.startsWith(this.prefix))
      .forEach(key => Cookies.remove(key, { path: '/' }));
  }
}

export default new StorageService();
