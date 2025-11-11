declare module "react-hot-toast" {
  import type { ReactNode, FC, CSSProperties } from "react";

  interface ToastIconTheme {
    primary: string;
    secondary: string;
  }

  interface ToastOptions {
    icon?: ReactNode;
    id?: string;
    duration?: number;
    style?: CSSProperties;
    iconTheme?: ToastIconTheme;
  }

  interface Toast {
    (message: ReactNode, options?: ToastOptions): string;
    dismiss: (toastId?: string) => void;
    remove: (toastId?: string) => void;
    success: (message: ReactNode, options?: ToastOptions) => string;
    error: (message: ReactNode, options?: ToastOptions) => string;
    loading: (message: ReactNode, options?: ToastOptions) => string;
  }

  export const toast: Toast;

  export interface ToasterProps {
    position?:
      | "top-left"
      | "top-center"
      | "top-right"
      | "bottom-left"
      | "bottom-center"
      | "bottom-right";
    reverseOrder?: boolean;
    toastOptions?: ToastOptions & {
      success?: ToastOptions;
      error?: ToastOptions;
      loading?: ToastOptions;
    };
  }

  export const Toaster: FC<ToasterProps>;
}

