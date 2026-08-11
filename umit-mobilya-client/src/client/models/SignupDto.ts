/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type SignupDto = {
    /**
     * Login address. Stored lowercased and unique across users.
     */
    email: string;
    /**
     * Plain password, at least six characters. Never stored as given.
     */
    password: string;
};

