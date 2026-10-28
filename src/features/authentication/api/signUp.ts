import {SignUpDto} from "@/features/authentication/dtos";
import {authenticationAxiosInstance, axiosErrorHandler} from "@/features/authentication/api/axios";
import {redirect} from "react-router";
import {getUiRoleFromAccessToken} from "./sessionRole";

export type SignUpActionData = {
    errors?: {
        name?: string;
        email?: string;
        password?: string;
        password_confirmation?: string;
    };
};

export default async function signUp(formData: FormData): Promise<Response | SignUpActionData | null> {
    const nameEntry = formData.get('name');
    const emailEntry = formData.get('email');
    const passwordEntry = formData.get('password');
    const confirmationEntry = formData.get('password_confirmation');
    const name = typeof nameEntry === 'string' ? nameEntry.trim() : '';
    const email = typeof emailEntry === 'string' ? emailEntry.trim() : '';
    // Check for blank passwords without changing the bytes sent to the server.
    const password = typeof passwordEntry === 'string' ? passwordEntry : '';
    const password_confirmation = typeof confirmationEntry === 'string' ? confirmationEntry : '';
    const errors: NonNullable<SignUpActionData['errors']> = {};

    if (!name) errors.name = 'Name is required.';
    if (!email) errors.email = 'Email is required.';
    if (!password.trim()) errors.password = 'Password is required.';
    if (!password_confirmation.trim()) errors.password_confirmation = 'Please confirm your password.';
    if (!errors.password && !errors.password_confirmation && password !== password_confirmation) {
        errors.password_confirmation = 'Passwords do not match.';
    }

    if (Object.keys(errors).length > 0) return {errors};

    const signUpDto: SignUpDto = new SignUpDto(name, email, password, password_confirmation);

    return authenticationAxiosInstance.post('/sign-up', signUpDto)
        .then(response => {
            const responseData = response.data;
            if (responseData?.success === true && typeof responseData.value?.userId === 'string' && responseData.value.userId.trim()) {
                sessionStorage.setItem('user_id', responseData.value.userId);
                sessionStorage.setItem('user_role', getUiRoleFromAccessToken(responseData.value.accessToken));
                return redirect("/")
            }

            return axiosErrorHandler({response: {data: responseData}});
        })
        .catch(axiosErrorHandler);

}
