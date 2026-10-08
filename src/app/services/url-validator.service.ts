import { Injectable } from '@angular/core';
import { globalDomains } from '../../environments/global.domains';
import { DomainType } from '../enum/domain-type.enum';

@Injectable({
  providedIn: 'root',
})
export class UrlValidatorService {
  isValidRedirectUrl(url: string, domainType: DomainType): boolean {
    try {
      // Parse URL to validate structure
      const parsed = new URL(url);

      // Only allow HTTPS protocol
      if (!parsed.protocol.startsWith('https')) {
        return false;
      }

      // Check if URL starts with any allowed domain
      const allowedDomains = globalDomains[domainType] || [];
      const isAllowed = allowedDomains.some((domain) => url.startsWith(domain));

      if (!isAllowed) {
        return false;
      }

      // Security check: Prevent script injection attempts
      const lowerUrl = url.toLowerCase();
      if (
        lowerUrl.includes('javascript:') ||
        lowerUrl.includes('data:') ||
        url.includes('onerror=') ||
        lowerUrl.includes('<script')
      ) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get all allowed domains for a specific domain type
   * @param domainType - The type of domain (EMUDHRA or ABCL)
   * @returns Array of allowed domain URLs
   */
  getAllowedDomains(domainType: DomainType): string[] {
    return globalDomains[domainType] || [];
  }
}
