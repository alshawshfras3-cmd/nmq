import {beforeEach, describe, expect, it, vi} from "vitest";

beforeEach(() => {
    vi.resetModules();
    for (const name of ["VITE_API_URL", "VITE_AUTHENTICATION_URL", "VITE_ITEMS_PER_PAGE", "VITE_SIGNUP_ENABLED"]) {
        vi.stubEnv(name, undefined);
    }
});

describe("client configuration", () => {
    it("routes a default installation through the documented API and authentication proxies", async () => {
        const {config} = await import("./env");
        expect(config.apiUrl).toBe("/api");
        expect(config.authenticationUrl).toBe("/auth");
        expect(config.itemsPerPage).toBe(20);
        expect(config.signupEnabled).toBe(true);
    });

    it("uses explicitly configured remote services and numeric pagination", async () => {
        vi.stubEnv("VITE_API_URL", "https://library.example.test/api");
        vi.stubEnv("VITE_AUTHENTICATION_URL", "https://auth.example.test");
        vi.stubEnv("VITE_ITEMS_PER_PAGE", "40");
        const {config} = await import("./env");
        expect(config.apiUrl).toBe("https://library.example.test/api");
        expect(config.authenticationUrl).toBe("https://auth.example.test");
        expect(config.itemsPerPage).toBe(40);
    });

    it("treats blank service overrides as unset", async () => {
        vi.stubEnv("VITE_API_URL", "  ");
        vi.stubEnv("VITE_AUTHENTICATION_URL", "");
        const {config} = await import("./env");
        expect(config.apiUrl).toBe("/api");
        expect(config.authenticationUrl).toBe("/auth");
    });

    it.each(["", "0", "-1", "2.5", "not-a-number", "Infinity"])(
        "keeps pagination usable when VITE_ITEMS_PER_PAGE is %j",
        async (value) => {
            vi.stubEnv("VITE_ITEMS_PER_PAGE", value);
            const {config} = await import("./env");
            expect(config.itemsPerPage).toBe(20);
        },
    );

    it("respects explicitly disabled signup", async () => {
        vi.stubEnv("VITE_SIGNUP_ENABLED", "false");
        const {config} = await import("./env");
        expect(config.signupEnabled).toBe(false);
    });
});
