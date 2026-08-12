/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CategoryResponseDto } from './CategoryResponseDto';
export type ProductResponseDto = {
    /**
     * Public URLs matching `imageNameList`, position for position.
     */
    imageUrlList: Array<string | null>;
    /**
     * Konfigüratör başlangıç noktası: `{ productType, config }`. Arayüz bunu
     * URL'e kodlayıp "benzerini kendi ölçünle kur" bağlantısını kuruyor;
     * portfolyoyu vitrin olmaktan çıkarıp huniye çeviriyor.
     */
    configuratorPreset?: Record<string, any>;
    _id: string;
    name: string;
    /**
     * R2 object key of the main image. Never send this back as a URL.
     */
    imageName?: string;
    /**
     * Permanent public R2 URL composed from `imageName`, or null when unset.
     */
    imageUrl: string | null;
    /**
     * R2 object keys of the gallery images.
     */
    imageNameList: Array<string>;
    sizes?: string;
    description?: string;
    category?: CategoryResponseDto;
};

