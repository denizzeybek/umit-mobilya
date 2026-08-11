import { defineStore } from 'pinia';

import { AuthService } from '@/client';
import { EStoreNames } from '@/stores/storeNames.enum';

import { useAuthStore } from './auth';

import type { PublicUserDto } from '@/client';

interface State {
  user: PublicUserDto | null;
  isAuthenticated: boolean;
}

export const useUsersStore = defineStore(EStoreNames.COMMON_USERS, {
  state: (): State => ({
    user: null,
    isAuthenticated: false,
  }),
  actions: {
    setUser(user: PublicUserDto | null): void {
      this.user = user;
      this.isAuthenticated = Boolean(user?._id);
    },

    /**
     * Resolves the session behind the stored token. A failure means the token
     * is gone or expired, so the local session is cleared before the error is
     * re-thrown — otherwise the router guard would keep retrying with a token
     * the server has already rejected.
     */
    async fetchUser(): Promise<PublicUserDto> {
      try {
        const { user } = await AuthService.authControllerMe();
        this.setUser(user);
        return user;
      } catch (error) {
        useAuthStore().logout();
        throw error;
      }
    },
  },
});
