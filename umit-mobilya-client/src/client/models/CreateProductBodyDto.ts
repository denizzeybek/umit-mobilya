/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreateProductBodyDto = {
    /**
     * Main product image. Resized to fit 900x600 before upload.
     */
    image: Blob;
    /**
     * Display name in the catalogue.
     */
    name: string;
    /**
     * Free-text dimensions, e.g. "200x90x75".
     */
    sizes?: string;
    description?: string;
    /**
     * Id of an existing category. The request is rejected if it does not exist.
     */
    category: string;
};

