import axios, {AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig} from "axios";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";

const refresh = vi.hoisted(() => vi.fn());
vi.mock("@/features/authentication/api/refreshAccessToken", () => ({refreshAccessToken: refresh}));
vi.mock("@/shared/config", () => ({config: {apiUrl: "/api", authenticationUrl: "/auth"}}));

import {axiosInstance, setNavigateCallback} from "./axios";

const originalAdapter = axiosInstance.defaults.adapter;
const navigate = vi.fn<(path: string) => void>();

function unauthorized(config: InternalAxiosRequestConfig) {
    return new AxiosError("Unauthorized", "ERR_BAD_REQUEST", config, {}, {
        status: 401,
        statusText: "Unauthorized",
        headers: {},
        config,
        data: {},
    });
}

function success(config: InternalAxiosRequestConfig) {
    return {status: 200, statusText: "OK", headers: {}, config, data: {books: []}};
}

beforeEach(() => {
    refresh.mockReset();
    navigate.mockReset();
    setNavigateCallback(navigate);
    vi.stubGlobal("sessionStorage", {removeItem: vi.fn()});
});

afterEach(() => {
    axiosInstance.defaults.adapter = originalAdapter;
    setNavigateCallback(null);
});

describe("library request error handling", () => {
    it("preserves offline errors that have no HTTP response", async () => {
        const networkError = new AxiosError("Network Error", "ERR_NETWORK");
        axiosInstance.defaults.adapter = async () => {throw networkError;};

        await expect(axiosInstance.get("/books")).rejects.toBe(networkError);
        expect(refresh).not.toHaveBeenCalled();
        expect(navigate).not.toHaveBeenCalled();
    });

    it("preserves cancellation and non-Axios errors", async () => {
        const cancelled = new axios.CanceledError("Request cancelled");
        axiosInstance.defaults.adapter = async () => {throw cancelled;};
        await expect(axiosInstance.get("/books")).rejects.toBe(cancelled);

        const unexpected = new Error("Adapter failed");
        axiosInstance.defaults.adapter = async () => {throw unexpected;};
        await expect(axiosInstance.get("/books")).rejects.toBe(unexpected);
        expect(refresh).not.toHaveBeenCalled();
    });

    it("does not retry an authentication error with no original request", async () => {
        const error = unauthorized({headers: new axios.AxiosHeaders()});
        error.config = undefined;
        axiosInstance.defaults.adapter = async () => {throw error;};
        await expect(axiosInstance.get("/books")).rejects.toBe(error);
        expect(refresh).not.toHaveBeenCalled();
    });

    it("refreshes an expired session and retries the request once", async () => {
        refresh.mockResolvedValue({status: 200});
        const adapter = vi.fn<AxiosAdapter>()
            .mockImplementationOnce(async config => {throw unauthorized(config);})
            .mockImplementationOnce(async config => success(config));
        axiosInstance.defaults.adapter = adapter;

        await expect(axiosInstance.get("/books")).resolves.toMatchObject({data: {books: []}});
        expect(refresh).toHaveBeenCalledTimes(1);
        expect(adapter).toHaveBeenCalledTimes(2);
        expect(navigate).not.toHaveBeenCalled();
    });

    it("shares a refresh between simultaneous expired requests", async () => {
        let finishRefresh!: () => void;
        const pendingRefresh = new Promise<void>(resolve => {finishRefresh = resolve;});
        refresh.mockReturnValue(pendingRefresh);
        const attempted = new Set<string>();
        axiosInstance.defaults.adapter = async config => {
            if (!attempted.has(config.url!)) {
                attempted.add(config.url!);
                throw unauthorized(config);
            }
            return success(config);
        };

        const requests = Promise.all([axiosInstance.get("/books"), axiosInstance.get("/authors")]);
        try {
            await vi.waitFor(() => {
                expect(attempted.size).toBe(2);
                expect(refresh).toHaveBeenCalled();
            });
            expect(refresh).toHaveBeenCalledTimes(1);
        } finally {
            finishRefresh();
        }
        await requests;
    });

    it("redirects after a rejected refresh without retrying the protected request", async () => {
        const expired = unauthorized({headers: new axios.AxiosHeaders()});
        refresh.mockRejectedValue(expired);
        const adapter = vi.fn<AxiosAdapter>(async config => {throw unauthorized(config);});
        axiosInstance.defaults.adapter = adapter;

        await expect(axiosInstance.get("/books")).rejects.toBe(expired);
        expect(adapter).toHaveBeenCalledTimes(1);
        expect(navigate).toHaveBeenCalledWith("/login");
        expect(sessionStorage.removeItem).toHaveBeenCalledWith("user_id");
        expect(sessionStorage.removeItem).toHaveBeenCalledWith("user_role");
    });

    it("keeps the session when refreshing fails because of a network outage", async () => {
        const offline = new AxiosError("Network Error", "ERR_NETWORK");
        refresh.mockRejectedValue(offline);
        const adapter = vi.fn<AxiosAdapter>(async config => {throw unauthorized(config);});
        axiosInstance.defaults.adapter = adapter;

        await expect(axiosInstance.get("/books")).rejects.toBe(offline);
        expect(adapter).toHaveBeenCalledTimes(1);
        expect(navigate).not.toHaveBeenCalled();
        expect(sessionStorage.removeItem).not.toHaveBeenCalled();
    });

    it("stops retrying if a refreshed request is still unauthorized", async () => {
        refresh.mockResolvedValue({status: 200});
        const adapter = vi.fn<AxiosAdapter>(async config => {throw unauthorized(config);});
        axiosInstance.defaults.adapter = adapter;

        await expect(axiosInstance.get("/books")).rejects.toMatchObject({response: {status: 401}});
        expect(adapter).toHaveBeenCalledTimes(2);
        expect(refresh).toHaveBeenCalledTimes(1);
        expect(navigate).toHaveBeenCalledWith("/login");
    });
});
