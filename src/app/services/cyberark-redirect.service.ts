import { Injectable } from '@angular/core';
import { UrlValidatorService } from './url-validator.service';
import { DomainType } from '../enum/domain-type.enum';
import { environment } from '../../environments/environment';
import { CyberArkConstants } from '../models/user-login.model';

@Injectable({ providedIn: 'root' })
export class CyberArkRedirectService {
  constructor(private urlValidator: UrlValidatorService) {}

  private readonly cyberArkUrls = {
    uat: CyberArkConstants.CYBER_ARK_URLS.UAT,
    prod: CyberArkConstants.CYBER_ARK_URLS.PROD,
  };

  checkAndRedirect(): boolean {
    const currentUrl = window.location.href;
    const currentHost = window.location.host;

    const isAbcl = currentHost.includes(
      CyberArkConstants.HOST_IDENTIFIERS.ABCL
    );
    const isCyberArkEnabled = environment.cyberArkEnabled;

    if (isAbcl && isCyberArkEnabled) {
      const isProd = !currentHost.includes(
        CyberArkConstants.HOST_IDENTIFIERS.ABCL_UAT
      );
      const cyberArkUrl = isProd
        ? this.cyberArkUrls.prod
        : this.cyberArkUrls.uat;

      window.location.href = cyberArkUrl;
      return true;
    }
    return false;
  }
}
