import { EStoreNames } from '@/stores/storeNames.enum';
import axios from 'axios';
import { defineStore } from 'pinia';

interface State {
  list?: any[];
  currentProduct?: any;
}

export const useProductsStore = defineStore(EStoreNames.PRODUCTS, {
  state: (): State => ({
    list: [],
    currentProduct: undefined,
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
    async find(id: string) {
      return new Promise((resolve, reject) => {
        axios
          .get(`/products/${id}`)
          .then((response) => {
            this.currentProduct = response as unknown as any;
            resolve(response);
          })
          .catch((error) => {
            reject(error);
          });
      });
    },
  },
});
