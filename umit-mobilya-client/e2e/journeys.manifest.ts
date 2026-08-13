/**
 * Onaylı yolculuklar. `e2e/journeys/<id>.spec.ts` ancak kimliği burada geçiyorsa
 * yazılabilir — `.claude/hooks/e2e-budget.sh` bunu yazma anında uyguluyor.
 *
 * Buraya bir satır eklemek bir karar: o yolculuk her koşumda çalışacak ve 300
 * saniyelik duvar saati tavanından pay alacak. Gerekçe kullanıcı diliyle ve tek
 * satır yazılır; yazılamıyorsa yolculuk muhtemelen yolculuk değildir.
 *
 * Kural: .claude/rules/11-e2e-conventions.md
 */
export const APPROVED_JOURNEYS = [
  /* Ekranda gördüğü tutarla teklifine yazılan tutar aynı olmalı. */
  'quote-price-roundtrip',

  /* "İndir"e bastığında belge gerçekten inmeli. */
  'quote-download',

  /* Paylaştığı bağlantıyı açan kişi aynı dolabı görmeli. */
  'share-link-restore',

  /* Dolabı 3B görebilmeli; göremiyorsa bunu söyleyen bir ekran görmeli. */
  'viewer-3d',

  /* Yüklenen kaplama deseni dolabın üstünde görünmeli. */
  'finish-texture',

  /* Özel kaplamayla paylaşılan bağlantı, karşı tarafta aynı kaplamayı açmalı. */
  'share-link-custom-finish',

  /* Aşağı kaydırırken hangi bölümü düzenlediğini görebilmeli. */
  'section-picker-sticky',
] as const;

export type TApprovedJourney = (typeof APPROVED_JOURNEYS)[number];
