import { Branch } from './branch.model';

export class UserLogin {
  user_uuid: string = '';
  user_first_name: string = '';
  user_last_name: string = '';
  user_email: string = '';
  account_uuid: string = '';
  presigned_s3_url: string = '';
  info: string = '';
  business_config: {
    business_estamp_detail: string;
    formula_type: number;
    preselectDocType: string;
    is_stamp_option_required: boolean;
  };
  selectedBranch: Branch;
}

export class ABCLLoginUrl {
  login_url: string = this.getLoginUrl();
  base_url: string = '/login';

  private getLoginUrl(): string {
    const host = window.location.host;
    if (host.includes('abclprod')) {
      return 'https://abclprod.doqfy.in';
    }
    return 'https://abcluat.doqfy.in';
  }
}

export class LoginFlowConstants {
  role: string = 'role';
  accessToken: string = 'accessToken';
  error: string = 'error';
  wentWrongMessage: string = 'Something went wrong';
  documentNotFoundMessage: string = 'Document Not Found';
}

export class CyberArkConstants {
  static readonly CYBER_ARK_URLS = {
    UAT: 'https://aaq4824.id.cyberark.cloud/OAuth2/Authorize/abcldoqfyuat?response_type=code&client_id=64aceba3-add9-4299-a71f-d27773bae8bc&client_secret=cldoqfyuat&redirect_uri=https://uat.doqfy.in/cyberark-login&scope=openid&state=abc&nonce=',
    PROD: 'https://aaq4824.id.cyberark.cloud/OAuth2/Authorize/abcldoqfyprod?response_type=code&client_id=1755ebe6-8dea-4d70-a703-36f0d197a443&client_secret=cldoqfyprod&redirect_uri=https://prod.doqfy.in/cyberark-login&scope=openid&state=abc&nonce=',
  };

  static readonly HOST_IDENTIFIERS = {
    ABCL: 'abcl',
    ABCL_UAT: 'abcluat',
  };
}
