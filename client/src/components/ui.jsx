// Pequeños componentes de UI reutilizables.

export function Card({ title, action, children, className = '' }) {
  return (
    <section className={`rounded-xl bg-white shadow-sm ring-1 ring-slate-200 ${className}`}>
      {(title || action) && (
        <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          {title && <h2 className="text-sm font-semibold text-slate-700">{title}</h2>}
          {action}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h3 className="text-base font-semibold text-slate-800">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </header>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

export function Button({ variant = 'primary', className = '', ...props }) {
  const variants = {
    primary: 'bg-brand-600 text-white hover:bg-brand-700',
    ghost: 'bg-slate-100 text-slate-700 hover:bg-slate-200',
    danger: 'bg-red-50 text-red-600 hover:bg-red-100',
  };
  return (
    <button
      className={`rounded-lg px-3 py-2 text-sm font-medium transition disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}

export function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600">{label}</span>
      {children}
    </label>
  );
}

export function Input(props) {
  return (
    <input
      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
      {...props}
    />
  );
}

export function Select(props) {
  return (
    <select
      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
      {...props}
    />
  );
}

export function Spinner() {
  return (
    <div className="flex justify-center py-8">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600" />
    </div>
  );
}

export function Empty({ children }) {
  return <p className="py-8 text-center text-sm text-slate-400">{children}</p>;
}
