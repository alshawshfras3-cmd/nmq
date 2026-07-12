import type {Route} from "./+types/sign-up";

import TextField from "@/shared/ui/TextField";
import {Button, Card, Center, Separator, Stack, Text} from "@chakra-ui/react";
import {Link, redirect, useFetcher} from "react-router";
import signUp, {type SignUpActionData} from "@/features/authentication/api/signUp";
import {config} from "@/shared";
import {useColorMode} from "@/shared/ui/color-mode";

export async function clientLoader() {
    if (!config.signupEnabled) {
        return redirect("/login");
    }
}

export async function clientAction({request}: Route.ClientActionArgs) {
    const formData = await request.formData()
    return await signUp(formData);
}

export default function SignUp() {
    const fetcher = useFetcher<SignUpActionData>();
    const errors = fetcher.data?.errors ?? {};
    const successMessage = fetcher.data?.successMessage;
    const successEmail = fetcher.data?.successEmail;
    const {colorMode} = useColorMode();
    const logoSrc = colorMode === "dark"
        ? "/Logo%202-Color%20For%20Dark.svg"
        : "/Logo%202-Color%20For%20Light.svg";

    return (
        <Center minH="100%" p={4}>
            <Card.Root w="full" maxW="sm" shadow="lg">
                <Card.Body px={6} pt={8} pb={6}>
                    <Stack align="center" gap={3}>
                        <img src={logoSrc} alt="HomeBranch" style={{height: "100px"}}/>
                        <Text color="fg.muted" fontSize="sm">Create your account</Text>
                    </Stack>
                </Card.Body>
                <Separator/>
                <fetcher.Form method="post">
                    <Card.Body px={6} pt={4} pb={2}>
                        <Stack gap={4}>
                            {successMessage ? (
                                <Stack gap={3} textAlign="center">
                                    <Text color="green.600" fontSize="md" fontWeight="bold">
                                        Check your email
                                    </Text>
                                    <Text color="fg.muted" fontSize="sm">
                                        {successMessage}
                                    </Text>
                                    {successEmail && (
                                        <Text color="fg.muted" fontSize="sm" fontWeight="medium">
                                            Verification email sent to {successEmail}.
                                        </Text>
                                    )}
                                </Stack>
                            ) : (
                                <>
                                    <TextField label="Name" name="name" autoComplete="name" error={Boolean(errors.name)} errorText={errors.name} required/>
                                    <TextField label="Email" name="email" type="email" autoComplete="email" error={Boolean(errors.email)} errorText={errors.email} required/>
                                    <TextField label="Password" name="password" type="password" autoComplete="new-password" error={Boolean(errors.password)} errorText={errors.password} required/>
                                    <TextField label="Confirm Password" name="password_confirmation" type="password" autoComplete="new-password" error={Boolean(errors.password_confirmation)} errorText={errors.password_confirmation} required/>
                                </>
                            )}
                        </Stack>
                    </Card.Body>
                    <Card.Footer px={6} pb={6} flexDirection="column" gap={3}>
                        {successMessage ? (
                            <Button asChild width="full">
                                <Link to="/login?verified=pending">Go to Sign in</Link>
                            </Button>
                        ) : (
                            <Button type="submit" width="full" loading={fetcher.state !== "idle"}>
                                Create Account
                            </Button>
                        )}
                        <Text textAlign="center" fontSize="sm" color="fg.muted">
                            Already have an account?{" "}
                            <Link to="/login" style={{fontWeight: "bold"}}>Sign in</Link>
                        </Text>
                    </Card.Footer>
                </fetcher.Form>
            </Card.Root>
        </Center>
    );
}
