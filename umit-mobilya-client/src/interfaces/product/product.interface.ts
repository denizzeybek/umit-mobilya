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
