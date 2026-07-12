import axios from "axios";
import {config} from "@/shared";
import {supabase} from "@/shared/api/supabase";

let _navigate: ((path: string) => void) | null = null;

export const setNavigateCallback = (navigate: ((path: string) => void) | null) => {
    _navigate = navigate;
}

export const axiosInstance = axios.create({
    baseURL: config.apiUrl,
    headers: {'Content-Type': 'application/json'},
})

axiosInstance.interceptors.request.use(async (request) => {
    const {data} = await supabase.auth.getSession();
    const accessToken = data.session?.access_token;
    if (accessToken) {
        request.headers.Authorization = `Bearer ${accessToken}`;
    }
    return request;
});

axiosInstance.interceptors.response.use(
    response => response,
    async (error) => {
        if (error.response?.status === 401) {
            if (_navigate) {
                _navigate("/login");
            } else {
                window.location.href = "/login";
            }
            error.handledByInterceptor = true;
        }
        return Promise.reject(error);
    }
);

// Temporary compatibility for non-auth settings APIs still backed by the existing app API.
export const authAxiosInstance = axiosInstance;
