import { EStoreNames } from '@/stores/storeNames.enum';
import axios from 'axios';
import { defineStore } from 'pinia';

interface State {
  list?: any[];
}

export const useProductsStore = defineStore(EStoreNames.PRODUCTS, {
  state: (): State => ({
    list: [],
  }),
  actions: {
    async fetch() {
      return new Promise((resolve, reject) => {
        axios
          .get('/products')
          .then((response) => {
            this.list = response as unknown as any[];
            resolve(response);
          })
          .catch((error) => {
            reject(error);
          });
      });
    },
  },
});
