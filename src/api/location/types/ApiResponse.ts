// src/api/location/types/ApiResponse.ts
export type ApiResponse<T> = {
    status: string;
    message: string;
    payload: T;
};