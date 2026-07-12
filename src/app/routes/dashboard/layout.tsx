import {Box, Center, Spinner} from "@chakra-ui/react";
import {NavigationCard} from "@/components/navigation/NavigationCard";
import {MobileNavigation} from "@/components/navigation/MobileNavigation";
import {MobileNavProvider} from "@/components/navigation/MobileNavContext";
import {Navigate, Outlet, useLocation} from "react-router";
import {useLibraryEvents} from "@/shared/hooks";
import {DragDropOverlay} from "@/entities/book";
import {useAuth} from "@/shared/api/context";

export default function Layout() {
    const {loading, isAuthenticated} = useAuth();
    const location = useLocation();
    useLibraryEvents();

    if (loading) {
        return <Center minH="100%"><Spinner size="lg"/></Center>;
    }

    if (!isAuthenticated) {
        return <Navigate to={`/login?returnTo=${encodeURIComponent(location.pathname + location.search)}`} replace/>;
    }

    return (
        <MobileNavProvider>
            <DragDropOverlay/>
            <MobileNavigation/>
            <Box display={{base: "none", md: "block"}}>
                <NavigationCard/>
            </Box>
            <Box p={4} pt={{base: 0, md: 0}} ml={{base: 0, md: "250px"}} height={"100%"}>
                <Outlet/>
            </Box>
        </MobileNavProvider>
    )
}
