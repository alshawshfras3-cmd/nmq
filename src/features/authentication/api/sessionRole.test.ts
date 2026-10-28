import {describe, expect, it} from "vitest";
import {getUiRoleFromAccessToken} from "./sessionRole";

function tokenFor(payload: unknown) {
    return `header.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.signature`;
}

describe('getUiRoleFromAccessToken', () => {
    it('reads the singular ADMIN claim from an unpadded base64url UTF-8 payload', () => {
        const token = tokenFor({role: 'ADMIN', name: 'أبو أمير 👋'});

        expect(getUiRoleFromAccessToken(token)).toBe('ADMIN');
    });

    it.each([
        {role: 'USER'},
        {role: 'admin'},
        {role: 'OWNER'},
        {role: ['ADMIN']},
        {roles: ['ADMIN']},
        {},
        null,
        'ADMIN',
        ['ADMIN'],
    ])('uses USER for a non-administrative or unsupported claim: %j', payload => {
        expect(getUiRoleFromAccessToken(tokenFor(payload))).toBe('USER');
    });

    it.each([
        undefined,
        null,
        42,
        '',
        'not-a-token',
        'header..signature',
        'header.!.signature',
        'header.a.signature',
        `header.${Buffer.from('not json').toString('base64url')}.signature`,
        `header.${Buffer.from([0xff]).toString('base64url')}.signature`,
    ])('safely falls back for a malformed token: %s', token => {
        expect(getUiRoleFromAccessToken(token)).toBe('USER');
    });
});
