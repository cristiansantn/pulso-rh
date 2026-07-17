import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Existe um package-lock.json solto no diretorio do usuario; fixar a raiz
  // evita que o Turbopack infira o workspace errado.
  turbopack: {
    root: __dirname,
  },
  images: {
    // No Next 16 o padrao aceita apenas quality 75 e coage silenciosamente
    // qualquer outro valor para ele — sem liberar 90 aqui, a foto do login
    // seria reencodada a 75 em cima de um arquivo ja comprimido e perderia
    // definicao. Em webp, 90 e indistinguivel de 100 e pesa um terco.
    qualities: [75, 90],
  },
};

export default nextConfig;
