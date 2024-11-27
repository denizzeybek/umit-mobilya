  import { EStoreNames } from '@/stores/storeNames.enum'
  import { defineStore } from 'pinia'
  
  interface State {
    user?: any
    authentication?: any
    profile?: any
  }
  
  
  export const useUsersStore = defineStore(EStoreNames.COMMON_USERS, {
    state: (): State => ({
      user: undefined,
      authentication: undefined,
      profile: undefined,
    }),
    actions: {
      async setUser(payload: any) {
        this.authentication = payload?.authentication
        this.user = payload?.user
      },
      async fetchUser(token: string) {
        // burda elinde token var ama login değil, tekrar user'ı fetch ediceksin
        return ''
      },
      async updateProfile(payload: any) {
        // const response = await UsersService.userProfileControllerUpsert(payload)
        // this.profile = response
        // return response
      },


    }
  })
  