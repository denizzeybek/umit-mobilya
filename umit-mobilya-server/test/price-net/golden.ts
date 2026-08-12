import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Golden dosyalarının okunması ve — yalnızca `yarn price-net:bless` ile —
 * yeniden basılması.
 *
 * `bless` bir ONAYDIR, temizlik adımı değil: bastıktan sonra
 * `git diff test/price-net/__goldens__` okunur ve değişen tutarın nedeni
 * commit mesajına yazılır. Golden'ları elle düzenlemek
 * `.claude/hooks/enforce-price-net.sh` tarafından engelleniyor.
 */
const GOLDEN_DIR = join(__dirname, '__goldens__');

export const isBlessing = process.env['PRICE_NET_BLESS'] === '1';

const pathOf = (id: string): string => join(GOLDEN_DIR, `${id}.json`);

/**
 * Bless modunda gelen değeri yazıp aynen döner, yani `toEqual` her zaman
 * geçer. Normal koşumda dosyayı okur; dosya yoksa ne yapılacağını söyleyerek
 * düşer — sessizce yeni bir golden yaratmak, hiç iddia edilmemiş bir sayıyı
 * onaylanmış gibi göstermek olurdu.
 */
export const goldenFor = async <T>(id: string, actual: T): Promise<T> => {
  if (isBlessing) {
    await mkdir(GOLDEN_DIR, { recursive: true });
    await writeFile(pathOf(id), `${JSON.stringify(actual, null, 2)}\n`, 'utf8');
    return actual;
  }

  const raw = await readFile(pathOf(id), 'utf8').catch(() => null);

  if (raw === null) {
    throw new Error(
      `Golden yok: ${id}.json\n` +
        'Yeni bir case ekliyorsan bas ve DİFF\'İ OKU:\n' +
        '  yarn price-net:bless\n' +
        '  git diff test/price-net/__goldens__',
    );
  }

  return JSON.parse(raw) as T;
};
