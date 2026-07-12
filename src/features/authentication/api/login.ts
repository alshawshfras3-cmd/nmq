import {replace} from "react-router";
import {supabase} from "@/shared/api/supabase";

export type LoginActionData = { error?: string };

function mapLoginError(message?: string): string {
    const lower = message?.toLowerCase() ?? "";
    if (lower.includes("email not confirmed")) return "Please verify your email before signing in.";
    if (lower.includes("invalid login") || lower.includes("invalid credentials")) return "Invalid email or password.";
    if (lower.includes("fetch") || lower.includes("network")) return "Unable to connect to the authentication service.";
    return "Unable to sign in. Please try again.";
}

export async function login(formData: FormData): Promise<Response | LoginActionData> {
    const email = String(formData.get('email') ?? '').trim().toLowerCase();
    const password = String(formData.get('password') ?? '');
    const returnTo = String(formData.get('returnTo') ?? '/');

    if (!email || !password) return {error: "Email and password are required."};

    const {error} = await supabase.auth.signInWithPassword({email, password});
    if (error) return {error: mapLoginError(error.message)};

    return replace(returnTo.startsWith('/') ? returnTo : '/');
}
