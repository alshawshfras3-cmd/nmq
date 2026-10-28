import {authenticationAxiosInstance} from "@/features/authentication/api/axios";

export async function refreshAccessToken() {
    // Callers must distinguish an expired session from a temporary network failure.
    return authenticationAxiosInstance.post('/refresh');
}
