/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateQuoteDto } from '../models/CreateQuoteDto';
import type { QuoteListDto } from '../models/QuoteListDto';
import type { QuoteResponseDto } from '../models/QuoteResponseDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class QuotesService {
    /**
     * @param requestBody
     * @returns QuoteResponseDto
     * @throws ApiError
     */
    public static quoteControllerCreate(
        requestBody: CreateQuoteDto,
    ): CancelablePromise<QuoteResponseDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/quotes',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param limit
     * @param skip
     * @returns QuoteListDto
     * @throws ApiError
     */
    public static quoteControllerList(
        limit?: string,
        skip?: string,
    ): CancelablePromise<QuoteListDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/quotes',
            query: {
                'limit': limit,
                'skip': skip,
            },
        });
    }
    /**
     * @param code
     * @returns QuoteResponseDto
     * @throws ApiError
     */
    public static quoteControllerByCode(
        code: string,
    ): CancelablePromise<QuoteResponseDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/quotes/{code}',
            path: {
                'code': code,
            },
        });
    }
    /**
     * @param code
     * @returns void
     * @throws ApiError
     */
    public static quoteControllerRemove(
        code: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/quotes/{code}',
            path: {
                'code': code,
            },
        });
    }
    /**
     * @param code
     * @param format
     * @returns any
     * @throws ApiError
     */
    public static quoteControllerDocument(
        code: string,
        format?: any,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/quotes/{code}/document',
            path: {
                'code': code,
            },
            query: {
                'format': format,
            },
        });
    }
}
