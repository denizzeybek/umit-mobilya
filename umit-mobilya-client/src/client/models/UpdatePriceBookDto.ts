/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type UpdatePriceBookDto = {
    /**
     * Fiyat kitabının tamamı. Her `PUT` yeni bir sürüm yazar; var olan kayıt
     * güncellenmez, çünkü geçmiş tekliflerin hangi rakamlarla verildiği geri
     * izlenebilir kalmalı.
     *
     * Gövde serbest şema: katalog admin'in elinde ve yeni bir malzeme alanı
     * eklemek migration gerektirmemeli.
     */
    data: Record<string, any>;
};

