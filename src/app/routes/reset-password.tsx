import type {Route} from "./+types/reset-password";
import TextField from "@/shared/ui/TextField";
import {Button, Card, Center, Separator, Stack, Text} from "@chakra-ui/react";
import {Link, redirect, useFetcher} from "react-router";
import {supabase} from "@/shared/api/supabase";

export type ResetPasswordActionData = { error?: string; successMessage?: string };

export async function clientAction({request}: Route.ClientActionArgs): Promise<Response | ResetPasswordActionData> {
    const formData = await request.formData();
    const password = String(formData.get("password") ?? "");
    const passwordConfirmation = String(formData.get("password_confirmation") ?? "");

    if (password.length < 8) return {error: "Password must be at least 8 characters."};
    if (password !== passwordConfirmation) return {error: "Passwords do not match."};

    const {error} = await supabase.auth.updateUser({password});
    if (error) return {error: "Unable to update password. Please open the latest reset link and try again."};

    return redirect("/login?passwordReset=1");
}

export default function ResetPassword() {
    const fetcher = useFetcher<ResetPasswordActionData>();

    return (
        <Center minH="100%" p={4}>
            <Card.Root w="full" maxW="sm" shadow="lg">
                <Card.Body px={6} pt={8} pb={6}>
                    <Stack align="center" gap={3}>
                        <img src="/Logo%202-Color%20For%20Light.svg" alt="HomeBranch" style={{height: "100px"}}/>
                        <Text color="fg.muted" fontSize="sm">Choose a new password</Text>
                    </Stack>
                </Card.Body>
                <Separator/>
                <fetcher.Form method="post">
                    <Card.Body px={6} pt={4} pb={2}>
                        <Stack gap={4}>
                            {fetcher.data?.error && <Text color="red.600" fontSize="sm">{fetcher.data.error}</Text>}
                            <TextField label="New Password" name="password" type="password" autoComplete="new-password" required/>
                            <TextField label="Confirm New Password" name="password_confirmation" type="password" autoComplete="new-password" required/>
                        </Stack>
                    </Card.Body>
                    <Card.Footer px={6} pb={6} flexDirection="column" gap={3}>
                        <Button type="submit" width="full" loading={fetcher.state !== "idle"}>Update password</Button>
                        <Text textAlign="center" fontSize="sm" color="fg.muted">
                            <Link to="/login" style={{fontWeight: "bold"}}>Back to sign in</Link>
                        </Text>
                    </Card.Footer>
                </fetcher.Form>
            </Card.Root>
        </Center>
    );
}
