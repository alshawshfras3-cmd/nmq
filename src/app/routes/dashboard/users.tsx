import type {Route} from "./+types/users";
import {UserManagementPage} from "@/pages/userManagement";
import {Navigate} from "react-router";
import {Center, Spinner} from "@chakra-ui/react";
import {useAuth} from "@/shared/api/context";

export function meta({}: Route.MetaArgs) {
    return [
        {title: "Homebranch - User Management"},
    ];
}

export default function Users() {
    const {loading, isAdmin} = useAuth();

    if (loading) return <Center minH="100%"><Spinner size="lg"/></Center>;
    if (!isAdmin) return <Navigate to="/" replace/>;

    return <UserManagementPage/>;
}
