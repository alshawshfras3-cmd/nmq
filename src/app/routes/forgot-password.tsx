import type {Route} from "./+types/forgot-password";
import TextField from "@/shared/ui/TextField";
import {Button, Card, Center, Separator, Stack, Text} from "@chakra-ui/react";
import {Link, useFetcher} from "react-router";
import {supabase} from "@/shared/api/supabase";

export type ForgotPasswordActionData = { error?: string; successMessage?: string };

export async function clientAction({request}: Route.ClientActionArgs): Promise<ForgotPasswordActionData> {
    const formData = await request.formData();
    const email = String(formData.get("email") ?? "").trim().toLowerCase();

    if (!email) return {error: "Email is required."};

    const {error} = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) return {error: "Unable to send password reset email. Please try again."};

    return {successMessage: "Password reset email sent. Please check your inbox."};
}

export default function ForgotPassword() {
    const fetcher = useFetcher<ForgotPasswordActionData>();

    return (
        <Center minH="100%" p={4}>
            <Card.Root w="full" maxW="sm" shadow="lg">
                <Card.Body px={6} pt={8} pb={6}>
                    <Stack align="center" gap={3}>
                        <img src="/Logo%202-Color%20For%20Light.svg" alt="HomeBranch" style={{height: "100px"}}/>
                        <Text color="fg.muted" fontSize="sm">Reset your password</Text>
                    </Stack>
                </Card.Body>
                <Separator/>
                <fetcher.Form method="post">
                    <Card.Body px={6} pt={4} pb={2}>
                        <Stack gap={4}>
                            {fetcher.data?.error && <Text color="red.600" fontSize="sm">{fetcher.data.error}</Text>}
                            {fetcher.data?.successMessage && <Text color="green.600" fontSize="sm">{fetcher.data.successMessage}</Text>}
                            <TextField label="Email" name="email" type="email" autoComplete="email" required/>
                        </Stack>
                    </Card.Body>
                    <Card.Footer px={6} pb={6} flexDirection="column" gap={3}>
                        <Button type="submit" width="full" loading={fetcher.state !== "idle"}>Send reset link</Button>
                        <Text textAlign="center" fontSize="sm" color="fg.muted">
                            <Link to="/login" style={{fontWeight: "bold"}}>Back to sign in</Link>
                        </Text>
                    </Card.Footer>
                </fetcher.Form>
            </Card.Root>
        </Center>
    );
}
