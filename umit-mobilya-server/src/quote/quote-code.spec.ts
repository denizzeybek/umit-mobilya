import { generateQuoteCode, QUOTE_CODE_ALPHABET } from './quote-code';

/**
 * `GET /api/quotes/:code` herkese açık: teklifi yaratan kişi oturum açmadığı
 * için kendi teklifini başka türlü okuyamaz. Bu, kodu fiilen bir ANAHTAR
 * yapıyor — sıralı bir kod o rolü taşıyamaz, çünkü `UM-2608-0042` gören
 * herkes `-0041`i de okuyabilirdi.
 */
describe('generateQuoteCode', () => {
  const date = new Date('2026-08-12T10:00:00Z');

  it('yıl-ay öneki ve rastgele son ek taşır', () => {
    expect(generateQuoteCode(date)).toMatch(/^UM-2608-[A-Z0-9]{6}$/);
  });

  it('karışan karakterleri kullanmaz', () => {
    for (const char of ['0', 'O', '1', 'I', 'L']) {
      expect(QUOTE_CODE_ALPHABET).not.toContain(char);
    }
  });

  it('sıralı değildir: ardışık iki kod komşu olmaz', () => {
    const codes = Array.from({ length: 200 }, () => generateQuoteCode(date));

    expect(new Set(codes).size).toBe(codes.length);
  });

  it('arama uzayı kaba kuvvete kapalıdır', () => {
    /*
     * 31 karakter, 6 hane -> 887 milyon. Dakikada 5 istek sınırıyla
     * birlikte tek bir kodu bulmak ortalama yüzyıllar sürer.
     */
    expect(QUOTE_CODE_ALPHABET.length).toBe(31);
    expect(QUOTE_CODE_ALPHABET.length ** 6).toBeGreaterThan(8e8);
  });

  it('ay tek haneliyse başına sıfır koyar', () => {
    expect(generateQuoteCode(new Date('2026-03-01T00:00:00Z'))).toMatch(
      /^UM-2603-/,
    );
  });
});
