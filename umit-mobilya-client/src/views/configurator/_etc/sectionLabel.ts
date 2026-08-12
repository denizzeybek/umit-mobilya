/**
 * İki bölümde "sol/sağ" demek üçte anlamsız, sekizde yanıltıcı olur. Etiket
 * bu yüzden bölüm sayısına bağlı; birden fazla bileşen kullandığı için ortak.
 */
export const sectionLabel = (sectionCount: number, index: number): string => {
  if (sectionCount === 1) return 'Tek bölüm';
  if (sectionCount === 2) return index === 0 ? 'Sol bölüm' : 'Sağ bölüm';
  return `${index + 1}. bölüm`;
};
