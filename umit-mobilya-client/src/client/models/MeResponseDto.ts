/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PublicUserDto } from './PublicUserDto';
export type MeResponseDto = {
    /**
     * Always "Token is valid". Kept because the frontend store reads the envelope.
     */
    message: string;
    user: PublicUserDto;
};

