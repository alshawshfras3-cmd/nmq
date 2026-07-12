import {SignUpDto} from "@/features/authentication/dtos";
import {authenticationAxiosInstance, axiosErrorHandler} from "@/features/authentication/api/axios";
import {redirect} from "react-router";

export type SignUpActionData = {
    errors?: {
        name?: string;
        email?: string;
        password?: string;
        password_confirmation?: string;
    };
};

export default async function signUp(formData: FormData): Promise<Response | SignUpActionData | null> {
    const name = formData.get('name');
    const email = formData.get('email');
    const password = formData.get('password');
    const password_confirmation = formData.get('password_confirmation');

    if (
        typeof name !== 'string' ||
        typeof email !== 'string' ||
        typeof password !== 'string' ||
        typeof password_confirmation !== 'string'
    ) {
        return {errors: {email: 'Please complete all required fields.'}};
    }

    if (password !== password_confirmation) {
        return {errors: {password_confirmation: 'Passwords do not match.'}};
    }

    const signUpDto: SignUpDto = new SignUpDto(name, email, password, password_confirmation);

    return authenticationAxiosInstance.post('/sign-up', signUpDto)
        .then(response => {
            const responseData = response.data;
            if (responseData.success) {
                sessionStorage.setItem('user_id', responseData.value.userId);
                try {
                    const payload = JSON.parse(atob(responseData.value.accessToken.split('.')[1]));
                    sessionStorage.setItem('user_role', payload.roles?.[0] ?? 'USER');
                } catch {
                    sessionStorage.setItem('user_role', 'USER');
                }
                return redirect("/")
            }

            return null;
        })
        .catch(axiosErrorHandler);

}
