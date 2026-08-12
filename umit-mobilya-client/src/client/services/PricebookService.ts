/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PriceBookResponseDto } from '../models/PriceBookResponseDto';
import type { PriceBookVersionDto } from '../models/PriceBookVersionDto';
import type { TextureUploadBodyDto } from '../models/TextureUploadBodyDto';
import type { TextureUploadResponseDto } from '../models/TextureUploadResponseDto';
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
    /**
     * Kaplama deseni yükler.
     *
     * Yükleme yayınlamadan AYRI: görsel kovaya hemen gidiyor, anahtarı kitaba
     * yazmak adminin "Yeni sürüm yayınla" kararına kalıyor. Birleştirilseydi tek
     * bir desen denemesi bütün fiyat kitabını yeni bir sürüme itecekti.
     * @param formData
     * @returns TextureUploadResponseDto
     * @throws ApiError
     */
    public static priceBookControllerUploadTexture(
        formData: TextureUploadBodyDto,
    ): CancelablePromise<TextureUploadResponseDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/pricebook/texture',
            formData: formData,
            mediaType: 'multipart/form-data',
        });
    }
}
