import type { InputHTMLAttributes, ReactNode } from "react";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: ReactNode;
  hint?: string;
}

export default function TextField({ label, icon, hint, className, ...props }: TextFieldProps) {
  return (
    <div>
      {label && <label className="block text-sm font-medium text-ink">{label}</label>}
      <div className={`relative ${label ? "mt-1" : ""}`}>
        {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-light w-4 h-4">{icon}</span>}
        <input
          {...props}
          className={`w-full rounded-md border border-slate-300 py-2.5 text-sm transition-shadow focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand ${
            icon ? "pl-9 pr-3" : "px-3"
          } ${className ?? ""}`}
        />
      </div>
      {hint && <p className="mt-1 text-xs text-ink-light">{hint}</p>}
    </div>
  );
}
