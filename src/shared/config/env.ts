const configuredPageSize = Number(import.meta.env.VITE_ITEMS_PER_PAGE);

export const config = {
    apiUrl: import.meta.env.VITE_API_URL?.trim() || '/api',
    authenticationUrl: import.meta.env.VITE_AUTHENTICATION_URL?.trim() || '/auth',
    itemsPerPage: Number.isSafeInteger(configuredPageSize) && configuredPageSize > 0
        ? configuredPageSize
        : 20,
    signupEnabled: import.meta.env.VITE_SIGNUP_ENABLED !== 'false',
};
