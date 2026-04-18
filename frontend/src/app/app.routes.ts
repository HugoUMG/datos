import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/login/pages/login.page').then((m) => m.LoginPage)
  },
  {
    path: 'menu',
    canActivate: [authGuard],
    loadComponent: () => import('./features/menu/pages/menu.page').then((m) => m.MenuPage)
  },
  {
    path: 'adquisiciones',
    canActivate: [authGuard],
    data: { roles: ['ADMINISTRADOR', 'COMPRAS'] },
    loadComponent: () =>
      import('./features/adquisiciones/pages/adquisiciones.page').then((m) => m.AdquisicionesPage)
  },
  {
    path: 'inventario',
    canActivate: [authGuard],
    data: { roles: ['ADMINISTRADOR', 'INVENTARIO'] },
    loadComponent: () => import('./features/inventario/pages/inventario.page').then((m) => m.InventarioPage)
  },
  {
    path: 'asignaciones',
    canActivate: [authGuard],
    data: { roles: ['ADMINISTRADOR', 'INVENTARIO'] },
    loadComponent: () =>
      import('./features/asignaciones/pages/asignaciones.page').then((m) => m.AsignacionesPage)
  },
  {
    path: 'bajas',
    canActivate: [authGuard],
    data: { roles: ['ADMINISTRADOR', 'INVENTARIO'] },
    loadComponent: () => import('./features/bajas/pages/bajas.page').then((m) => m.BajasPage)
  },
  {
    path: 'reportes',
    canActivate: [authGuard],
    data: { roles: ['ADMINISTRADOR', 'FINANZAS', 'INVENTARIO'] },
    loadComponent: () => import('./features/reportes/pages/reportes.page').then((m) => m.ReportesPage)
  },

  {
    path: 'catalogos',
    canActivate: [authGuard],
    data: { roles: ['ADMINISTRADOR', 'INVENTARIO'] },
    loadComponent: () => import('./features/adquisiciones/pages/catalogos.page').then((m) => m.CatalogosPage)
  },

  {
    path: 'admin-empleados',
    canActivate: [authGuard],
    data: { roles: ['ADMINISTRADOR'] },
    loadComponent: () => import('./features/admin-empleados.page').then((m) => m.AdminEmpleadosPage)
  },
  {
    path: 'empleado',
    canActivate: [authGuard],
    data: { roles: ['EMPLEADO', 'ADMINISTRADOR'] },
    loadComponent: () => import('./features/empleado/pages/empleado.page').then((m) => m.EmpleadoPage)
  },
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: '**', redirectTo: 'login' }
];
