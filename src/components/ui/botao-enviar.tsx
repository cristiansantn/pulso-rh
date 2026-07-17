"use client";

import { useFormStatus } from "react-dom";
import { CircleNotch } from "@phosphor-icons/react";

/**
 * Botao de submit com indicador de progresso enquanto a server action roda,
 * para o clique nunca parecer que travou.
 */
export function BotaoEnviar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className={className}>
      {pending && <CircleNotch size={15} className="animate-spin" />}
      {children}
    </button>
  );
}
