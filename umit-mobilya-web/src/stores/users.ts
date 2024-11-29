import { EStoreNames } from '@/stores/storeNames.enum';
import axios from 'axios';
import { defineStore } from 'pinia';

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
      this.user = payload?.authentication?.user;
      this.isAuthenticated = payload?.authentication?.token ? true : false;
    },
    async fetchUser(token: string) {
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
            reject(error);
          });
      });
    },
  },
});
