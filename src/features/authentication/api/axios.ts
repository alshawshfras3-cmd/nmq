import axios from "axios";
import {ApiErrorResponse, config} from "@/shared";
import ToastFactory from "@/shared/lib/toast/toast";

export const authenticationAxiosInstance = axios.create({
    baseURL: config.authenticationUrl,
    withCredentials: true,
})

function getErrorMessages(error: any): string[] {
    const status = error.response?.status;
    const statusText = error.response?.statusText;
    const data = error.response?.data;

    if (data && typeof data === "object") {
        const errorResponseData = new ApiErrorResponse(data);
        const messages = errorResponseData.message.filter(Boolean);

        if (messages.length > 0) {
            return messages;
        }

        if (typeof data.error === "string" && data.error.trim()) {
            return [data.error];
        }
    }

    if (typeof data === "string" && data.trim()) {
        return [data];
    }

    if (status) {
        const detail = statusText ? `: ${statusText}` : "";
        return [`Authentication service returned ${status}${detail}. Check VITE_AUTHENTICATION_URL and the auth service /sign-up endpoint.`];
    }

    if (error.request) {
        return ["Could not reach the authentication service. Please check VITE_AUTHENTICATION_URL and VITE_AUTHENTICATION_ROOT in the deployment environment."];
    }

    return ["Something went wrong, please try again later"];
}

export function axiosErrorHandler(error: any) {
    if (!error.handledByInterceptor) {
        getErrorMessages(error).forEach(message => {
            ToastFactory({message, type: "error"});
        })
    }
    return null;
}
