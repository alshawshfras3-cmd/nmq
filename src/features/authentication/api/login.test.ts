import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import ToastFactory from "@/shared/lib/toast/toast";
import {authenticationAxiosInstance} from "./axios";
import {login} from "./login";

vi.mock('@/shared/lib/toast/toast', () => ({default: vi.fn()}));

function formWith(email = 'reader@example.com', password = 'test-password') {
    const form = new FormData();
    form.set('email', email);
    form.set('password', password);
    return form;
}

function responseWithRole(role: unknown) {
    return {data: {success: true, value: {
        userId: 'reader-1',
        accessToken: `header.${Buffer.from(JSON.stringify({role, name: 'أبو أمير 👋'})).toString('base64url')}.signature`,
    }}};
}

describe('login action', () => {
    const sessionStorage = {setItem: vi.fn()};

    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubGlobal('sessionStorage', sessionStorage);
        vi.spyOn(authenticationAxiosInstance, 'post').mockResolvedValue(responseWithRole('USER'));
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it.each(['  keep these spaces  ', ' \t '])('preserves password bytes and initializes the same ADMIN UI role as signup: %j', async password => {
        vi.mocked(authenticationAxiosInstance.post).mockResolvedValue(responseWithRole('ADMIN'));

        const result = await login(formWith('  Reader@example.com  ', password));

        expect(authenticationAxiosInstance.post).toHaveBeenCalledExactlyOnceWith('/login', expect.objectContaining({
            email: 'Reader@example.com', password,
        }));
        expect(sessionStorage.setItem).toHaveBeenCalledWith('user_id', 'reader-1');
        expect(sessionStorage.setItem).toHaveBeenCalledWith('user_role', 'ADMIN');
        expect(result).toBeInstanceOf(Response);
        expect(result?.headers.get('Location')).toBe('/');
    });

    it.each(['OWNER', ['ADMIN'], null])('uses USER for an unsupported role claim: %j', async role => {
        vi.mocked(authenticationAxiosInstance.post).mockResolvedValue(responseWithRole(role));

        await login(formWith());

        expect(sessionStorage.setItem).toHaveBeenCalledWith('user_role', 'USER');
    });

    it('rejects blank credentials without a request', async () => {
        expect(await login(formWith('   ', ''))).toBeNull();
        expect(authenticationAxiosInstance.post).not.toHaveBeenCalled();
        expect(sessionStorage.setItem).not.toHaveBeenCalled();
        expect(ToastFactory).toHaveBeenCalledWith({message: 'Email and password are required.', type: 'error'});
    });

    it('shows a rejected login response without changing the session', async () => {
        vi.mocked(authenticationAxiosInstance.post).mockRejectedValue({response: {data: 'Invalid credentials'}});

        expect(await login(formWith())).toBeNull();
        expect(sessionStorage.setItem).not.toHaveBeenCalled();
        expect(ToastFactory).toHaveBeenCalledWith({message: 'Invalid credentials', type: 'error'});
    });

    it('shows a logical API failure instead of silently ignoring it', async () => {
        vi.mocked(authenticationAxiosInstance.post).mockResolvedValue({data: {success: false, message: 'Account unavailable.'}});

        expect(await login(formWith())).toBeNull();
        expect(sessionStorage.setItem).not.toHaveBeenCalled();
        expect(ToastFactory).toHaveBeenCalledWith({message: 'Account unavailable.', type: 'error'});
    });

    it.each([null, {success: true}, {success: true, value: {userId: ''}}])(
        'does not create a session from malformed response data: %j', async data => {
            vi.mocked(authenticationAxiosInstance.post).mockResolvedValue({data});

            expect(await login(formWith())).toBeNull();
            expect(sessionStorage.setItem).not.toHaveBeenCalled();
            expect(ToastFactory).toHaveBeenCalledOnce();
        },
    );
});
