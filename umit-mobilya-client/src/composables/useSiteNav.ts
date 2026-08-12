import { computed } from 'vue';

import { ERouteNames } from '@/router/routeNames.enum';
import { useUsersStore } from '@/stores/users';
import { PRODUCT_SUMMARIES } from '@/views/configurator/_etc/productList';

import type { INavDropdownItem } from '@/layouts/default/_components/NavDropdown.vue';
import type { ComputedRef } from 'vue';

/**
 * Üst menü ve mobil menünün paylaştığı bağlantı listesi. İkisi de aynı sırayı
 * göstermeli; iki ayrı yerde tutmak er geç ayrışır.
 */
export interface INavLink {
  name: ERouteNames;
  label: string;
  params?: Record<string, string>;
}

/*
 * ERouteNames değeri route kimliğidir ve kopya olarak değiştirilemez, ama
 * "Ürün Listesi" menüde kötü okunuyor. Görünen etiket bu yüzden kimlikten
 * ayrıldı — route hâlâ enum ile hedefleniyor.
 */
const PRODUCTS_LABEL = 'İşler';

/*
 * Menüdeki ad artık tek bir ürünü anlatamaz: konfigüratör bir ürün ailesi.
 * ERouteNames.Configurator değeri ("Dolabını Tasarla") route kimliği olarak
 * kalıyor, görünen etiket ondan ayrı.
 */
const DESIGN_LABEL = 'Tasarla';

/*
 * Yönetim ekranları menüde YOKTU ve adresleri ezberlemek gerekiyordu. Tek bir
 * "Kategoriler" bağlantısı yerine açılır: fiyat kitabı ve teklifler de aynı
 * yerde toplanıyor, ve giriş yapılmadan hiçbiri görünmüyor.
 */
const ADMIN_LABEL = 'Yönetim';

export const useSiteNav = (): {
  productsLabel: string;
  designLabel: string;
  designItems: ComputedRef<INavDropdownItem[]>;
  adminLabel: string;
  adminItems: ComputedRef<INavDropdownItem[]>;
  navLinks: ComputedRef<INavLink[]>;
  mobileLinks: ComputedRef<INavLink[]>;
} => {
  const usersStore = useUsersStore();

  const navLinks = computed<INavLink[]>(() => [
    { name: ERouteNames.About, label: ERouteNames.About },
    { name: ERouteNames.Contact, label: ERouteNames.Contact },
  ]);

  /** Yalnızca giriş yapılmışken; boşsa başlık açılırı hiç çizmiyor. */
  const adminItems = computed<INavDropdownItem[]>(() =>
    usersStore.isAuthenticated
      ? [
          {
            label: ERouteNames.AdminQuotes,
            to: { name: ERouteNames.AdminQuotes },
          },
          {
            label: ERouteNames.AdminPricebook,
            to: { name: ERouteNames.AdminPricebook },
          },
          {
            label: ERouteNames.CategoriesList,
            to: { name: ERouteNames.CategoriesList },
            separatorBefore: true,
          },
        ]
      : [],
  );

  /** Konfigüratörü olan her ürün tipi; registry'ye eklenen otomatik görünür. */
  const designItems = computed<INavDropdownItem[]>(() =>
    PRODUCT_SUMMARIES.map((product) => ({
      label: product.label,
      to: {
        name: ERouteNames.Configurator,
        params: { product: product.id },
      },
    })),
  );

  const mobileLinks = computed<INavLink[]>(() => [
    { name: ERouteNames.ProductsList, label: PRODUCTS_LABEL },
    ...PRODUCT_SUMMARIES.map((product) => ({
      name: ERouteNames.Configurator,
      label: `${product.label} tasarla`,
      params: { product: product.id },
    })),
    ...navLinks.value,
    ...(usersStore.isAuthenticated
      ? [
          { name: ERouteNames.AdminQuotes, label: ERouteNames.AdminQuotes },
          {
            name: ERouteNames.AdminPricebook,
            label: ERouteNames.AdminPricebook,
          },
          {
            name: ERouteNames.CategoriesList,
            label: ERouteNames.CategoriesList,
          },
        ]
      : []),
  ]);

  return {
    productsLabel: PRODUCTS_LABEL,
    designLabel: DESIGN_LABEL,
    designItems,
    adminLabel: ADMIN_LABEL,
    adminItems,
    navLinks,
    mobileLinks,
  };
};
