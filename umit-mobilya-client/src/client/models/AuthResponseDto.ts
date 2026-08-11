/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type AuthResponseDto = {
    /**
     * The signed-in user's id, as a bare hex string — not an object.
     */
    user: string;
    /**
     * Signed JWT, valid for three days. Also set as an httpOnly `jwt` cookie on
     * the same response; the frontend stores this copy in localStorage.
     */
    token: string;
};

