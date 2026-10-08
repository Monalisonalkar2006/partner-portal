import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'doqfy',
    loadChildren: () =>
      import('./doqfy-components/doqfy.module').then(
        (module) => module.DoqfyModule,
      ),
  },
  {
    path: '',
    loadChildren: () =>
      import('./authentication/authentication.module').then(
        (module) => module.AuthenticationModule,
      ),
  },
];
