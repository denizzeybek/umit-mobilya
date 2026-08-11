import { defineStore } from 'pinia';

import { CategoriesService } from '@/client';
import { EStoreNames } from '@/stores/storeNames.enum';

import type {
  CategoryResponseDto,
  CreateCategoryDto,
  FilterCategoryDto,
  UpdateCategoryDto,
} from '@/client';

interface State {
  list: CategoryResponseDto[];
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
    async fetch(): Promise<CategoryResponseDto[]> {
      this.loading = true;
      try {
        this.list = await CategoriesService.categoryControllerFindAll();
        return this.list;
      } finally {
        this.loading = false;
      }
    },

    async filter(payload: FilterCategoryDto): Promise<CategoryResponseDto[]> {
      this.loading = true;
      try {
        this.list = await CategoriesService.categoryControllerFilter(payload);
        return this.list;
      } finally {
        this.loading = false;
      }
    },

    async create(payload: CreateCategoryDto): Promise<CategoryResponseDto> {
      this.saving = true;
      try {
        return await CategoriesService.categoryControllerCreate(payload);
      } finally {
        this.saving = false;
      }
    },

    async update(
      id: string,
      payload: UpdateCategoryDto,
    ): Promise<CategoryResponseDto> {
      this.saving = true;
      try {
        return await CategoriesService.categoryControllerUpdate(id, payload);
      } finally {
        this.saving = false;
      }
    },

    async remove(id: string): Promise<void> {
      this.saving = true;
      try {
        await CategoriesService.categoryControllerRemove(id);
      } finally {
        this.saving = false;
      }
    },
  },
});
