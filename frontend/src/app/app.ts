import { Component, HostListener, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConfirmService } from './core/services/confirm.service';
import { ToastService } from './core/services/toast.service';
import { IconComponent } from './shared/ui';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, IconComponent],
  template: `
    <router-outlet />

    <div class="toasts" aria-live="polite">
      @for (t of toast.toasts(); track t.id) {
        <div class="toast" [class]="'toast toast-' + t.kind" role="status">
          <p>{{ t.text }}</p>
          <button type="button" (click)="toast.dismiss(t.id)" aria-label="Cerrar"><app-icon name="x" [size]="16" /></button>
        </div>
      }
    </div>

    @if (confirm.pending(); as c) {
      <div class="modal-backdrop" (click)="confirm.close(false)">
        <div class="modal" role="dialog" aria-modal="true" [attr.aria-label]="c.title" (click)="$event.stopPropagation()">
          <h2>{{ c.title }}</h2>
          <p class="muted">{{ c.message }}</p>
          <div class="modal-actions">
            <button type="button" class="btn-secondary" (click)="confirm.close(false)">Cancelar</button>
            <button type="button" [class.btn-danger]="c.danger" (click)="confirm.close(true)">{{ c.confirmText || 'Confirmar' }}</button>
          </div>
        </div>
      </div>
    }
  `
})
export class App {
  readonly toast = inject(ToastService);
  readonly confirm = inject(ConfirmService);

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.confirm.pending()) this.confirm.close(false);
  }
}
