import type { RouteRecordRaw } from 'vue-router';
import { ERouteNames } from '@/router/routeNames.enum';
import DefaultLayout from '@/layouts/default/DefaultLayout.vue';
import Products from '@/views/products/_views/Products.vue';


import Login from '@/views/auth/Login.vue';
import Register from '@/views/auth/Register.vue';

// Not Found Page
// import NotFound from '@/views/NotFound.vue'

const routes: RouteRecordRaw[] = [
  // DEFAULT ROUTES (REQUIRES AUTH)
  {
    path: '',
    component: DefaultLayout,
    meta: {
      requiresAuth: true,
    },
    children: [
      {
        path: '/',
        alias: '',
        name: ERouteNames.Products,
        component: Products,
        meta: {
          title: ERouteNames.Products,
          name: ERouteNames.Products,
        },
      },
    ],
  },
  // AUTHENTICATION ROUTES (REQUIRES UN_AUTH)
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
    path: '/register',
    name: ERouteNames.Register,
    component: Register,
    meta: {
      requiresUnAuth: true,
      title: ERouteNames.Register,
      name: ERouteNames.Register,
    },
  },
  // { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFound },
  // { path: '/:pathMatch(.*)', name: 'bad-not-found', component: NotFound }
];

export default routes;
