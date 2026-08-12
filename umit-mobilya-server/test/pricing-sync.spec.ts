import { readFile } from 'node:fs/promises';

import {
  collect,
  expectedContent,
  serverPath,
} from '../scripts/sync-pricing';

/**
 * Fiyat motoru iki yerde çalışıyor: istemci ekrandaki rakamı anında
 * göstersin, sunucu teklifi kaydederken tutarı yeniden hesaplasın diye.
 * İkisi ayrışırsa admin panelindeki fiyat ekrandakinden farklı olur ve
 * bunu hiçbir şey söylemez.
 *
 * Bu spec o sessizliği bitiriyor: kopya kaynakla BAYTINA KADAR aynı değilse
 * `yarn test` kırmızı. Commit hook'u zaten `test:cov` çalıştırıyor.
 */
describe('fiyat motoru senkronu', () => {
  it('kopyalanacak en az bir dosya vardır', async () => {
    const files = await collect();

    expect(files.length).toBeGreaterThan(0);
  });

  it('her üretilmiş dosya kaynağıyla birebir aynıdır', async () => {
    const files = await collect();
    const drifted: string[] = [];

    for (const file of files) {
      const expected = await expectedContent(file.from);
      const actual = await readFile(serverPath(file.to), 'utf8').catch(
        () => null,
      );

      if (actual !== expected) drifted.push(file.to);
    }

    expect(drifted).toEqual([]);
  });

  /* Spec ve test yardımcıları taşınabilir çekirdeğe ait değil. */
  it('spec dosyaları kopyalanmaz', async () => {
    const files = await collect();

    expect(files.filter((file) => file.to.includes('.spec.'))).toEqual([]);
  });

  it('kopyalanan hiçbir dosya Vue ya da Three.js import etmez', async () => {
    const files = await collect();
    const offenders: string[] = [];

    for (const file of files) {
      const body = await readFile(serverPath(file.to), 'utf8');
      if (/from '(vue|three)'/.test(body) || body.includes(".vue'")) {
        offenders.push(file.to);
      }
    }

    expect(offenders).toEqual([]);
  });
});
