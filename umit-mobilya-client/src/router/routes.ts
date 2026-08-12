import DefaultLayout from '@/layouts/default/DefaultLayout.vue';
import { ERouteNames } from '@/router/routeNames.enum';
import About from '@/views/about/_views/About.vue';
import Login from '@/views/auth/Login.vue';
import CategoriesList from '@/views/categories/_views/CategoriesList.vue';
import Contact from '@/views/contact/_views/Contact.vue';
import Dashboard from '@/views/dashboard/_views/Dashboard.vue';
import NotFound from '@/views/errors/_views/NotFound.vue';
import ProductDetails from '@/views/products/_views/ProductDetails.vue';
import ProductsList from '@/views/products/_views/ProductsList.vue';

import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '',
    component: DefaultLayout,
    children: [
      // required UnAuth
      {
        path: '/',
        alias: '',
        name: ERouteNames.Dashboard,
        component: Dashboard,
        meta: {
          requiresUnAuth: true,
          title: ERouteNames.Dashboard,
          name: ERouteNames.Dashboard,
          hasHero: true,
        },
      },
      {
        path: '/login',
        name: ERouteNames.Login,
        component: Login,
        meta: {
          requiresUnAuth: true,
          title: ERouteNames.Login,
          name: ERouteNames.Login,
        },
      },
      {
        path: '/about',
        name: ERouteNames.About,
        component: About,
        meta: {
          requiresUnAuth: true,
          title: ERouteNames.About,
          name: ERouteNames.About,
          hasHero: true,
        },
      },
      {
        path: '/contact',
        name: ERouteNames.Contact,
        component: Contact,
        meta: {
          requiresUnAuth: true,
          title: ERouteNames.Contact,
          name: ERouteNames.Contact,
          hasHero: true,
        },
      },
      // required AUTH
      {
        path: '/products',
        name: ERouteNames.ProductsList,
        component: ProductsList,
        meta: {
          requiresUnAuth: true,
          title: ERouteNames.ProductsList,
          name: ERouteNames.ProductsList,
        },
      },
      {
        path: '/product-details/:id',
        name: ERouteNames.ProductDetails,
        component: ProductDetails,
        meta: {
          requiresUnAuth: true,
          title: ERouteNames.ProductDetails,
          name: ERouteNames.ProductDetails,
        },
      },
      /*
       * Tek tembel yüklenen route. Three.js ana pakete girdiğinde her sayfa
       * ~480 kB fazladan indiriyordu; konfigüratör kendi parçasına ayrılınca
       * bu yük yalnızca bu sayfayı açanlara biniyor.
       */
      {
        path: '/tasarla/:product',
        name: ERouteNames.Configurator,
        component: () =>
          import('@/views/configurator/_views/ConfiguratorRoute.vue'),
        meta: {
          requiresUnAuth: true,
          title: ERouteNames.Configurator,
          name: ERouteNames.Configurator,
        },
      },
      /*
       * Yönetim alanı kendi layout'unda. Mevcut /categories ve /products
       * yönetimi buraya TAŞINMADI: `ERouteNames` değeri route kimliği ve
       * değiştirmek her `router.push`u kırardı. İkisi yan yana yaşıyor.
       */
      {
        path: '/admin',
        component: () => import('@/layouts/admin/AdminLayout.vue'),
        meta: { requiresAuth: true },
        children: [
          { path: '', redirect: { name: ERouteNames.AdminQuotes } },
          {
            path: 'teklifler',
            name: ERouteNames.AdminQuotes,
            component: () => import('@/views/admin/_views/AdminQuotes.vue'),
            meta: {
              requiresAuth: true,
              title: ERouteNames.AdminQuotes,
              name: ERouteNames.AdminQuotes,
            },
          },
          {
            path: 'fiyat-kitabi',
            name: ERouteNames.AdminPricebook,
            component: () => import('@/views/admin/_views/AdminPricebook.vue'),
            meta: {
              requiresAuth: true,
              title: ERouteNames.AdminPricebook,
              name: ERouteNames.AdminPricebook,
            },
          },
        ],
      },
      {
        path: '/categories',
        name: ERouteNames.CategoriesList,
        component: CategoriesList,
        meta: {
          requiresAuth: true,
          title: ERouteNames.CategoriesList,
          name: ERouteNames.CategoriesList,
        },
      },
      /*
       * Yakalayıcı, DefaultLayout'un çocuğu olmak zorunda: dışarıda tanımlanırsa
       * bilinmeyen adres başlıksız ve altbilgisiz açılır. Yorumda kaldığı sürece
       * bilinmeyen her adres bomboş beyaz sayfa veriyordu — _redirects her yolu
       * index.html'e döndürdüğü için canlıda da öyleydi.
       */
      {
        path: '/:pathMatch(.*)*',
        name: ERouteNames.NotFound,
        component: NotFound,
        meta: {
          requiresUnAuth: true,
          title: ERouteNames.NotFound,
          name: ERouteNames.NotFound,
        },
      },
    ],
  },
];

export default routes;
