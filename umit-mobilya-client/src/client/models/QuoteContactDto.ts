/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type QuoteContactDto = {
    /**
     * Teklifi isteyen kişinin adı.
     */
    name: string;
    /**
     * Türkiye telefon numarası. Boşluk, parantez ve tire kabul edilir;
     * tek zorunluluk on rakam içermesi.
     */
    phone: string;
    /**
     * İsteğe bağlı e-posta adresi.
     */
    email?: string;
    /**
     * Müşterinin eklemek istediği not.
     */
    note?: string;
};

