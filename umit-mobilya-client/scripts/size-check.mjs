import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Ana paketin tavanini korur.
 *
 * Bu repoda CI yok; paket boyutu sessizce siser ve bunu kimse gormez. Bir kez
 * olculdu: menuye urun listesi eklenirken bir composable registry'yi import
 * etti ve ana paket 1 741 -> 2 237 kB oldu. Hicbir test kirilmadi, hicbir
 * uyari cikmadi.
 *
 * Tavan bir hedef degil bir ALARM: bugunku degerin bir miktar ustunde duruyor
 * ki normal buyume otmesin ama sicrama otsun.
 */
const LIMIT_KB = 1800;
const DIST = new URL('../dist/assets/', import.meta.url).pathname;

const files = await readdir(DIST).catch(() => null);

if (!files) {
  process.stderr.write("dist/ yok. Once 'yarn build' calistir.\n");
  process.exit(1);
}

const entry = files.filter((name) => /^index-.*\.js$/.test(name));

if (entry.length !== 1) {
  process.stderr.write(
    `Ana paket bulunamadi (${entry.length} aday). Once 'yarn build' calistir.\n`,
  );
  process.exit(1);
}

const { size } = await stat(join(DIST, entry[0]));
const kb = size / 1024;

process.stdout.write(`ana paket: ${kb.toFixed(2)} kB (tavan ${LIMIT_KB} kB)\n`);

if (kb > LIMIT_KB) {
  process.stderr.write(
    `\nTAVAN ASILDI. ${(kb - LIMIT_KB).toFixed(2)} kB fazla.\n\n` +
      `Once sunu sor: her zaman yuklenen bir dosya, tembel olmasi gereken bir\n` +
      `seyi import ediyor mu? (Three.js, urun tanimlari, admin ekranlari.)\n` +
      `Kural: .claude/rules/10-product-modules.md\n`,
  );
  process.exit(1);
}
