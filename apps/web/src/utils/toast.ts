import { createElement, type ReactNode } from "react";
import { toast, type ToastOptions } from "react-hot-toast";
import { AlertTriangle, CheckCircle2, Info, OctagonAlert } from "lucide-react";

type ToastVariant = "warning" | "success" | "error" | "info";

interface VariantConfig {
  icon: ReactNode;
  style?: ToastOptions["style"];
  iconTheme?: ToastOptions["iconTheme"];
}

const baseOptions: ToastOptions = {
  duration: 3000,
};

const baseStyle: NonNullable<ToastOptions["style"]> = {
  fontSize: "0.875rem",
  borderRadius: "12px",
  padding: "12px 16px",
  border: "1px solid rgba(15, 23, 42, 0.08)",
  boxShadow: "0 12px 30px rgba(15, 23, 42, 0.12)",
  backgroundColor: "#f9fafb",
  color: "#111827",
};

const variantStyles: Record<ToastVariant, VariantConfig> = {
  warning: {
    icon: createElement(AlertTriangle, {
      className: "h-4 w-4 text-amber-600",
    }),
    style: {
      backgroundColor: "#fef3c7",
      color: "#92400e",
      border: "1px solid #fde68a",
    },
  },
  success: {
    icon: createElement(CheckCircle2, {
      className: "h-4 w-4 text-emerald-600",
    }),
    style: {
      backgroundColor: "#ecfdf5",
      color: "#047857",
      border: "1px solid #bbf7d0",
    },
  },
  error: {
    icon: createElement(OctagonAlert, {
      className: "h-4 w-4 text-rose-600",
    }),
    style: {
      backgroundColor: "#fee2e2",
      color: "#b91c1c",
      border: "1px solid #fecaca",
    },
  },
  info: {
    icon: createElement(Info, {
      className: "h-4 w-4 text-sky-600",
    }),
    style: {
      backgroundColor: "#e0f2fe",
      color: "#0369a1",
      border: "1px solid #bae6fd",
    },
  },
};

const showVariantToast = (
  message: string,
  variant: ToastVariant,
  options?: ToastOptions
) => {
  const variantOption = variantStyles[variant];
  return toast(message, {
    ...baseOptions,
    ...options,
    icon: variantOption.icon,
    style: {
      ...baseStyle,
      ...variantOption.style,
      ...(options?.style ?? {}),
    },
  });
};

export const showWarningToast = (message: string, options?: ToastOptions) =>
  showVariantToast(message, "warning", options);

export const showSuccessToast = (message: string, options?: ToastOptions) =>
  showVariantToast(message, "success", options);

export const showErrorToast = (message: string, options?: ToastOptions) =>
  showVariantToast(message, "error", options);

export const showInfoToast = (message: string, options?: ToastOptions) =>
  showVariantToast(message, "info", options);

