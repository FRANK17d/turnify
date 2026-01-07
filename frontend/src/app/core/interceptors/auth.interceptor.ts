import { HttpInterceptorFn, HttpErrorResponse, HttpHandlerFn, HttpRequest, HttpEvent } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { catchError, throwError, switchMap, filter, take, BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// Flag para evitar múltiples llamadas de refresh simultáneas
let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  // No podemos inyectar AuthService aquí circularmente si AuthService usa HttpClient
  // Vamos a hacer la llamada de refresh manualmente usando HttpClient
  // O mejor, extraemos la lógica de refresh a una función o servicio auxiliar si fuera posible,
  // pero para este interceptor funcional, podemos inyectar HttpClient y hacer la llamada.
  const http = inject(HttpClient);

  const token = localStorage.getItem('accessToken');

  let authReq = req;
  const isApiUrl = req.url.startsWith(environment.apiUrl);

  // Agregar token solo a peticiones a nuestra API
  if (token && isApiUrl) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si es 401 y no es una petición de auth (login, refresh, etc)
      if (error.status === 401 && !req.url.includes('/auth/')) {
        return handle401Error(authReq, next, router, http);
      }

      return throwError(() => error);
    })
  );
};

// Función auxiliar para manejar el refresh
function handle401Error(req: HttpRequest<any>, next: HttpHandlerFn, router: Router, http: HttpClient): Observable<HttpEvent<any>> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);
    const refreshToken = localStorage.getItem('refreshToken');

    if (refreshToken) {
      // Llamada manual al endpoint de refresh
      return http.post<any>(`${environment.apiUrl}/auth/refresh`, { refreshToken }).pipe(
        switchMap((response: any) => {
          isRefreshing = false;

          // Guardar nuevos tokens
          localStorage.setItem('accessToken', response.accessToken);
          localStorage.setItem('refreshToken', response.refreshToken);

          // Emitir el nuevo token para desbloquear otras peticiones en cola
          refreshTokenSubject.next(response.accessToken);

          // Reintentar la petición original con el nuevo token
          return next(req.clone({
            setHeaders: {
              Authorization: `Bearer ${response.accessToken}`
            }
          }));
        }),
        catchError((err) => {
          isRefreshing = false;
          // Si falla el refresh, logout forzado
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          router.navigate(['/auth/login']);
          return throwError(() => err);
        })
      );
    } else {
      // No hay refresh token, logout
      isRefreshing = false;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      router.navigate(['/auth/login']);
      return throwError(() => 'No refresh token available');
    }
  } else {
    // Si ya se está refrescando, esperar a que termine y usar el nuevo token
    return refreshTokenSubject.pipe(
      filter(token => token != null),
      take(1),
      switchMap(jwt => {
        return next(req.clone({
          setHeaders: {
            Authorization: `Bearer ${jwt}`
          }
        }));
      })
    );
  }
}

