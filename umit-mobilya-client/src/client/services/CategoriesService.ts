/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CategoryResponseDto } from '../models/CategoryResponseDto';
import type { CreateCategoryDto } from '../models/CreateCategoryDto';
import type { FilterCategoryDto } from '../models/FilterCategoryDto';
import type { MessageResponseDto } from '../models/MessageResponseDto';
import type { UpdateCategoryDto } from '../models/UpdateCategoryDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class CategoriesService {
    /**
     * Every category, unfiltered. Public — the storefront reads it.
     * @returns CategoryResponseDto
     * @throws ApiError
     */
    public static categoryControllerFindAll(): CancelablePromise<Array<CategoryResponseDto>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/categories',
        });
    }
    /**
     * Creates a category.
     * @param requestBody
     * @returns CategoryResponseDto
     * @throws ApiError
     */
    public static categoryControllerCreate(
        requestBody: CreateCategoryDto,
    ): CancelablePromise<CategoryResponseDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/categories',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Filters categories by name.
     *
     * Reads the criteria from the request BODY of a GET, which is unusual and
     * deliberate: that is what the Express version did and what the frontend
     * sends. Changing it to a query parameter is a breaking change for callers.
     * @param requestBody
     * @returns CategoryResponseDto
     * @throws ApiError
     */
    public static categoryControllerFilter(
        requestBody: FilterCategoryDto,
    ): CancelablePromise<Array<CategoryResponseDto>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/categories/filter',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Renames a category.
     * @param id
     * @param requestBody
     * @returns CategoryResponseDto
     * @throws ApiError
     */
    public static categoryControllerUpdate(
        id: string,
        requestBody: UpdateCategoryDto,
    ): CancelablePromise<CategoryResponseDto> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/categories/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Deletes a category. Answers with a message, not the deleted document.
     * @param id
     * @returns MessageResponseDto
     * @throws ApiError
     */
    public static categoryControllerRemove(
        id: string,
    ): CancelablePromise<MessageResponseDto> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/categories/{id}',
            path: {
                'id': id,
            },
        });
    }
}
