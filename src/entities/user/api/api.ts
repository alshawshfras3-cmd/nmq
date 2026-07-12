import {homebranchApi} from "@/shared/api/rtk-query";
import type {CreateUserRequest, UpdateUserRoleRequest, UserModel} from "@/entities/user";
import type {FetchBaseQueryError} from "@reduxjs/toolkit/query";
import {supabase} from "@/shared/api/supabase";

function toUserModel(profile: any): UserModel {
    return {
        id: profile.id,
        name: profile.full_name,
        email: profile.email ?? "",
        role: profile.role,
        provider: "supabase",
    };
}

export const usersApi = homebranchApi.injectEndpoints({
    endpoints: (build => ({
        getUsers: build.query<UserModel[], void>({
            queryFn: async () => {
                const {data, error} = await supabase
                    .from("profiles")
                    .select("id, full_name, role, is_active, created_at, updated_at")
                    .order("created_at", {ascending: false});

                if (error) return {error: {status: 'CUSTOM_ERROR', error: error.message} as FetchBaseQueryError};
                return {data: (data ?? []).map(toUserModel)};
            },
            providesTags: (result) =>
                result
                    ? [...result.map(({id}) => ({type: 'User' as const, id})), {type: 'User', id: 'LIST'}]
                    : [{type: 'User', id: 'LIST'}]
        }),
        getUserById: build.query<UserModel, string>({
            queryFn: async (userId) => {
                const {data, error} = await supabase
                    .from("profiles")
                    .select("id, full_name, role, is_active, created_at, updated_at")
                    .eq("id", userId)
                    .single();

                if (error) return {error: {status: 'CUSTOM_ERROR', error: error.message} as FetchBaseQueryError};
                return {data: toUserModel(data)};
            },
            providesTags: result => result ? [{type: 'User' as const, id: result.id}] : []
        }),
        updateUserRole: build.mutation<UserModel, { id: string } & UpdateUserRoleRequest>({
            queryFn: async ({id, role}) => {
                const {data, error} = await supabase
                    .from("profiles")
                    .update({role})
                    .eq("id", id)
                    .select("id, full_name, role, is_active, created_at, updated_at")
                    .single();

                if (error) return {error: {status: 'CUSTOM_ERROR', error: error.message} as FetchBaseQueryError};
                return {data: toUserModel(data)};
            },
            invalidatesTags: [{type: 'User', id: 'LIST'}]
        }),
        createUser: build.mutation<UserModel, CreateUserRequest>({
            queryFn: async () => ({error: {status: 'CUSTOM_ERROR', error: 'Create users from the public sign-up flow.'} as FetchBaseQueryError}),
            invalidatesTags: [{type: 'User', id: 'LIST'}]
        }),
        deleteUser: build.mutation<void, string>({
            queryFn: async () => ({error: {status: 'CUSTOM_ERROR', error: 'Delete users from Supabase Auth admin tools.'} as FetchBaseQueryError}),
            invalidatesTags: [{type: 'User', id: 'LIST'}]
        }),
    }))
})

export const {
    useGetUsersQuery,
    useGetUserByIdQuery,
    useUpdateUserRoleMutation,
    useCreateUserMutation,
    useDeleteUserMutation,
} = usersApi;
