import { defineStore } from 'pinia';
import { EStorageKeys } from '@/constants/storageKeys';
import { computed } from 'vue';
import { EStoreNames } from '@/stores/storeNames.enum';
import { useUsersStore } from './users';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import { authHeader } from '../helpers/auth';

export const useAuthStore = defineStore(EStoreNames.AUTH, () => {
  const usersStore = useUsersStore();

  const router = useRouter();
  const route = useRoute();

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
    async getProfile(result) {
      const languageCode = localStorage.getItem('languageCode');
      if (!languageCode) localStorage.setItem('languageCode', 'en');
      const request = { languageCode: languageCode };
      const header = authHeader();
      return new Promise((resolve, reject) => {
        axios
          .post('/webapi/wizard/profile`', request, { headers: header })
          .then((response) => {
            this.setAuth({ authentication: null, user: response });
            result.user = response.data;
            return resolve(result);
          })
          .catch((error) => {
            reject(error);
          });
      });
    },
  };
});
