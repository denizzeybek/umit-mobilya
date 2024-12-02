export interface IProductModule {
  _id: string;
  name: string;
  price: number;
  currency: string;
  imageUrl: string;
  quantity: number;
  sizes: string;
  description: string;
  category: string;
}

export interface IProduct {
  _id: string;
  name: string;
  price: number;
  currency: string;
  imageUrl: string;
  sizes: string;
  description: string;
  category: string;
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
  category: string;
  modules?: {
    productId: string;
    quantity: number;
  }[];
}
