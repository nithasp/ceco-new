import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Toast, ToastKind } from 'src/app/interfaces';

const AUTO_DISMISS_MS = 4500;

// One place for the "saved" and "that didn't work" messages the CMS shows, so no component has to
// own its own banner state
@Injectable()
export class NotifyService {
  private readonly toastSubject = new BehaviorSubject<Toast[]>([]);
  readonly toasts$ = this.toastSubject.asObservable();

  private nextId = 1;

  success(message: string): void {
    this.push('success', message);
  }

  error(message: string): void {
    this.push('error', message);
  }

  info(message: string): void {
    this.push('info', message);
  }

  dismiss(id: number): void {
    this.toastSubject.next(this.toastSubject.value.filter((toast) => toast.id !== id));
  }

  private push(kind: ToastKind, message: string): void {
    const toast: Toast = { id: this.nextId++, kind, message };
    this.toastSubject.next([...this.toastSubject.value, toast]);

    // An error stays until it is dismissed; anything else clears itself
    if (kind !== 'error') setTimeout(() => this.dismiss(toast.id), AUTO_DISMISS_MS);
  }
}
