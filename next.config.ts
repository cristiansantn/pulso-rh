import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Existe um package-lock.json solto no diretorio do usuario; fixar a raiz
  // evita que o Turbopack infira o workspace errado.
  turbopack: {
    root: __dirname,
  },
  images: {
    // No Next 16 o padrao aceita apenas quality 75 e coage silenciosamente
    // qualquer outro valor para ele. A foto do login e reencodada pelo
    // otimizador em cima de um arquivo ja comprimido; sem liberar 100 aqui,
    // o quality={100} da pagina nao teria efeito e a dupla compressao
    // degradaria a imagem.
    qualities: [75, 100],
  },
};

export default nextConfig;
