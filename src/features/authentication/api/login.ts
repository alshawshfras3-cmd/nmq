import {LoginDto} from "@/features/authentication/dtos";
import {authenticationAxiosInstance, axiosErrorHandler} from "@/features/authentication/api/axios";
import {replace} from "react-router";
import {getUiRoleFromAccessToken} from "./sessionRole";

export async function login(formData: FormData): Promise<Response | null> {
    const emailEntry = formData.get('email');
    const passwordEntry = formData.get('password');
    if (typeof emailEntry !== 'string' || !emailEntry.trim() || typeof passwordEntry !== 'string' || passwordEntry.length === 0) {
        return axiosErrorHandler({response: {data: {message: 'Email and password are required.'}}});
    }
    const email = emailEntry.trim();
    const password = passwordEntry;

    const loginDto = new LoginDto(email, password);

    return await authenticationAxiosInstance.post("/login", loginDto)
        .then(response => {
            const responseData = response.data;
            if (responseData?.success === true && typeof responseData.value?.userId === 'string' && responseData.value.userId.trim()) {
                sessionStorage.setItem('user_id', responseData.value.userId);
                sessionStorage.setItem('user_role', getUiRoleFromAccessToken(responseData.value.accessToken));
                return replace('/');
            }

            return axiosErrorHandler({response: {data: responseData}});
        })
        .catch(axiosErrorHandler);
}
