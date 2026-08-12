/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PriceBookResponseDto } from '../models/PriceBookResponseDto';
import type { PriceBookVersionDto } from '../models/PriceBookVersionDto';
import type { UpdatePriceBookDto } from '../models/UpdatePriceBookDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class PricebookService {
    /**
     * @returns PriceBookResponseDto
     * @throws ApiError
     */
    public static priceBookControllerActive(): CancelablePromise<PriceBookResponseDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/pricebook',
        });
    }
    /**
     * @param requestBody
     * @returns PriceBookResponseDto
     * @throws ApiError
     */
    public static priceBookControllerPublish(
        requestBody: UpdatePriceBookDto,
    ): CancelablePromise<PriceBookResponseDto> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/pricebook',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns PriceBookVersionDto
     * @throws ApiError
     */
    public static priceBookControllerVersions(): CancelablePromise<Array<PriceBookVersionDto>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/pricebook/versions',
        });
    }
    /**
     * @param version
     * @returns PriceBookResponseDto
     * @throws ApiError
     */
    public static priceBookControllerByVersion(
        version: number,
    ): CancelablePromise<PriceBookResponseDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/pricebook/versions/{version}',
            path: {
                'version': version,
            },
        });
    }
}
