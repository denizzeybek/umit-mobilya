/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateProductBodyDto } from '../models/CreateProductBodyDto';
import type { DeleteImageDto } from '../models/DeleteImageDto';
import type { FilterProductDto } from '../models/FilterProductDto';
import type { ImageListResponseDto } from '../models/ImageListResponseDto';
import type { MessageResponseDto } from '../models/MessageResponseDto';
import type { ProductDocumentDto } from '../models/ProductDocumentDto';
import type { ProductResponseDto } from '../models/ProductResponseDto';
import type { UpdateProductDto } from '../models/UpdateProductDto';
import type { UploadImagesDto } from '../models/UploadImagesDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ProductsService {
    /**
     * Every product, in the read shape: image URLs composed from stored keys.
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
        formData: CreateProductBodyDto,
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
     * @param formData
     * @returns ImageListResponseDto
     * @throws ApiError
     */
    public static productControllerUploadImages(
        id: string,
        formData: UploadImagesDto,
    ): CancelablePromise<ImageListResponseDto> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/products/create-images/{id}',
            path: {
                'id': id,
            },
            formData: formData,
            mediaType: 'multipart/form-data',
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
