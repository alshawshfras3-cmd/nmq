declare module "@supabase/supabase-js" {
    export interface User { id: string; email?: string; user_metadata?: Record<string, unknown> }
    export interface Session { access_token: string; user: User }
    export type AuthChangeEvent = string;
    export interface SupabaseClient {
        auth: {
            getSession(): Promise<{data: {session: Session | null}; error: any}>;
            getUser(): Promise<{data: {user: User | null}; error: any}>;
            onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void): {data: {subscription: {unsubscribe(): void}}};
            signUp(args: any): Promise<{data: {session: Session | null; user: User | null}; error: any}>;
            signInWithPassword(args: any): Promise<{data: {session: Session | null; user: User | null}; error: any}>;
            signOut(): Promise<{error: any}>;
            resetPasswordForEmail(email: string, options?: any): Promise<{data: unknown; error: any}>;
            updateUser(attributes: any): Promise<{data: {user: User | null}; error: any}>;
        };
        from(table: string): any;
    }
    export function createClient(url: string, key: string, options?: any): SupabaseClient;
}
