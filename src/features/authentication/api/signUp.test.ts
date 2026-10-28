import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import ToastFactory from "@/shared/lib/toast/toast";
import {authenticationAxiosInstance} from "./axios";
import signUp from "./signUp";

vi.mock('@/shared/lib/toast/toast', () => ({default: vi.fn()}));

function formWith(values: Record<string, string> = {}) {
    const form = new FormData();
    Object.entries({
        name: 'Reader',
        email: 'reader@example.com',
        password: 'test-password',
        password_confirmation: 'test-password',
        ...values,
    }).forEach(([key, value]) => form.set(key, value));
    return form;
}

function successResponse(payload: unknown = {role: 'USER'}) {
    return {
        data: {
            success: true,
            value: {
                userId: 'reader-1',
                accessToken: `header.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.signature`,
            },
        },
    };
}

describe('signUp action', () => {
    const sessionStorage = {setItem: vi.fn()};

    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubGlobal('sessionStorage', sessionStorage);
        vi.spyOn(authenticationAxiosInstance, 'post').mockResolvedValue(successResponse());
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it.each(['', ' \t '])('returns errors for every blank required field before sending a request: %j', async blank => {
        const form = formWith({name: blank, email: blank, password: blank, password_confirmation: blank});

        expect(await signUp(form)).toEqual({errors: {
            name: 'Name is required.',
            email: 'Email is required.',
            password: 'Password is required.',
            password_confirmation: 'Please confirm your password.',
        }});
        expect(authenticationAxiosInstance.post).not.toHaveBeenCalled();
        expect(sessionStorage.setItem).not.toHaveBeenCalled();
    });

    it('rejects missing and non-text form fields without sending a request', async () => {
        const form = formWith();
        form.delete('email');
        form.set('name', new Blob(['Reader']), 'name.txt');

        expect(await signUp(form)).toEqual({errors: {name: 'Name is required.', email: 'Email is required.'}});
        expect(authenticationAxiosInstance.post).not.toHaveBeenCalled();
    });

    it('returns a confirmation-field error for mismatching passwords', async () => {
        expect(await signUp(formWith({password_confirmation: 'different'}))).toEqual({
            errors: {password_confirmation: 'Passwords do not match.'},
        });
        expect(authenticationAxiosInstance.post).not.toHaveBeenCalled();
    });

    it('preserves password bytes and stores the ADMIN role returned by the auth service', async () => {
        vi.mocked(authenticationAxiosInstance.post).mockResolvedValue(successResponse({role: 'ADMIN', name: 'أبو أمير 👋'}));
        const password = '  keep these spaces  ';

        const result = await signUp(formWith({
            name: '  أبو أمير  ',
            email: '  Reader@example.com  ',
            password,
            password_confirmation: password,
        }));

        expect(authenticationAxiosInstance.post).toHaveBeenCalledExactlyOnceWith('/sign-up', expect.objectContaining({
            name: 'أبو أمير',
            email: 'Reader@example.com',
            password,
            password_confirmation: password,
        }));
        expect(sessionStorage.setItem).toHaveBeenCalledWith('user_id', 'reader-1');
        expect(sessionStorage.setItem).toHaveBeenCalledWith('user_role', 'ADMIN');
        expect(result).toBeInstanceOf(Response);
        expect((result as Response).headers.get('Location')).toBe('/');
    });

    it('uses USER rather than an unsupported elevated role', async () => {
        vi.mocked(authenticationAxiosInstance.post).mockResolvedValue(successResponse({role: 'OWNER'}));

        await signUp(formWith());

        expect(sessionStorage.setItem).toHaveBeenCalledWith('user_role', 'USER');
    });

    it('does not create a client session from an incomplete success response', async () => {
        vi.mocked(authenticationAxiosInstance.post).mockResolvedValue({data: {success: true, value: {}}});

        expect(await signUp(formWith())).toBeNull();
        expect(sessionStorage.setItem).not.toHaveBeenCalled();
        expect(ToastFactory).toHaveBeenCalledOnce();
    });

    it('surfaces backend validation errors without throwing or redirecting', async () => {
        vi.mocked(authenticationAxiosInstance.post).mockRejectedValue({response: {data: {message: ['Email is already registered.']}}});

        expect(await signUp(formWith())).toBeNull();
        expect(sessionStorage.setItem).not.toHaveBeenCalled();
        expect(ToastFactory).toHaveBeenCalledWith({message: 'Email is already registered.', type: 'error'});
    });

    it('handles a network failure with user-facing connection feedback', async () => {
        vi.mocked(authenticationAxiosInstance.post).mockRejectedValue({request: {}});

        expect(await signUp(formWith())).toBeNull();
        expect(sessionStorage.setItem).not.toHaveBeenCalled();
        expect(ToastFactory).toHaveBeenCalledWith({message: 'Could not connect. Check your connection and try again.', type: 'error'});
    });
});
