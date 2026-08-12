import { defineStore } from 'pinia';

import { ProductsService } from '@/client';
import { EStoreNames } from '@/stores/storeNames.enum';

import type {
  CreateProductBodyDto,
  FilterProductDto,
  ProductDocumentDto,
  ProductResponseDto,
  UpdateProductDto,
} from '@/client';

interface State {
  list: ProductResponseDto[];
  currentProduct: ProductResponseDto | null;
  loading: boolean;
  saving: boolean;
}

export const useProductsStore = defineStore(EStoreNames.PRODUCTS, {
  state: (): State => ({
    list: [],
    currentProduct: null,
    loading: false,
    saving: false,
  }),
  actions: {
    async fetch(): Promise<ProductResponseDto[]> {
      this.loading = true;
      try {
        this.list = await ProductsService.productControllerFindAll();
        return this.list;
      } finally {
        this.loading = false;
      }
    },

    async filter(payload: FilterProductDto): Promise<ProductResponseDto[]> {
      this.loading = true;
      try {
        this.list = await ProductsService.productControllerFilter(payload);
        return this.list;
      } finally {
        this.loading = false;
      }
    },

    async find(id: string): Promise<ProductResponseDto> {
      this.loading = true;
      try {
        this.currentProduct =
          await ProductsService.productControllerFindById(id);
        return this.currentProduct;
      } finally {
        this.loading = false;
      }
    },

    /**
     * The image travels as multipart. `CreateProductBodyDto` types it as a
     * `Blob`, and the generated client builds the FormData — the component only
     * hands over the `File` it holds.
     */
    async create(payload: CreateProductBodyDto): Promise<ProductDocumentDto> {
      this.saving = true;
      try {
        return await ProductsService.productControllerCreate(payload);
      } finally {
        this.saving = false;
      }
    },

    async update(
      id: string,
      payload: UpdateProductDto,
    ): Promise<ProductDocumentDto> {
      this.saving = true;
      try {
        return await ProductsService.productControllerUpdate(id, payload);
      } finally {
        this.saving = false;
      }
    },

    async remove(id: string): Promise<void> {
      this.saving = true;
      try {
        await ProductsService.productControllerRemove(id);
      } finally {
        this.saving = false;
      }
    },

    /**
     * Every file goes up under the **singular** field name `image` — that is
     * the server's contract, inherited from `upload.array('image', 20)`.
     */
    async createImages(id: string, images: FileList | File[]): Promise<void> {
      this.saving = true;
      try {
        await ProductsService.productControllerUploadImages(id, {
          image: Array.from(images),
        });
      } finally {
        this.saving = false;
      }
    },

    async deleteImage(id: string, imageName: string): Promise<void> {
      this.saving = true;
      try {
        await ProductsService.productControllerDeleteImage(id, { imageName });
      } finally {
        this.saving = false;
      }
    },
  },
});
