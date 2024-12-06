import { EStoreNames } from '@/stores/storeNames.enum';
import axios from 'axios';
import { defineStore } from 'pinia';
import type {
  ICategory,
  ICategoryDTO,
} from '@/interfaces/category/category.interface';

interface State {
  list: ICategory[];
}

export const useCategoriesStore = defineStore(EStoreNames.CATEGORIES, {
  state: (): State => ({
    list: [],
  }),
  actions: {
    async fetch() {
      return new Promise((resolve, reject) => {
        axios
          .get('/categories')
          .then((response) => {
            this.list = response as unknown as ICategory[];
            resolve(response);
          })
          .catch((error) => {
            reject(error);
          });
      });
    },
    async create(payload: ICategoryDTO) {
      return new Promise((resolve, reject) => {
        axios
          .post('/categories', payload)
          .then((response) => {
            resolve(response);
          })
          .catch((error) => {
            reject(error);
          });
      });
    },
    // async remove(id: string) {
    //   return new Promise((resolve, reject) => {
    //     axios
    //       .delete(`/categories/${id}`)
    //       .then((response) => {
    //         resolve(response);
    //       })
    //       .catch((error) => {
    //         reject(error);
    //       });
    //   });
    // },
    // async update(id: string, payload: ICategoryDTO) {
    //   return new Promise((resolve, reject) => {
    //     axios
    //       .put(`/categories/${id}`, payload)
    //       .then((response) => {
    //         resolve(response);
    //       })
    //       .catch((error) => {
    //         reject(error);
    //       });
    //   });
    // },
  },
});
