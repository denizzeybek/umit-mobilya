/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { StoredModuleDto } from './StoredModuleDto';
export type ProductDocumentDto = {
    _id: string;
    name: string;
    price: number;
    currency: string;
    imageName?: string;
    imageNameList: Array<string>;
    sizes?: string;
    description?: string;
    /**
     * Category id. Not populated on the write path.
     */
    category?: string;
    quantity: number;
    modules: Array<StoredModuleDto>;
    createdAt: string;
};

