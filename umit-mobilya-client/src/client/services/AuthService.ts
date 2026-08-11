/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AuthResponseDto } from '../models/AuthResponseDto';
import type { LoginDto } from '../models/LoginDto';
import type { MeResponseDto } from '../models/MeResponseDto';
import type { MessageResponseDto } from '../models/MessageResponseDto';
import type { SignupDto } from '../models/SignupDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AuthService {
    /**
     * Registers a user and signs them in straight away.
     * @param requestBody
     * @returns AuthResponseDto
     * @throws ApiError
     */
    public static authControllerSignup(
        requestBody: SignupDto,
    ): CancelablePromise<AuthResponseDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/signup',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Signs an existing user in.
     * @param requestBody
     * @returns AuthResponseDto
     * @throws ApiError
     */
    public static authControllerLogin(
        requestBody: LoginDto,
    ): CancelablePromise<AuthResponseDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/login',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Expires the session cookie. The body token is dropped by the client.
     * @returns MessageResponseDto
     * @throws ApiError
     */
    public static authControllerLogout(): CancelablePromise<MessageResponseDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/auth/logout',
        });
    }
    /**
     * The user behind the supplied Bearer token. Never includes the password.
     * @returns MeResponseDto
     * @throws ApiError
     */
    public static authControllerMe(): CancelablePromise<MeResponseDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/auth/me',
        });
    }
}
