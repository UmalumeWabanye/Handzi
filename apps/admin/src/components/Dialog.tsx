import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

type Props = { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; wide?: boolean };

/** Accessible modal built on <dialog>: focus trap, Esc to close, backdrop click to close. */
export function Dialog({ open, onClose, title, children, footer, wide }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className={`w-[calc(100%-2rem)] ${wide ? 'max-w-3xl' : 'max-w-md'} rounded-xl bg-white p-0 shadow-raised backdrop:bg-hz-charcoal/50 open:animate-fade-up`}
      aria-labelledby="dialog-title"
    >
      {open && (
        <div className="flex max-h-[85vh] flex-col">
          <div className="flex items-center justify-between border-b border-hz-line px-5 py-4">
            <h2 id="dialog-title" className="font-display text-h2">
              {title}
            </h2>
            <button onClick={onClose} className="flex h-12 w-12 items-center justify-center rounded-md text-hz-steel hover:bg-hz-chalk" aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="overflow-y-auto px-5 py-4">{children}</div>
          {footer && <div className="flex justify-end gap-2 border-t border-hz-line px-5 py-4">{footer}</div>}
        </div>
      )}
    </dialog>
  );
}
