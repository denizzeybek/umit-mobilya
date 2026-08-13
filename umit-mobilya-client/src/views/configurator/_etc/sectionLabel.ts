/**
 * İki modülde "sol/sağ" demek üçte anlamsız, sekizde yanıltıcı olur. Etiket
 * bu yüzden modül sayısına bağlı; birden fazla bileşen kullandığı için ortak.
 *
 * Arayüzde tek kelime: "modül". Atölye 3 bölümlü bir gardırobu 3 AYRI KUTU
 * olarak imal ediyor, yani kullanıcının seçtiği şey gerçekten bir modül.
 * Kodda tip adları `section` kalıyor — orası veri modeli, burası ekran dili.
 */
export const sectionLabel = (sectionCount: number, index: number): string => {
  if (sectionCount === 1) return 'Tek modül';
  if (sectionCount === 2) return index === 0 ? 'Sol modül' : 'Sağ modül';
  return `${index + 1}. modül`;
};
