import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { ShellComponent } from './layout/shell.component';

export const routes: Routes = [
  {
    path: 'login',
    title: 'Ingresar · Gestión de Activos',
    loadComponent: () => import('./features/login/pages/login.page').then((m) => m.LoginPage)
  },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'menu',
        title: 'Inicio · Gestión de Activos',
        loadComponent: () => import('./features/menu/pages/menu.page').then((m) => m.MenuPage)
      },
      {
        path: 'adquisiciones',
        title: 'Adquisiciones · Gestión de Activos',
        canActivate: [authGuard],
        data: { roles: ['ADMINISTRADOR', 'COMPRAS'] },
        loadComponent: () =>
          import('./features/adquisiciones/pages/adquisiciones.page').then((m) => m.AdquisicionesPage)
      },
      {
        path: 'inventario',
        title: 'Inventario · Gestión de Activos',
        canActivate: [authGuard],
        data: { roles: ['ADMINISTRADOR', 'INVENTARIO'] },
        loadComponent: () => import('./features/inventario/pages/inventario.page').then((m) => m.InventarioPage)
      },
      {
        path: 'asignaciones',
        title: 'Asignaciones · Gestión de Activos',
        canActivate: [authGuard],
        data: { roles: ['ADMINISTRADOR', 'INVENTARIO'] },
        loadComponent: () =>
          import('./features/asignaciones/pages/asignaciones.page').then((m) => m.AsignacionesPage)
      },
      {
        path: 'bajas',
        title: 'Bajas · Gestión de Activos',
        canActivate: [authGuard],
        data: { roles: ['ADMINISTRADOR', 'INVENTARIO'] },
        loadComponent: () => import('./features/bajas/pages/bajas.page').then((m) => m.BajasPage)
      },
      {
        path: 'reportes',
        title: 'Reportes · Gestión de Activos',
        canActivate: [authGuard],
        data: { roles: ['ADMINISTRADOR', 'FINANZAS', 'INVENTARIO'] },
        loadComponent: () => import('./features/reportes/pages/reportes.page').then((m) => m.ReportesPage)
      },
      {
        path: 'catalogos',
        title: 'Proveedores y partidas · Gestión de Activos',
        canActivate: [authGuard],
        data: { roles: ['ADMINISTRADOR', 'INVENTARIO', 'COMPRAS'] },
        loadComponent: () => import('./features/adquisiciones/pages/catalogos.page').then((m) => m.CatalogosPage)
      },
      {
        path: 'admin-empleados',
        title: 'Empleados · Gestión de Activos',
        canActivate: [authGuard],
        data: { roles: ['ADMINISTRADOR'] },
        loadComponent: () => import('./features/admin-empleados.page').then((m) => m.AdminEmpleadosPage)
      },
      {
        path: 'usuarios',
        title: 'Usuarios · Gestión de Activos',
        canActivate: [authGuard],
        data: { roles: ['ADMINISTRADOR'] },
        loadComponent: () => import('./features/usuarios/pages/usuarios.page').then((m) => m.UsuariosPage)
      },
      {
        path: 'empleado',
        title: 'Mis activos · Gestión de Activos',
        canActivate: [authGuard],
        data: { roles: ['EMPLEADO', 'ADMINISTRADOR'] },
        loadComponent: () => import('./features/empleado/pages/empleado.page').then((m) => m.EmpleadoPage)
      },
      { path: '', pathMatch: 'full', redirectTo: 'menu' }
    ]
  },
  { path: '**', redirectTo: 'menu' }
];
