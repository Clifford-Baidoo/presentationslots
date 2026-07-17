import Modal from "./Modal";

interface ConfirmDialogProps {
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
}

// A single component covers both "confirm" (Cancel + action) and "alert" (single
// button, omit cancelLabel) dialogs, replacing window.confirm()/alert() with
// something styled consistently with the rest of the app.
export default function ConfirmDialog({
  title,
  description,
  confirmLabel,
  cancelLabel,
  destructive,
  busy,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal onClose={onCancel ?? onConfirm}>
      <h2 className={`text-lg font-semibold ${destructive ? "text-red-600" : "text-ink"}`}>{title}</h2>
      <p className="text-sm text-ink-light mt-2 leading-relaxed">{description}</p>
      <div className="flex gap-2 pt-5">
        {cancelLabel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-md border border-slate-300 py-2 text-sm font-medium text-ink hover:bg-slate-50"
          >
            {cancelLabel}
          </button>
        )}
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className={`flex-1 rounded-md py-2 text-sm font-semibold text-white disabled:opacity-50 ${
            destructive ? "bg-red-600 hover:bg-red-700" : "bg-brand hover:bg-brand-dark"
          }`}
        >
          {busy ? "Working…" : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
