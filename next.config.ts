import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Existe um package-lock.json solto no diretorio do usuario; fixar a raiz
  // evita que o Turbopack infira o workspace errado.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
