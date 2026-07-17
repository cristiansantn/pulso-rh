import { statSync } from "node:fs";
import sharp from "sharp";

/**
 * Prepara uma foto para uso como imagem de fundo em alta resolucao.
 *
 * Uso: node scripts/otimizar-imagem.mjs <origem> <destino> [largura] [qualidade]
 *
 * A largura padrao (2400px) cobre telas 2x sem exagero, e a qualidade alta
 * (92) evita artefatos visiveis — o next/image ainda reencoda a imagem, entao
 * a origem precisa de folga de qualidade para a segunda passagem nao degradar.
 */
const [origem, destino, larguraArg, qualidadeArg] = process.argv.slice(2);

if (!origem || !destino) {
  console.error("Uso: node scripts/otimizar-imagem.mjs <origem> <destino> [largura] [qualidade]");
  process.exit(1);
}

const largura = Number(larguraArg ?? 2400);
const qualidade = Number(qualidadeArg ?? 92);

const entrada = await sharp(origem).metadata();

await sharp(origem)
  .resize({ width: largura, withoutEnlargement: true })
  .webp({ quality: qualidade, effort: 6 })
  .toFile(destino);

const saida = await sharp(destino).metadata();
const kb = (caminho) => Math.round(statSync(caminho).size / 1024);

console.log(`origem : ${entrada.width}x${entrada.height} ${entrada.format} ${kb(origem)} KB`);
console.log(`destino: ${saida.width}x${saida.height} webp ${kb(destino)} KB (q${qualidade})`);
