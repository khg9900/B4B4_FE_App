export type ApiResponse<T> = {
    status: string;
    message: string;
    payload: T;
};

export type ReportResponse = {
    id: number;
    reporter: number;
    disasterType: string;
    description: string;
    imageUrl: string;
    videoUrl: string;
    status: string;
    province: string;
    city: string;
    locationLat: number;
    locationLng: number;
    createdAt: string; // ISO date string
    updatedAt: string; // ISO date string
};