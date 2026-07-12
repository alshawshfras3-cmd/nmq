import {
    type BaseQueryFn,
    createApi,
    type FetchArgs,
    type FetchBaseQueryError,
    type FetchBaseQueryMeta,
    type QueryReturnValue
} from "@reduxjs/toolkit/query/react";
import {fetchBaseQuery} from "@reduxjs/toolkit/query";
import {config} from "@/shared";
import ToastFactory from "@/shared/lib/toast/toast";
import {supabase} from "@/shared/api/supabase";

const baseQueryWithSupabaseAuth: BaseQueryFn<
    string | FetchArgs,
    unknown,
    FetchBaseQueryError
> = async (args, api, extraOptions): Promise<QueryReturnValue<unknown, FetchBaseQueryError, FetchBaseQueryMeta>> => {
    const {data} = await supabase.auth.getSession();
    const accessToken = data.session?.access_token;

    return fetchBaseQuery({
        baseUrl: config.apiUrl,
        prepareHeaders: (headers) => {
            if (accessToken) {
                headers.set("Authorization", `Bearer ${accessToken}`);
            }
            return headers;
        },
    })(args, api, extraOptions);
}

export const homebranchApi = createApi({
    baseQuery: baseQueryWithSupabaseAuth,
    tagTypes: ['Book', 'BookShelf', 'User', 'Author', 'Job', 'BookDuplicate'],
    endpoints: () => ({})
})

/**
 * Type predicate to narrow an unknown error to `FetchBaseQueryError`
 */
export function isFetchBaseQueryError(
    error: unknown,
): error is FetchBaseQueryError {
    return typeof error === 'object' && error != null && 'status' in error
}

/**
 * Type predicate to narrow an unknown error to an object with a string 'message' property
 */
export function isErrorWithMessage(
    error: unknown,
): error is { message: string } {
    return (
        typeof error === 'object' &&
        error != null &&
        'message' in error &&
        typeof (error as any).message === 'string'
    )
}

export function handleRtkError(error: unknown) {
    if (isFetchBaseQueryError(error)) {
        ToastFactory({message: JSON.stringify(error.data), type: "error"});
    } else if (isErrorWithMessage(error)) {
        ToastFactory({message: error.message, type: "error"});
    } else {
        ToastFactory({message: "Something went wrong", type: "error"});
    }
}

export const authenticationApi = createApi({
    reducerPath: 'authentication',
    baseQuery: fetchBaseQuery({baseUrl: config.apiUrl}),
    endpoints: () => ({})
})
