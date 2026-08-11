import { computed } from 'vue';
import { defineStore } from 'pinia';

import { AuthService } from '@/client';
import { EStorageKeys } from '@/enums/storageKeys.enum';
import { EStoreNames } from '@/stores/storeNames.enum';

import { useUsersStore } from './users';

import type { AuthResponseDto, LoginDto } from '@/client';

export const useAuthStore = defineStore(EStoreNames.AUTH, () => {
  const usersStore = useUsersStore();

  const isAuth = computed(() => usersStore.isAuthenticated);

  /**
   * Stores the token and resolves the user behind it.
   *
   * The login response carries the user id as a bare string, not a user
   * object, so `isAuthenticated` cannot be set from it — the session is only
   * complete once `fetchUser` has run.
   */
  async function login(payload: LoginDto): Promise<AuthResponseDto> {
    const result = await AuthService.authControllerLogin(payload);

    localStorage.setItem(EStorageKeys.TOKEN, result.token);
    await usersStore.fetchUser();

    return result;
  }

  function logout(): void {
    localStorage.removeItem(EStorageKeys.TOKEN);
    localStorage.removeItem(EStorageKeys.USER);
    usersStore.setUser(null);
  }

  return { isAuth, login, logout };
});
