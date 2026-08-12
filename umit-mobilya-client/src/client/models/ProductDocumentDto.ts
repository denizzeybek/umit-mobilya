/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ProductDocumentDto = {
    _id: string;
    name: string;
    imageName?: string;
    imageNameList: Array<string>;
    sizes?: string;
    description?: string;
    /**
     * Category id. Not populated on the write path.
     */
    category?: string;
    createdAt: string;
};

