export type ToastKind = 'info' | 'success' | 'error';

// One of the "saved" / "that didn't work" messages the CMS shows above the page
export interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}
