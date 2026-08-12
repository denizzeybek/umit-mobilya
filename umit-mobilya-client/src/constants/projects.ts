/*
 * Ana sayfadaki iş vitrini. Kasıtlı olarak veritabanından değil buradan
 * okunuyor: vitrin küratörlü ve sabit, ürün kataloğu ise yönetim panelinden
 * değişiyor. Vitrinin kataloğa bağlanması, katalog boşken ana sayfayı da
 * boşaltırdı.
 *
 * Görseller yapay zekâ ile üretildi ve tamamlanmış iş fotoğrafı DEĞİL. Ne
 * ürettiğimizi anlatan örnek kareler olarak sunulmalı; gerçek iş fotoğrafları
 * çekildikçe `image` alanları tek tek değiştirilmeli.
 */
export interface IProject {
  slug: string;
  title: string;
  category: string;
  detail: string;
  image: string;
}

export const PROJECTS: IProject[] = [
  {
    slug: 'mutfak-acik',
    title: 'Meşe mutfak',
    category: 'Mutfak',
    detail: 'Kulpsuz meşe kapak, taş tezgâh, ada',
    image: '/img/products/mutfak-acik.webp',
  },
  {
    slug: 'mutfak-koyu',
    title: 'Koyu yeşil mutfak',
    category: 'Mutfak',
    detail: 'Mat lake kapak, pirinç kulp, açık raf',
    image: '/img/products/mutfak-koyu.webp',
  },
  {
    slug: 'gardirop',
    title: 'Ceviz gardırop',
    category: 'Yatak odası',
    detail: 'Tavana kadar, iç aydınlatmalı',
    image: '/img/products/gardirop.webp',
  },
  {
    slug: 'tv-unitesi',
    title: 'Ceviz TV ünitesi',
    category: 'Salon',
    detail: 'Askılı alt modül, gizli aydınlatma',
    image: '/img/products/tv-unitesi.webp',
  },
  {
    slug: 'banyo-dolabi',
    title: 'Meşe banyo dolabı',
    category: 'Banyo',
    detail: 'Taş lavabo, arkadan aydınlatmalı ayna',
    image: '/img/products/banyo-dolabi.webp',
  },
  {
    slug: 'vestiyer',
    title: 'Antre vestiyeri',
    category: 'Antre',
    detail: 'Oturaklı, askılıklı, aynalı',
    image: '/img/products/vestiyer.webp',
  },
  {
    slug: 'kitaplik',
    title: 'Duvar boyu kitaplık',
    category: 'Çalışma odası',
    detail: 'Gömme çalışma nişi ile',
    image: '/img/products/kitaplik.webp',
  },
];
