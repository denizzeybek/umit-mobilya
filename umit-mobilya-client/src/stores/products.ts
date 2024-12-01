import { EStoreNames } from '@/stores/storeNames.enum';
import axios from 'axios';
import { defineStore } from 'pinia';
import type {
  IProduct,
  IProductModule,
} from '@/interfaces/product/product.interface';

interface State {
  list: IProduct[];
  currentProduct?: IProduct;
  currentProductBasket: IProductModule[];
  currentProductTotal: {
    price: number;
    currency: string;
  };
}

export const useProductsStore = defineStore(EStoreNames.PRODUCTS, {
  state: (): State => ({
    list: [],
    currentProduct: undefined,
    currentProductBasket: [],
    currentProductTotal: {
      price: 0,
      currency: '',
    },
  }),
  actions: {
    async fetch() {
      return new Promise((resolve, reject) => {
        axios
          .get('/products')
          .then((response) => {
            this.list = response as unknown as IProduct[];
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
            this.currentProduct = response as unknown as IProduct;
            resolve(response);
          })
          .catch((error) => {
            reject(error);
          });
      });
    },
    setCurrentProductBasket(modules: IProductModule[]) {
      this.currentProductBasket = modules;
      this.currentProductTotal = {
        price: this.currentProductBasket.reduce(
          (acc, module) => acc + Number(module.price) * Number(module.quantity),
          0,
        ),
        currency: this.currentProductBasket[0].currency,
      };
    },
  },
});
