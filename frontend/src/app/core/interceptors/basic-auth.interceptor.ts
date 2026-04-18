import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const basicAuthInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const apiUrl = 'BACKEND_URL_AQUI';
  
  const newReq = req.url.startsWith('/api') 
    ? req.clone({ url: `${apiUrl}${req.url}` }) 
    : req;

  const token = auth.basicToken();
  if (!token || token === btoa(':')) {
    return next(newReq);
  }
  
  return next(newReq.clone({
    setHeaders: { Authorization: `Basic ${token}` }
  }));
};
