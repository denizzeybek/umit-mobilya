import type { RouteRecordRaw } from 'vue-router';
import { ERouteNames } from '@/router/routeNames.enum';
import DefaultLayout from '@/layouts/default/DefaultLayout.vue';

import Dashboard from '@/views/dashboard/_views/Dashboard.vue';
import Products from '@/views/products/_views/Products.vue';
import ProductDetails from '@/views/products/_views/ProductDetails.vue';

import Login from '@/views/auth/Login.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '',
    component: DefaultLayout,
    meta: {
      requiresAuth: true,
    },
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
      // required AUTH
      {
        path: '/products',
        name: ERouteNames.Products,
        component: Products,
        meta: {
          requiresUnAuth: true,
          title: ERouteNames.Products,
          name: ERouteNames.Products,
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
    ],
  },

  // { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFound },
  // { path: '/:pathMatch(.*)', name: 'bad-not-found', component: NotFound }
];

export default routes;
