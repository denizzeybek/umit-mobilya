/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CategoryResponseDto } from './CategoryResponseDto';
export type ProductModuleResponseDto = {
    _id: string;
    name: string;
    price: number;
    currency: string;
    /**
     * Permanent public R2 URL, or null when that product has no image.
     */
    imageUrl: string | null;
    /**
     * How many of this module the parent product contains.
     */
    quantity: number;
    sizes?: string;
    description?: string;
    category?: CategoryResponseDto;
};

