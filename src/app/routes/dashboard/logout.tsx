import type {Route} from './+types/logout';
import {redirect} from "react-router";
import {supabase} from "@/shared/api/supabase";
import {store} from "@/app/store";
import {homebranchApi} from "@/shared/api/rtk-query";

export async function clientAction({}: Route.ClientActionArgs) {
    const {error} = await supabase.auth.signOut();
    store.dispatch(homebranchApi.util.resetApiState());

    if (error) {
        return {error: "Unable to sign out. Please try again."};
    }

    return redirect("/login");
}
