export const environment = {
  production: false,
  serviceWorkerEnabled: true,
  title: 'Local',
  apiURL: determineApiUrl().apiUrl,
  msLoginUrl: `${determineApiUrl().apiUrl}/microsoft-login/`,
  cyberArkEnabled: determineApiUrl().cyberArkEnabled,
  msalConfig: {
    auth: {
      clientId: 'd443367d-5b91-4695-8525-f3ad63cfc3c0',
      authority: 'https://login.microsoftonline.com/common',
      redirectUri: `https://${window.location.host}/`,
      postLogoutRedirectUri: '/',
      loginFailedRoute: '/'
    }
  },
  apiConfig: {
    scopes: ['user.read'],
    uri: 'https://graph.microsoft.com/v1.0/me'
  },
  oneDrive: {
    clientId: 'f9fde17d-cf77-4e9a-9e9f-6c219d0bd104',
    redirectUri: `${window.location.origin}/`,
    scopes: ['Files.Read', 'Files.Read.All', 'User.Read']
  }
};

function determineApiUrl() {
  const host = window.location.host;
  const apiUrls: Record<string, string> = {
    'dev.doqfy.in': 'https://dev-api.doqfy.in',
    'uat.doqfy.in': 'https://uat-api.doqfy.in',
    'qa.doqfy.in': 'https://qa-api.doqfy.in',
    'prod.doqfy.in': 'https://prod-api.doqfy.in',
    'demo.doqfy.in': 'https://demo-api.doqfy.in',
    'release.doqfy.in': 'https://release-api.doqfy.in',
    'dev-v1.doqfy.in': 'https://dev-api-v1.doqfy.in',
    'abcluat.doqfy.in': 'https://uat-api.doqfy.in',
    'abcl.doqfy.in': 'https://prod-api.doqfy.in',
    'cicd.doqfy.in': 'https://cicd-api.doqfy.in',
  };

  const apiUrl = apiUrls[host] || 'https://dev-api.doqfy.in';
  const cyberArkEnabled = host.toLowerCase().includes('abcl');

  return { apiUrl, cyberArkEnabled };
}
