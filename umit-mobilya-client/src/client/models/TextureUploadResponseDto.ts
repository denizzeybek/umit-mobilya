/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type TextureUploadResponseDto = {
    /**
     * Yüklenen desenin public adresi. Yalnızca adminin yüklediğini hemen
     * görebilmesi için; kitaba YAZILMAZ, okuma anında yeniden kurulur.
     */
    textureUrl: string | null;
    /**
     * Kitaba yazılacak olan R2 nesne anahtarı.
     */
    textureName: string;
};

