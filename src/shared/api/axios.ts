import axios, {type AxiosError, type InternalAxiosRequestConfig} from "axios";

import {config} from "@/shared/config";
import {refreshAccessToken} from "@/features/authentication/api/refreshAccessToken";

let _navigate: ((path: string) => void) | null = null;
let refreshPromise: Promise<unknown> | null = null;

type RetryableRequest = InternalAxiosRequestConfig & {_authRetry?: boolean};

function endSession(error: AxiosError & {handledByInterceptor?: boolean}) {
    error.handledByInterceptor = true;
    try {
        sessionStorage.removeItem('user_id');
        sessionStorage.removeItem('user_role');
    } catch {
        // A browser that blocks storage must still be able to return to sign-in.
    }
    if (_navigate) {
        _navigate('/login');
    } else if (typeof window !== 'undefined') {
        window.location.href = '/login';
    }
}

async function refreshSession() {
    if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
            refreshPromise = null;
        });
    }
    await refreshPromise;
}

export const setNavigateCallback = (navigate: ((path: string) => void) | null) => {
    _navigate = navigate;
}

export const axiosInstance = axios.create({
    baseURL: config.apiUrl,
    headers: {'Content-Type': 'application/json'},
    withCredentials: true,
})

axiosInstance.interceptors.response.use(
    response => response,
    async (error: unknown) => {
        if (!axios.isAxiosError(error) || error.response?.status !== 401 || !error.config) {
            return Promise.reject(error);
        }

        const prevRequest = error.config as RetryableRequest;
        if (prevRequest._authRetry) {
            endSession(error);
            return Promise.reject(error);
        }

        prevRequest._authRetry = true;
        try {
            await refreshSession();
        } catch (refreshError) {
            if (axios.isAxiosError(refreshError) && [401, 403].includes(refreshError.response?.status ?? 0)) {
                endSession(refreshError);
            }
            // Offline/5xx refresh failures must not silently invalidate a user's session.
            return Promise.reject(refreshError);
        }
        return axiosInstance(prevRequest);
    }
);

export const authAxiosInstance = axios.create({
    baseURL: config.authenticationUrl,
    headers: {'Content-Type': 'application/json'},
    withCredentials: true,
});
