import { useEffect, useRef, type ReactNode } from "react";
import { X, ArrowRight, Leaf } from "lucide-react";

export function Modal({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className={wide ? "modal wide" : "modal"}
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div className="modal-head">
        <h2>{title}</h2>
        <button className="icon-btn" aria-label="Schließen" onClick={onClose}>
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function Empty({
  title,
  text,
  action,
  onAction,
}: {
  title: string;
  text: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Leaf size={28} strokeWidth={1.3} />
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
      {action && (
        <button className="btn primary" onClick={onAction}>
          {action}
          <ArrowRight size={16} />
        </button>
      )}
    </div>
  );
}
export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}
export function Num({
  label,
  value,
  onChange,
  min = 0,
  max = 1000,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <Field label={label}>
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        required
        value={value}
        onChange={(e) =>
          onChange(e.target.value === "" ? 0 : Number(e.target.value))
        }
      />
    </Field>
  );
}
export function MovementArt({ small = false }: { small?: boolean }) {
  return (
    <svg
      className={small ? "movement-art small" : "movement-art"}
      viewBox="0 0 440 400"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="246" cy="183" r="148" stroke="currentColor" opacity=".18" />
      <circle cx="246" cy="183" r="119" stroke="currentColor" opacity=".18" />
      <path
        d="M80 357V180a116 116 0 0 1 232 0v177"
        fill="currentColor"
        opacity=".08"
      />
      <path
        d="M102 357V182a94 94 0 0 1 188 0v175"
        stroke="currentColor"
        opacity=".2"
      />
      <circle cx="248" cy="91" r="18" fill="currentColor" />
      <path
        d="M235 122c-12 26-31 50-35 80m36-79 43 34 47-22M209 175l-36-13-45-46m73 85-45 62-42 56m86-118 52 57 56 55"
        stroke="currentColor"
        strokeWidth="14"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M100 342h242M72 357h298" stroke="currentColor" opacity=".35" />
      <path
        d="M350 303c-13-39 0-68 21-82-1 35-8 62-21 82Zm0 12c-25-13-38-35-35-59 23 17 34 35 35 59Z"
        fill="currentColor"
        opacity=".35"
      />
    </svg>
  );
}
