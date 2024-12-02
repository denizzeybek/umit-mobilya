import { EStoreNames } from '@/stores/storeNames.enum';
import axios from 'axios';
import { defineStore } from 'pinia';
import type {
  IProductDTO,
  IProductModuleUpdateDTO,
  IProductRemoveModuleDTO,
  IProductUpdateModuleDTO,
} from '@/interfaces/product/product.interface';

import type {
  IProduct,
  IProductModule,
} from '@/interfaces/product/product.interface';

interface State {
  list: IProduct[];
  currentProduct: IProduct;
  currentProductBasket: IProductModule[];
  currentProductTotal: {
    price: number;
    currency: string;
  };
}

export const useProductsStore = defineStore(EStoreNames.PRODUCTS, {
  state: (): State => ({
    list: [],
    currentProduct: {} as IProduct,
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
    async create(payload: IProductDTO) {
      return new Promise((resolve, reject) => {
        axios
          .post('/products', payload)
          .then((response) => {
            this.list = response as unknown as IProduct[];
            resolve(response);
          })
          .catch((error) => {
            reject(error);
          });
      });
    },
    async remove(id: string) {
      return new Promise((resolve, reject) => {
        axios
          .delete(`/products/${id}`)
          .then((response) => {
            resolve(response);
          })
          .catch((error) => {
            reject(error);
          });
      });
    },
    async update(id: string, payload: IProductDTO) {
      return new Promise((resolve, reject) => {
        axios
          .put(`/products/${id}`, payload)
          .then((response) => {
            resolve(response);
          })
          .catch((error) => {
            reject(error);
          });
      });
    },
    async updateModule(id: string, payload: IProductModuleUpdateDTO) {
      return new Promise((resolve, reject) => {
        axios
          .put(`/products/update-modules/${id}`, payload)
          .then((response) => {
            resolve(response);
          })
          .catch((error) => {
            reject(error);
          });
      });
    },
    async addModule(payload: IProductUpdateModuleDTO) {
      return new Promise((resolve, reject) => {
        axios
          .post(`/products/add-module`, payload)
          .then((response) => {
            resolve(response);
          })
          .catch((error) => {
            reject(error);
          });
      });
    },
    async removeModule(payload: IProductRemoveModuleDTO) {
      const { productId, moduleId } = payload;
      return new Promise((resolve, reject) => {
        axios
          .delete(`/products/remove-module/${productId}/${moduleId}`)
          .then((response) => {
            resolve(response);
          })
          .catch((error) => {
            reject(error);
          });
      });
    },
    async setCurrentProductBasket(
      modules: IProductModule[],
    ) {
      // update:{ productId: string, updateModule: IProductModuleUpdateDTO },
      this.currentProductBasket = modules;
      this.currentProductTotal = {
        price: this.currentProductBasket.reduce(
          (acc, module) => acc + Number(module.price) * Number(module.quantity),
          0,
        ),
        currency: this.currentProductBasket[0].currency,
      };
      // await this.updateModule(update.productId, update.updateModule);
    },
    resetBasket() {
      this.currentProductBasket = [];
      this.currentProductTotal = {
        price: 0,
        currency: '',
      };
    },
  },
});
