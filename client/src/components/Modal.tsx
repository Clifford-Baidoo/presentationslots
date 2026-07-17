import type { ReactNode } from "react";

interface ModalProps {
  onClose?: () => void;
  maxWidthClassName?: string;
  children: ReactNode;
}

export default function Modal({ onClose, maxWidthClassName = "max-w-sm", children }: ModalProps) {
  return (
    <div
      className="fixed inset-0 bg-ink/40 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-md border border-slate-200 w-full p-6 ${maxWidthClassName}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
