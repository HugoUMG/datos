import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { resolveApiUrl } from '../config/api-base-url';
import { AuthService } from '../services/auth.service';

export const basicAuthInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const apiReq = req.clone({ url: resolveApiUrl(req.url) });
  const token = auth.basicToken();
  const authed = !token || token === btoa(':') ? apiReq : apiReq.clone({ setHeaders: { Authorization: `Basic ${token}` } });

  return next(authed).pipe(
    catchError((err: unknown) => {
      // Credenciales que dejaron de ser válidas a mitad de sesión: volver al login.
      const isLoginCall = req.url.endsWith('/api/auth/me');
      if (err instanceof HttpErrorResponse && err.status === 401 && !isLoginCall && auth.isLoggedIn()) {
        auth.logout();
        router.navigate(['/login'], { queryParams: { expirada: 1 } });
      }
      return throwError(() => err);
    })
  );
};
