import type {Route} from "./+types/login";

import TextField from "@/shared/ui/TextField";
import {Button, Card, Center, Separator, Stack, Text} from "@chakra-ui/react";
import {Link, useFetcher, useSearchParams} from "react-router";
import {login, type LoginActionData} from "@/features/authentication/api/login";
import {config} from "@/shared";
import {useEffect} from "react";
import ToastFactory from "@/shared/lib/toast/toast";
import {useColorMode} from "@/shared/ui/color-mode";


export async function clientAction({request}: Route.ClientActionArgs) {
    const formData = await request.formData();
    return await login(formData);
}

export default function Login() {
    const fetcher = useFetcher<LoginActionData>();
    const actionError = fetcher.data?.error;
    const [searchParams, setSearchParams] = useSearchParams();
    const error = searchParams.get("error");
    const returnTo = searchParams.get("returnTo") ?? "/";
    const verified = searchParams.get("verified");
    const passwordReset = searchParams.get("passwordReset");
    const {colorMode} = useColorMode();
    const logoSrc = colorMode === "dark"
        ? "/Logo%202-Color%20For%20Dark.svg"
        : "/Logo%202-Color%20For%20Light.svg";

    useEffect(() => {
        if (error) {
            ToastFactory({message: error, type: "error"});
            setSearchParams({}, {replace: true});
            return;
        }

        if (verified === "1") {
            ToastFactory({message: "Email verified. You can sign in now.", type: "success"});
            setSearchParams({}, {replace: true});
            return;
        }

        if (passwordReset === "1") {
            ToastFactory({message: "Password updated. You can sign in now.", type: "success"});
            setSearchParams({}, {replace: true});
        }
    }, [error, verified, passwordReset, setSearchParams]);

    return (
        <Center minH="100%" p={4}>
            <Card.Root w="full" maxW="sm" shadow="lg">
                <Card.Body px={6} pt={8} pb={6}>
                    <Stack align="center" gap={3}>
                        <img src={logoSrc} alt="HomeBranch" style={{height: "100px"}}/>
                        <Text color="fg.muted" fontSize="sm">Your personal library</Text>
                    </Stack>
                </Card.Body>
                <Separator/>
                <fetcher.Form method="post">
                    <input type="hidden" name="returnTo" value={returnTo}/>
                    <Card.Body px={6} pt={4} pb={2}>
                        <Stack gap={4}>
                            {actionError && <Text color="red.600" fontSize="sm">{actionError}</Text>}
                            <TextField label="Email" name="email" type="email" autoComplete="email" required/>
                            <TextField label="Password" name="password" type="password" autoComplete="current-password" required/>
                        </Stack>
                    </Card.Body>
                    <Card.Footer px={6} pb={6} flexDirection="column" gap={3}>
                        <Button type="submit" width="full" loading={fetcher.state !== "idle"}>
                            Sign In
                        </Button>
                        <Text textAlign="center" fontSize="sm" color="fg.muted">
                            <Link to="/forgot-password" style={{fontWeight: "bold"}}>Forgot password?</Link>
                        </Text>
                        {config.signupEnabled && (
                            <Text textAlign="center" fontSize="sm" color="fg.muted">
                                Don't have an account?{" "}
                                <Link to="/sign-up" style={{fontWeight: "bold"}}>Sign up</Link>
                            </Text>
                        )}
                    </Card.Footer>
                </fetcher.Form>
            </Card.Root>
        </Center>
    );
}
