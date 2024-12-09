import type { ICategory } from '../category/category.interface';

export interface IProductModule {
  _id: string;
  name: string;
  price: number;
  currency: string;
  imageUrl: string;
  quantity: number;
  sizes: string;
  description: string;
  totalPrice?: number;
  category: ICategory;
}

export interface IProduct {
  _id: string;
  name: string;
  price: number;
  totalPrice: number;
  currency: string;
  imageUrl: string;
  imageUrlList?: string[];
  imageName?: string;
  imageNameList?: string[];
  sizes: string;
  description: string;
  category: ICategory;
  quantity: number;
  modules: IProductModule[];
}

export interface IProductUpdateModuleDTO {
  productId: string;
  module: {
    productId: string;
    quantity?: number;
  };
}

export interface IProductRemoveModuleDTO {
  productId: string;
  moduleId: string;
}

export interface IProductDTO {
  name: string;
  price: number;
  sizes: string;
  description: string;
  category: ICategory;
  image: any;
  modules?: {
    productId: string;
    quantity: number;
  }[];
}

export interface IProductModuleUpdateDTO {
  modules: {
    productId: string;
    quantity: number;
  }[];
}

export interface IProductFilterDTO {
  category?: string;
  name?: string;
}

export interface IProductDeleteImageDTO {
  id: string;
  imageName: string;
}
