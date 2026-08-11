/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreateProductDto = {
    /**
     * Display name in the catalogue.
     */
    name: string;
    /**
     * Base price, before modules are added.
     */
    price: number;
    /**
     * ISO currency code. Defaults to TRY when omitted.
     */
    currency?: string;
    /**
     * Free-text dimensions, e.g. "200x90x75".
     */
    sizes?: string;
    description?: string;
    /**
     * Id of an existing category. The request is rejected if it does not exist.
     */
    category: string;
    quantity?: number;
};

