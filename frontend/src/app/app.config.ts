import { registerLocaleData } from '@angular/common';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import localeEsGt from '@angular/common/locales/es-GT';
import {
  ApplicationConfig,
  DEFAULT_CURRENCY_CODE,
  LOCALE_ID,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { basicAuthInterceptor } from './core/interceptors/basic-auth.interceptor';

import { routes } from './app.routes';

registerLocaleData(localeEsGt);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([basicAuthInterceptor])),
    // Fechas dd/MM/yyyy y montos en quetzales (Q) en toda la app.
    { provide: LOCALE_ID, useValue: 'es-GT' },
    { provide: DEFAULT_CURRENCY_CODE, useValue: 'GTQ' }
  ]
};
