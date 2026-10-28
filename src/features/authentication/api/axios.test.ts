import {beforeEach, describe, expect, it, vi} from "vitest";
import ToastFactory from "@/shared/lib/toast/toast";
import {axiosErrorHandler} from "./axios";

vi.mock('@/shared/lib/toast/toast', () => ({default: vi.fn()}));

describe('authentication error feedback', () => {
    beforeEach(() => vi.clearAllMocks());

    it.each([
        {name: 'plain response text', data: ' Invalid credentials ', messages: ['Invalid credentials']},
        {name: 'a single message', data: {message: 'Email is already registered.'}, messages: ['Email is already registered.']},
        {name: 'message arrays', data: {message: ['Email is invalid.', 'Password is required.']}, messages: ['Email is invalid.', 'Password is required.']},
        {name: 'mixed arrays', data: {message: [null, 42, '', '  Try again.  ', {}]}, messages: ['Try again.']},
        {name: 'a response array', data: ['First error.', 'Second error.'], messages: ['First error.', 'Second error.']},
    ])('shows useful text from $name', ({data, messages}) => {
        expect(axiosErrorHandler({response: {data}})).toBeNull();
        expect(vi.mocked(ToastFactory).mock.calls.map(([params]) => params.message)).toEqual(messages);
        expect(ToastFactory).toHaveBeenCalledWith({message: messages[0], type: 'error'});
    });

    it.each([undefined, null, 42, '', {}, {message: null}, {message: {}}, {message: [null, 42, ' ']}])(
        'handles an empty or malformed response without throwing: %j', data => {
            expect(axiosErrorHandler({response: {data}})).toBeNull();
            expect(ToastFactory).toHaveBeenCalledExactlyOnceWith({
                message: 'Something went wrong. Please try again.',
                type: 'error',
            });
        },
    );

    it.each([undefined, null, 42, 'unexpected error', new Error('Unexpected failure')])(
        'handles an unexpected error value without throwing: %s', error => {
            expect(axiosErrorHandler(error)).toBeNull();
            expect(ToastFactory).toHaveBeenCalledOnce();
        },
    );

    it('gives connection feedback when the request received no response', () => {
        axiosErrorHandler({request: {}});

        expect(ToastFactory).toHaveBeenCalledExactlyOnceWith({
            message: 'Could not connect. Check your connection and try again.',
            type: 'error',
        });
    });

    it('does not duplicate feedback already handled by an interceptor', () => {
        expect(axiosErrorHandler({handledByInterceptor: true, response: {data: 'Expired session'}})).toBeNull();
        expect(ToastFactory).not.toHaveBeenCalled();
    });
});
