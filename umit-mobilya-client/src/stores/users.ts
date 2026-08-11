import { defineStore } from 'pinia';

import axios from 'axios';

import { EStoreNames } from '@/stores/storeNames.enum';

import { useAuthStore } from './auth';

interface State {
  user?: any;
  isAuthenticated?: boolean;
}

export const useUsersStore = defineStore(EStoreNames.COMMON_USERS, {
  state: (): State => ({
    user: undefined,
    isAuthenticated: false,
  }),
  actions: {
    async setUser(payload: any) {
      if (payload.user) {
        this.user = payload?.user;
      }
      this.isAuthenticated = payload?.user?._id ? true : false;
    },
    async fetchUser(token: string) {
      const authStore = useAuthStore();
      return new Promise((resolve, reject) => {
        axios
          .get('/auth/me', {
            headers: {
              Authorization: `Bearer ${token}`, // Overrides the default token
            },
          })
          .then((response) => {
            this.setUser(response);
            resolve(response);
          })
          .catch((error) => {
            authStore.logout();
            reject(error);
          });
      });
    },
  },
});
