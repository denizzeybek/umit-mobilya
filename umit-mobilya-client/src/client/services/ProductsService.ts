/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AddModuleDto } from '../models/AddModuleDto';
import type { CreateProductDto } from '../models/CreateProductDto';
import type { DeleteImageDto } from '../models/DeleteImageDto';
import type { FilterProductDto } from '../models/FilterProductDto';
import type { ImageListResponseDto } from '../models/ImageListResponseDto';
import type { MessageResponseDto } from '../models/MessageResponseDto';
import type { ProductDocumentDto } from '../models/ProductDocumentDto';
import type { ProductEnvelopeDto } from '../models/ProductEnvelopeDto';
import type { ProductResponseDto } from '../models/ProductResponseDto';
import type { UpdateModulesDto } from '../models/UpdateModulesDto';
import type { UpdateProductDto } from '../models/UpdateProductDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ProductsService {
    /**
     * Every product, in the read shape: modules flattened, image URLs composed,
     * totalPrice added.
     *
     * Answers **201**, not 200. That is what the Express version did and the
     * frontend has been living with it; changing it is a separate decision.
     * @returns ProductResponseDto
     * @throws ApiError
     */
    public static productControllerFindAll(): CancelablePromise<Array<ProductResponseDto>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/products',
        });
    }
    /**
     * Adds a product. The image is required and is uploaded to R2.
     * @param formData
     * @returns ProductDocumentDto
     * @throws ApiError
     */
    public static productControllerCreate(
        formData: CreateProductDto,
    ): CancelablePromise<ProductDocumentDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/products',
            formData: formData,
            mediaType: 'multipart/form-data',
        });
    }
    /**
     * Filters products by name and category.
     *
     * A POST that performs a read, and public — both inherited from the Express
     * version, which the frontend's product list depends on.
     * @param requestBody
     * @returns ProductResponseDto
     * @throws ApiError
     */
    public static productControllerFilter(
        requestBody: FilterProductDto,
    ): CancelablePromise<Array<ProductResponseDto>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/products/filter',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Appends gallery images.
     *
     * The field name is the **singular** `image` even though several files are
     * accepted — inherited from `upload.array('image', 20)`, and the frontend
     * appends every file under that one key.
     * @param id
     * @returns ImageListResponseDto
     * @throws ApiError
     */
    public static productControllerUploadImages(
        id: string,
    ): CancelablePromise<ImageListResponseDto> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/products/create-images/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Replaces the whole module list of a product.
     * @param id
     * @param requestBody
     * @returns ProductEnvelopeDto
     * @throws ApiError
     */
    public static productControllerUpdateModules(
        id: string,
        requestBody: UpdateModulesDto,
    ): CancelablePromise<ProductEnvelopeDto> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/products/update-modules/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Adds one product to another as a module.
     * @param requestBody
     * @returns ProductEnvelopeDto
     * @throws ApiError
     */
    public static productControllerAddModule(
        requestBody: AddModuleDto,
    ): CancelablePromise<ProductEnvelopeDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/products/add-module',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Removes a module from a product.
     * @param productId
     * @param moduleId
     * @returns ProductEnvelopeDto
     * @throws ApiError
     */
    public static productControllerRemoveModule(
        productId: string,
        moduleId: string,
    ): CancelablePromise<ProductEnvelopeDto> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/products/remove-module/{productId}/{moduleId}',
            path: {
                'productId': productId,
                'moduleId': moduleId,
            },
        });
    }
    /**
     * Removes one gallery image, from both the record and the bucket.
     * @param id
     * @param requestBody
     * @returns MessageResponseDto
     * @throws ApiError
     */
    public static productControllerDeleteImage(
        id: string,
        requestBody: DeleteImageDto,
    ): CancelablePromise<MessageResponseDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/products/delete-image/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * One product in the read shape. Answers **201**, matching `GET /`.
     * @param id
     * @returns ProductResponseDto
     * @throws ApiError
     */
    public static productControllerFindById(
        id: string,
    ): CancelablePromise<ProductResponseDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/products/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Patches a product. Fields that are not sent keep their stored value.
     * @param id
     * @param requestBody
     * @returns ProductDocumentDto
     * @throws ApiError
     */
    public static productControllerUpdate(
        id: string,
        requestBody: UpdateProductDto,
    ): CancelablePromise<ProductDocumentDto> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/products/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Deletes a product and every image it owns.
     * @param id
     * @returns MessageResponseDto
     * @throws ApiError
     */
    public static productControllerRemove(
        id: string,
    ): CancelablePromise<MessageResponseDto> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/products/{id}',
            path: {
                'id': id,
            },
        });
    }
}
