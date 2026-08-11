import { defineStore } from 'pinia';

import axios from 'axios';

import { EStoreNames } from '@/stores/storeNames.enum';

import type {
  ICategory,
  ICategoryDTO,
} from '@/interfaces/category/category.interface';

interface State {
  list: ICategory[];
  loading: boolean;
  saving: boolean;
}

export const useCategoriesStore = defineStore(EStoreNames.CATEGORIES, {
  state: (): State => ({
    list: [],
    loading: false,
    saving: false,
  }),
  actions: {
    async fetch(): Promise<ICategory[]> {
      this.loading = true;
      try {
        const categories = await axios.get<ICategory[], ICategory[]>(
          '/categories',
        );
        this.list = categories;
        return categories;
      } finally {
        this.loading = false;
      }
    },
    async create(payload: ICategoryDTO): Promise<ICategory> {
      this.saving = true;
      try {
        return await axios.post<ICategory, ICategory>('/categories', payload);
      } finally {
        this.saving = false;
      }
    },
  },
});
