import {redirect} from "react-router";
import {supabase} from "@/shared/api/supabase";

export type SignUpActionData = {
    successMessage?: string;
    successEmail?: string;
    errors?: {
        name?: string;
        email?: string;
        password?: string;
        password_confirmation?: string;
    };
};

function mapSignUpError(message?: string): SignUpActionData {
    const lower = message?.toLowerCase() ?? "";
    if (lower.includes("already") || lower.includes("registered")) return {errors: {email: "This email is already registered."}};
    if (lower.includes("invalid email")) return {errors: {email: "Please enter a valid email address."}};
    if (lower.includes("password")) return {errors: {password: "Password is too weak. Use at least 8 characters."}};
    if (lower.includes("fetch") || lower.includes("network")) return {errors: {email: "Unable to connect to the authentication service."}};
    return {errors: {email: "Unable to create the account. Please try again."}};
}

export default async function signUp(formData: FormData): Promise<Response | SignUpActionData> {
    const name = String(formData.get('name') ?? '').trim();
    const email = String(formData.get('email') ?? '').trim().toLowerCase();
    const password = String(formData.get('password') ?? '');
    const passwordConfirmation = String(formData.get('password_confirmation') ?? '');

    if (!name || !email || !password || !passwordConfirmation) {
        return {errors: {email: 'Please complete all required fields.'}};
    }

    if (password !== passwordConfirmation) {
        return {errors: {password_confirmation: 'Passwords do not match.'}};
    }

    if (password.length < 8) {
        return {errors: {password: 'Password must be at least 8 characters.'}};
    }

    const {data, error} = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {full_name: name},
            emailRedirectTo: `${window.location.origin}/email-verified`,
        },
    });

    if (error) return mapSignUpError(error.message);

    if (data.session) return redirect('/');

    return {
        successEmail: email,
        successMessage: 'Account created. Please check your email and open the verification link before signing in.',
    };
}
