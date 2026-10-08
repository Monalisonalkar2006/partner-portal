import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AbclService {
  private logoutUrl: string | null = null;

  setLogoutUrl(url: string): void {
    this.logoutUrl = url;
  }

  getLogoutUrl(): string | null {
    return this.logoutUrl;
  }

  clearLogoutUrl(): void {
    this.logoutUrl = null;
  }
}
