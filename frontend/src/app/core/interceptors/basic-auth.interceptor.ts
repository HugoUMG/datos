import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const basicAuthInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  if (!auth.isLoggedIn()) {
    return next(req);
  }

  const authenticated = req.clone({
    setHeaders: {
      Authorization: `Basic ${auth.basicToken()}`
    }
  });

  return next(authenticated);
};
