import { defineStore } from 'pinia';
import { EStorageKeys } from '@/constants/storageKeys';
import { computed } from 'vue';
import { EStoreNames } from '@/stores/storeNames.enum';
import { useUsersStore } from './users';
import axios from 'axios';

export const useAuthStore = defineStore(EStoreNames.AUTH, () => {
  const usersStore = useUsersStore();

  const isAuth = computed(() => usersStore.isAuthenticated);

  return {
    isAuth,
    setAuth(payload: any) {
      const { authentication } = payload;
      usersStore.setUser(payload);
      if (authentication) {
        localStorage.setItem(EStorageKeys.TOKEN, authentication.token);
        localStorage.setItem(
          EStorageKeys.USER,
          JSON.stringify(authentication.user),
        );
      }
    },
    $reset() {
      localStorage.removeItem(EStorageKeys.TOKEN);
      localStorage.removeItem(EStorageKeys.USER);
    },
    async login(payload: { email: string; password: string }) {
      return new Promise((resolve, reject) => {
        axios
          .post('/auth/login', payload)
          .then((response) => {
            this.setAuth({ authentication: response, user: null });
            resolve(response);
          })
          .catch((error) => {
            reject(error);
          });
      });
    },
    logout() {
      this.$reset();
      usersStore.setUser(null);
    },
  };
});
