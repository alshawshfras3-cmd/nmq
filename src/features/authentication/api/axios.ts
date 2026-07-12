import axios from "axios";
import {ApiErrorResponse, config} from "@/shared";
import ToastFactory from "@/shared/lib/toast/toast";

export const authenticationAxiosInstance = axios.create({
    baseURL: config.authenticationUrl,
    withCredentials: true,
})

export function axiosErrorHandler(error: any) {
    if (!error.handledByInterceptor) {
        if (error.response?.data) {
            const errorResponseData = new ApiErrorResponse(error.response.data);
            errorResponseData.message.forEach(message => {
                ToastFactory({message: message, type: "error"});
            })
        } else if (error.request) {
            ToastFactory({message: "Could not reach the authentication service. Please check the deployment environment variables.", type: "error"});
        } else {
            ToastFactory({message: "Something went wrong, please try again later", type: "error"});
        }
    }
    return null;
}
