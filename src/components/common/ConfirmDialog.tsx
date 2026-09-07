interface ConfirmDialogProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog = ({ title, message, onConfirm, onCancel }: ConfirmDialogProps) => (
  <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/30">
    <section className="w-full max-w-md rounded-lg bg-white p-6 shadow-soft">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-slate-600">{message}</p>
      <div className="mt-6 flex justify-end gap-2">
        <button className="rounded-md border border-border px-4 py-2 text-sm font-semibold" onClick={onCancel}>Cancelar</button>
        <button className="rounded-md bg-danger px-4 py-2 text-sm font-semibold text-white" onClick={onConfirm}>Excluir</button>
      </div>
    </section>
  </div>
);
