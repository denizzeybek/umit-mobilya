const { mkdir, readdir, readFile, rm, writeFile } = require('node:fs/promises');
const { dirname, join, relative, resolve } = require('node:path');

/**
 * Fiyat motorunu istemciden sunucuya kopyalar.
 *
 * Neden kopya: teklif kaydedilirken tutar SUNUCUDA yeniden hesaplanmalı.
 * İstemcinin gönderdiği rakamı saklamak, admin panelindeki her sayıyı
 * "istemcinin iddiası" yapardı. Ama fiyatı yalnızca sunucu hesaplasaydı her
 * kaydırıcı hareketi bir istek olurdu ve konfigüratör kullanılamazdı.
 *
 * Neden CommonJS: `nest build`den ÖNCE çalışması gerekiyor (derleyeceği
 * dosyaları bu üretiyor), ve aynı modülü jest de import ediyor — spec'in
 * test ettiği mantığı kopyalamaması için.
 */
const CLIENT = resolve(
  __dirname,
  '../../umit-mobilya-client/src/views/configurator/_etc',
);
const SERVER = resolve(__dirname, '../src/configurator/generated');

/**
 * Taşınabilir çekirdek: Vue ve Three.js bilmeyen her şey.
 *
 * `options.ts` fiyat motorunun parçası değil ama fiyat ağı ona muhtaç: golden'lar
 * ürünün KENDİ varsayılan tasarımını da fiyatlıyor. O dosya olmadan
 * `createDefaultConfig` değiştiğinde müşterinin siteyi açtığında gördüğü rakam
 * kayar ve hiçbir golden kırılmaz — ağın kanıtladığı config'i testin kendisi
 * kurmuş olurdu. `geometry/units.ts` de onun yüzünden geliyor: `options.ts`
 * panel kalınlığını oradan okuyor ve o dosyada sahne kodu değil yalnızca ölçü
 * sabitleri var.
 */
const SOURCES = [
  { from: 'pricing', kind: 'dir' },
  { from: 'geometry/units.ts', kind: 'file' },
  { from: 'products/gardirop/types.ts', kind: 'file' },
  { from: 'products/gardirop/parts.ts', kind: 'file' },
  { from: 'products/gardirop/options.ts', kind: 'file' },
  { from: 'products/vestiyer/types.ts', kind: 'file' },
  { from: 'products/vestiyer/parts.ts', kind: 'file' },
  { from: 'products/vestiyer/options.ts', kind: 'file' },
];

const HEADER = [
  '/* ÜRETİLMİŞ DOSYA — ELLE DÜZENLEMEYİN.',
  ' * Kaynak: umit-mobilya-client/src/views/configurator/_etc/',
  ' * Yeniden üretmek için: cd umit-mobilya-server && yarn sync:pricing',
  ' */',
  '',
].join('\n');

/*
 * `.spec.` GEÇEN her şey dışarıda: `priceOf.spec.parts.ts` gibi test
 * yardımcıları da spec sayılır, yalnızca `.spec.ts` ile bitenler değil.
 */
const isPortable = (name) => name.endsWith('.ts') && !name.includes('.spec.');

const walk = async (dir, base) => {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(full, base)));
    } else if (isPortable(entry.name)) {
      files.push(relative(base, full));
    }
  }

  return files;
};

const collect = async () => {
  const out = [];

  for (const source of SOURCES) {
    if (source.kind === 'file') {
      out.push({ from: source.from, to: source.from });
      continue;
    }
    const dir = join(CLIENT, source.from);
    for (const file of await walk(dir, dir)) {
      out.push({
        from: join(source.from, file),
        to: join(source.from, file),
      });
    }
  }

  return out.sort((a, b) => a.to.localeCompare(b.to));
};

const expectedContent = async (from) =>
  HEADER + (await readFile(join(CLIENT, from), 'utf8'));

const serverPath = (to) => join(SERVER, to);

const main = async () => {
  await rm(SERVER, { recursive: true, force: true });
  const files = await collect();

  for (const file of files) {
    const target = serverPath(file.to);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, await expectedContent(file.from), 'utf8');
  }

  process.stdout.write(`${files.length} dosya kopyalandi -> generated\n`);
};

module.exports = { HEADER, collect, expectedContent, serverPath, CLIENT, SERVER };

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`${String(error)}\n`);
    process.exitCode = 1;
  });
}
