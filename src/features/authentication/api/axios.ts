import axios from "axios";
import {config} from "@/shared/config/env";
import ToastFactory from "@/shared/lib/toast/toast";

export const authenticationAxiosInstance = axios.create({
    baseURL: config.authenticationUrl,
    withCredentials: true,
})

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function getErrorMessages(data: unknown): string[] {
    const message = isRecord(data) && !Array.isArray(data) ? data.message : data;
    const messages = Array.isArray(message) ? message : [message];

    return messages
        .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
        .map(value => value.trim());
}

export function axiosErrorHandler(error: unknown): null {
    const details = isRecord(error) ? error : undefined;
    if (details?.handledByInterceptor === true) return null;

    const response = isRecord(details?.response) ? details.response : undefined;
    const messages = getErrorMessages(response?.data);

    if (messages.length > 0) {
        messages.forEach(message => ToastFactory({message, type: "error"}));
    } else if (details?.request && !response) {
        ToastFactory({message: "Could not connect. Check your connection and try again.", type: "error"});
    } else {
        ToastFactory({message: "Something went wrong. Please try again.", type: "error"});
    }
    return null;
}
