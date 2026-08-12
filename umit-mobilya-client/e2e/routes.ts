import { ERouteNames } from '../src/router/routeNames.enum';
import { PRODUCT_SUMMARIES } from '../src/views/configurator/_etc/productList';

/**
 * Smoke'un gezdiği route envanteri.
 *
 * Elle tutuluyor ve bu bilinçli: `src/router/routes.ts` `.vue` dosyaları import
 * ediyor, yani Node içinde koşan Playwright'a okutulamaz. Bir route eklendiğinde
 * buraya da bir satır girer — smoke'un kapsamı ancak açıkça büyür.
 *
 * Başlıklar `ERouteNames`'ten ÜRETİLİYOR, elle yazılmıyor: o değerler aynı anda
 * route kimliği, sekme başlığı ve menü etiketi (Rule 06). Buraya kopyalanmış
 * bir Türkçe metin, birinin "sadece metin" diye değiştirdiği gün sahte kırmızı
 * verirdi.
 *
 * `/product-details/:id` burada YOK: parametreli, ve kimliği koşum sırasında
 * API'den okunuyor (bkz. smoke.spec.ts) — tohum verinin iki yerde tarif
 * edilmemesi için.
 *
 * Kural: .claude/rules/11-e2e-conventions.md
 */
const SUFFIX = 'Umit Mobilya';

const titleOf = (name: ERouteNames): string => `${name} - ${SUFFIX}`;

export interface ISmokeRoute {
  path: string;
  /** Sekme başlığı — router'ın hangi route'u çözdüğünün kanıtı. */
  title: string;
  /**
   * Sayfanın gerçekten çizildiğini söyleyen testid. Yalnızca kendi kabuğu olan
   * ekranlarda var; kalanlarda `app-main` içindeki metin yeterli kanıt.
   */
  testId?: string;
}

export const PUBLIC_ROUTES: ISmokeRoute[] = [
  { path: '/', title: titleOf(ERouteNames.Dashboard) },
  { path: '/about', title: titleOf(ERouteNames.About) },
  { path: '/contact', title: titleOf(ERouteNames.Contact) },
  { path: '/login', title: titleOf(ERouteNames.Login), testId: 'login-form' },
  {
    path: '/products',
    title: titleOf(ERouteNames.ProductsList),
    testId: 'products-list',
  },
  /*
   * Konfigüratör başlığını route değil ConfiguratorRoute kuruyor (registry'yi
   * router'a import etmek Three.js'i ana pakete geri sokuyordu), o yüzden
   * biçim farklı.
   */
  ...PRODUCT_SUMMARIES.map((product) => ({
    path: `/tasarla/${product.id}`,
    title: `${product.label} Tasarla - ${SUFFIX}`,
    testId: 'configurator',
  })),
  {
    path: '/boyle-bir-sayfa-yok',
    title: titleOf(ERouteNames.NotFound),
    testId: 'not-found',
  },
  /*
   * Bilinmeyen ürün 404 gösterir ve YÖNLENDİRMEZ — adres kullanıcının yazdığı
   * gibi kalmalı ki yanlışı görebilsin.
   */
  {
    path: '/tasarla/mutfak',
    title: `Sayfa Bulunamadı - ${SUFFIX}`,
    testId: 'not-found',
  },
];

export const ADMIN_ROUTES: ISmokeRoute[] = [
  {
    path: '/admin/teklifler',
    title: titleOf(ERouteNames.AdminQuotes),
    testId: 'admin-quotes',
  },
  {
    path: '/admin/fiyat-kitabi',
    title: titleOf(ERouteNames.AdminPricebook),
    testId: 'admin-pricebook',
  },
  {
    path: '/categories',
    title: titleOf(ERouteNames.CategoriesList),
    testId: 'categories-list',
  },
];
