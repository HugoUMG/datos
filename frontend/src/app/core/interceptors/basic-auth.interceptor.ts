import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { resolveApiUrl } from '../config/api-base-url';
import { AuthService } from '../services/auth.service';

export const basicAuthInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  const apiReq = req.clone({ url: resolveApiUrl(req.url) });
  const token = auth.basicToken();
  if (!token || token === btoa(':')) {
    return next(apiReq);
  }

  return next(
    apiReq.clone({
      setHeaders: { Authorization: `Basic ${token}` }
    })
  );
};
