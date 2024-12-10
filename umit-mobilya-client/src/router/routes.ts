import type { RouteRecordRaw } from 'vue-router';
import { ERouteNames } from '@/router/routeNames.enum';
import DefaultLayout from '@/layouts/default/DefaultLayout.vue';

import Dashboard from '@/views/dashboard/_views/Dashboard.vue';
import ProductsList from '@/views/products/_views/ProductsList.vue';
import ProductDetails from '@/views/products/_views/ProductDetails.vue';

import About from '@/views/about/_views/About.vue';

import Login from '@/views/auth/Login.vue';
import CategoriesList from '@/views/categories/_views/CategoriesList.vue';

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
      {
        path: '/about',
        name: ERouteNames.About,
        component: About,
        meta: {
          requiresUnAuth: true,
          title: ERouteNames.About,
          name: ERouteNames.About,
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
    ],
  },

  // { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFound },
  // { path: '/:pathMatch(.*)', name: 'bad-not-found', component: NotFound }
];

export default routes;
