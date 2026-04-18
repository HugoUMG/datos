import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Department, Employee } from '../core/models/api.models';
import { AssetsApiService } from '../core/services/assets-api.service';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <section class="shell">
      <div class="between"><h2>Administración de empleados</h2><a class="back-link" routerLink="/menu">← Volver al menú</a></div>

      <div class="card">
        <h3>Crear empleado</h3>
        <form [formGroup]="employeeForm" (ngSubmit)="createEmployee()" class="grid grid-3">
          <input formControlName="fullName" placeholder="Nombre completo" />
          <input formControlName="email" placeholder="Email" />
          <select formControlName="departmentId">
            <option [ngValue]="null">Selecciona departamento</option>
            <option *ngFor="let dep of departments" [ngValue]="dep.id">{{ dep.name }} ({{ dep.costCenterCode }})</option>
          </select>
          <button type="submit">Crear empleado</button>
        </form>
      </div>

      <div class="card">
        <div class="between"><h3>Lista de empleados</h3><button type="button" (click)="loadData()">Actualizar</button></div>
        <table *ngIf="employees.length">
          <thead><tr><th>ID</th><th>Nombre</th><th>Email</th><th>Departamento</th></tr></thead>
          <tbody><tr *ngFor="let e of employees"><td>{{ e.id }}</td><td>{{ e.fullName }}</td><td>{{ e.email }}</td><td>{{ e.department?.name || '-' }}</td></tr></tbody>
        </table>
      </div>

      <p *ngIf="message">{{ message }}</p>
    </section>
  `
})
export class AdminEmpleadosPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(AssetsApiService);

  departments: Department[] = [];
  employees: Employee[] = [];
  message = '';

  readonly employeeForm = this.fb.group({
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    departmentId: [null, [Validators.required, Validators.min(1)]]
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.api.listDepartments().subscribe({ next: (rows) => (this.departments = rows) });
    this.api.listEmployees().subscribe({ next: (rows) => (this.employees = rows) });
  }

  createEmployee(): void {
    if (this.employeeForm.invalid) return;
    const payload = this.employeeForm.getRawValue();
    this.api.createEmployeeData({
      fullName: payload.fullName!,
      email: payload.email!,
      departmentId: payload.departmentId!
    }).subscribe({
      next: () => {
        this.message = 'Empleado creado correctamente';
        this.employeeForm.reset();
        this.loadData();
      },
      error: (err) => (this.message = err?.error?.error ?? 'No fue posible crear empleado')
    });
  }
}
