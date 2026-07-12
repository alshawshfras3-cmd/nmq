import {createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState} from "react";
import {useNavigate} from "react-router";
import type {Session, User} from "@supabase/supabase-js";
import {setNavigateCallback} from "@/shared/api/axios";
import {supabase, type Profile} from "@/shared/api/supabase";
import ToastFactory from "@/shared/lib/toast/toast";

interface AuthContextValue {
    session: Session | null;
    user: User | null;
    profile: Profile | null;
    loading: boolean;
    isAuthenticated: boolean;
    isAdmin: boolean;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthContextProvider = ({children}: PropsWithChildren) => {
    const navigate = useNavigate();
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const profileRequestId = useRef(0);

    const refreshProfile = useCallback(async () => {
        const {data: {user}} = await supabase.auth.getUser();
        const requestId = ++profileRequestId.current;

        if (!user) {
            setProfile(null);
            return;
        }

        const {data, error} = await supabase
            .from("profiles")
            .select("id, full_name, role, is_active, created_at, updated_at")
            .eq("id", user.id)
            .single();

        if (requestId !== profileRequestId.current) return;

        if (error) {
            setProfile(null);
            ToastFactory({message: "Unable to load your profile.", type: "error"});
            return;
        }

        setProfile(data as Profile);
    }, []);

    useEffect(() => {
        setNavigateCallback(navigate);
    }, [navigate]);

    useEffect(() => {
        let mounted = true;

        supabase.auth.getSession().then(async ({data}) => {
            if (!mounted) return;
            setSession(data.session);
            if (data.session) await refreshProfile();
            if (mounted) setLoading(false);
        });

        const {data: subscription} = supabase.auth.onAuthStateChange((_event, nextSession) => {
            setSession(nextSession);
            if (nextSession) {
                void refreshProfile();
            } else {
                setProfile(null);
            }
            setLoading(false);
        });

        return () => {
            mounted = false;
            subscription.subscription.unsubscribe();
        };
    }, [refreshProfile]);

    const signOut = useCallback(async () => {
        const {error} = await supabase.auth.signOut();
        if (error) {
            ToastFactory({message: "Unable to sign out. Please try again.", type: "error"});
            return;
        }
        setSession(null);
        setProfile(null);
        navigate("/login", {replace: true});
    }, [navigate]);

    const value = useMemo<AuthContextValue>(() => ({
        session,
        user: session?.user ?? null,
        profile,
        loading,
        isAuthenticated: Boolean(session?.user),
        isAdmin: profile?.role === "ADMIN",
        signOut,
        refreshProfile,
    }), [loading, profile, refreshProfile, session, signOut]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthContextProvider");
    return context;
}
