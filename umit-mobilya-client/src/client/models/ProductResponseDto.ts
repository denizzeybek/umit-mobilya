/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CategoryResponseDto } from './CategoryResponseDto';
import type { ProductModuleResponseDto } from './ProductModuleResponseDto';
export type ProductResponseDto = {
    /**
     * Public URLs matching `imageNameList`, position for position.
     */
    imageUrlList: Array<string | null>;
    _id: string;
    name: string;
    /**
     * Base price, before modules are added.
     */
    price: number;
    currency: string;
    /**
     * R2 object key of the main image. Never send this back as a URL.
     */
    imageName?: string;
    /**
     * Permanent public R2 URL composed from `imageName`, or null when unset.
     */
    imageUrl: string | null;
    /**
     * R2 object keys of the gallery images.
     */
    imageNameList: Array<string>;
    sizes?: string;
    description?: string;
    category?: CategoryResponseDto;
    quantity: number;
    modules: Array<ProductModuleResponseDto>;
    /**
     * `price` plus, for every module, its price times its quantity.
     */
    totalPrice: number;
};

