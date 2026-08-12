/*
 * Firma künyesi. Header, footer ve iletişim sayfası aynı kaynaktan okur —
 * telefon numarası üç yerde ayrı ayrı yazılmasın diye.
 *
 * `phoneHref` E.164 biçiminde olmalı, yoksa iOS Safari `tel:` linkini açmıyor.
 */
export interface ILocation {
  label: string;
  address: string;
  district: string;
  phone: string;
  phoneHref: string;
  mapsUrl: string;
}

export const COMPANY_NAME = 'Ümit Mobilya Dekorasyon';

export const COMPANY_TAGLINE = 'Kuşadası’nda ısmarlama mobilya ve mimari ahşap';

export const LOCATIONS: ILocation[] = [
  {
    label: 'Ahşap Atölye',
    address: 'Kuşadası Sanayi Sitesi 10. Sk. No: 20',
    district: '09400 Kuşadası / Aydın',
    phone: '0 549 676 21 08',
    phoneHref: 'tel:+905496762108',
    mapsUrl:
      'https://www.google.com/maps/search/?api=1&query=Ku%C5%9Fadas%C4%B1%20Sanayi%20Sitesi%2010.%20Sokak%20Ku%C5%9Fadas%C4%B1%20Ayd%C4%B1n',
  },
  {
    label: 'Fabrika',
    address: 'Kirazlı Yolu Cd., Ağaç İşleri Sanayi Sitesi',
    district: '09400 Kuşadası / Aydın',
    phone: '0 552 152 21 08',
    phoneHref: 'tel:+905521522108',
    mapsUrl:
      'https://www.google.com/maps/search/?api=1&query=A%C4%9Fa%C3%A7%20%C4%B0%C5%9Fleri%20Sanayi%20Sitesi%20Kirazl%C4%B1%20Yolu%20Ku%C5%9Fadas%C4%B1%20Ayd%C4%B1n',
  },
];

/*
 * WhatsApp hattı TEK ve atölye numarası. Düğme her iki konum kartında da
 * çıktığı için numarayı da yazıyor: Fabrika kartı 0552 gösterip WhatsApp'ı
 * sessizce 0549'a açmak, hangi numaraya yazdığını sanan biri için yanıltıcıydı.
 *
 * Fabrikanın da WhatsApp'ı açılırsa burası konuma taşınır (`ILocation`).
 */
export const WHATSAPP_NUMBER = '0 549 676 21 08';

export const WHATSAPP_URL = 'https://wa.me/905496762108';

/*
 * Süreç anlatısı ana sayfada ve hakkımızda sayfasında paylaşılıyor.
 */
export const PROCESS_STEPS = [
  {
    title: 'Keşif ve ölçü',
    text: 'Mekâna geliriz, ölçüyü kendimiz alırız. Keşif ücretsizdir.',
  },
  {
    title: 'Tasarım',
    text: 'Üretime girmeden önce üç boyutlu çizimle nasıl duracağını gösteririz.',
  },
  {
    title: 'Üretim',
    text: 'Kendi atölyemizde, seçtiğiniz malzemeyle üretiriz.',
  },
  {
    title: 'Montaj',
    text: 'Yerine biz takarız; ölçü tutmazsa sorun bizimdir, sizin değil.',
  },
];
