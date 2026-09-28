import { Component, inject } from '@angular/core';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  template: `
    <div class="toast-container" role="status" aria-live="polite" aria-atomic="false">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast" [class]="'toast-' + toast.type">
          <span class="toast-msg">{{ toast.message }}</span>
          <button
            class="toast-close"
            type="button"
            (click)="toastService.dismiss(toast.id)"
            [attr.aria-label]="'Cerrar aviso: ' + toast.message"
          >&times;</button>
        </div>
      }
    </div>
  `,
  styles: `
    .toast-container {
      position: fixed;
      bottom: 1.5rem;
      right: 1.5rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      max-width: 400px;
    }
    .toast {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      padding: 14px 22px;
      border-radius: var(--radius-sm);
      box-shadow: var(--shadow-lg);
      font-size: 0.85rem;
      animation: slideIn 0.3s ease;
    }
    .toast-success { background: #e8f5e9; color: #2e7d32; }
    .toast-error { background: #fbe9e7; color: #c62828; }
    .toast-info { background: #e3f2fd; color: #1565c0; }
    .toast-msg { flex: 1; }
    .toast-close {
      background: none;
      border: none;
      font-size: 1.25rem;
      line-height: 1;
      opacity: 0.6;
      color: inherit;
      padding: 0 0.25rem;
    }
    .toast-close:hover { opacity: 1; }
    @keyframes slideIn {
      from { opacity: 0; transform: translateX(100%); }
      to { opacity: 1; transform: translateX(0); }
    }
  `
})
export class ToastComponent {
  toastService = inject(ToastService);
}
