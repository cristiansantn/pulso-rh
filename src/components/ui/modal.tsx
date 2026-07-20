"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "@phosphor-icons/react";

interface ModalProps {
  aberto: boolean;
  onFechar: () => void;
  titulo: string;
  children: ReactNode;
}

export function Modal({ aberto, onFechar, titulo, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (aberto && !el.open) el.showModal();
    if (!aberto && el.open) el.close();
  }, [aberto]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onFechar}
      className="fixed inset-0 m-auto w-full max-w-2xl rounded-xl border border-line bg-panel p-0 shadow-xl backdrop:bg-black/40"
    >
      <div className="flex items-center justify-between border-b border-line px-6 py-4">
        <h2 className="text-sm font-semibold text-ink">{titulo}</h2>
        <button
          type="button"
          onClick={onFechar}
          className="rounded-md p-1 text-ink-muted transition-colors hover:bg-neutral-soft hover:text-ink"
        >
          <X size={16} />
        </button>
      </div>
      <div className="px-6 py-5">{children}</div>
    </dialog>
  );
}
