import { nextTick } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';

import { EStorageKeys } from '@/enums/storageKeys.enum';
import { useUsersStore } from '@/stores/users';

import { ERouteNames } from './routeNames.enum';
import routes from './routes';

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// GUARD
router.beforeEach(async (to, from, next) => {
  const usersStore = useUsersStore();

  const token = localStorage.getItem(EStorageKeys.TOKEN);
  const { requiresAuth } = to.meta;

  if (token && !usersStore.isAuthenticated) {
    try {
      await usersStore.fetchUser();
    } catch (error: any) {
      console.error(error);
    }
  }

  if (requiresAuth) {
    if (!token) {
      return next({
        name: ERouteNames.Dashboard,
      });
    }
  }

  next();
});

// SET PAGE TITLE
const DEFAULT_TITLE = 'Umit Mobilya';
router.afterEach((to) => {
  nextTick(() => {
    document.title =
      typeof to.meta.title === 'string'
        ? `${to.meta.title} - Umit Mobilya`
        : DEFAULT_TITLE;
  });
});

router.onError((error) => {
  console.error('router error: ', error);
});

export default router;
