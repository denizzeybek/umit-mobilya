import { describe, expect, it } from 'vitest';

import { nextCustomFinishId, toColorNumber, toSwatch } from './colorValue';

describe('toSwatch', () => {
  it('katalogdaki sayıyı panelin gösterdiği koda çevirir', () => {
    expect(toSwatch(0xedeae4)).toBe('#EDEAE4');
    expect(toSwatch(0x33363a)).toBe('#33363A');
  });

  /* Baştaki sıfırlar kırpılırsa 0x0000ff mavi yerine üç karakterlik çöp olur. */
  it('baştaki sıfırları korur', () => {
    expect(toSwatch(0x0000ff)).toBe('#0000FF');
    expect(toSwatch(0)).toBe('#000000');
  });

  it('bozuk değerde patlamaz', () => {
    expect(toSwatch(Number.NaN)).toBe('#000000');
    expect(toSwatch(-1)).toBe('#000000');
    expect(toSwatch(0xffffff + 1)).toBe('#FFFFFF');
  });
});

describe('toColorNumber', () => {
  it('# ile de #siz de okur — ColorPicker #siz döndürüyor', () => {
    expect(toColorNumber('#EDEAE4')).toBe(0xedeae4);
    expect(toColorNumber('edeae4')).toBe(0xedeae4);
  });

  it('üç haneli kısa biçimi açar', () => {
    expect(toColorNumber('#eea')).toBe(0xeeeeaa);
  });

  it('boşlukları yok sayar ve büyük/küçük harfe bakmaz', () => {
    expect(toColorNumber('  #AbCdEf ')).toBe(0xabcdef);
  });

  /*
   * Okunamayan değer null döner, 0 değil: siyah geçerli bir renk ve yazım
   * hatasını sessizce siyaha çevirmek, kullanıcının seçmediği bir kaplamayı
   * teklife dondurmak olurdu.
   */
  it('okunamayan değer için null döner', () => {
    expect(toColorNumber('')).toBeNull();
    expect(toColorNumber('#12345')).toBeNull();
    expect(toColorNumber('kırmızı')).toBeNull();
    expect(toColorNumber('#gggggg')).toBeNull();
  });

  it('gidiş dönüş kaybetmez', () => {
    for (const color of [0x000000, 0x123456, 0xedeae4, 0xffffff]) {
      expect(toColorNumber(toSwatch(color))).toBe(color);
    }
  });
});

describe('nextCustomFinishId', () => {
  it('boş katalogda ilk kimliği verir', () => {
    expect(nextCustomFinishId([])).toBe('ozel-1');
  });

  it('dolu sırayı atlar', () => {
    expect(nextCustomFinishId(['ozel-1', 'ozel-2'])).toBe('ozel-3');
  });

  /* Boşluk yeniden kullanılabilir; kimlik ancak KULLANILMAMIŞSA verilir. */
  it('aradaki boşluğu doldurur', () => {
    expect(nextCustomFinishId(['ozel-1', 'ozel-3'])).toBe('ozel-2');
  });

  it('katalogdaki tohum kimliklerine çarpmaz', () => {
    expect(nextCustomFinishId(['beyaz', 'antrasit', 'mese'])).toBe('ozel-1');
  });
});
