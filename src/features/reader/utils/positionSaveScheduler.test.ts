import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import type {SavePositionRequest} from "../types/SavedPosition";
import {createPositionSaveScheduler} from "./positionSaveScheduler";

const position = (page: number): SavePositionRequest => ({
    position: JSON.stringify({page}),
    deviceName: "Test reader",
    percentage: page / 100,
});

describe("reading position saves", () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => {
        vi.clearAllTimers();
        vi.useRealTimers();
    });

    it("debounces rapid page turns and saves the latest position", async () => {
        const save = vi.fn().mockResolvedValue(undefined);
        const scheduler = createPositionSaveScheduler(save, vi.fn());

        scheduler.schedule(position(10));
        await vi.advanceTimersByTimeAsync(700);
        scheduler.schedule(position(11));
        await vi.advanceTimersByTimeAsync(700);
        expect(save).not.toHaveBeenCalled();

        await vi.advanceTimersByTimeAsync(300);
        expect(save).toHaveBeenCalledExactlyOnceWith(position(11));
    });

    it("does not let a pending older position overwrite an immediate save", async () => {
        const save = vi.fn().mockResolvedValue(undefined);
        const scheduler = createPositionSaveScheduler(save, vi.fn());

        scheduler.schedule(position(10));
        await vi.advanceTimersByTimeAsync(500);
        await scheduler.saveImmediately(position(25));
        await vi.advanceTimersByTimeAsync(1000);

        expect(save).toHaveBeenCalledExactlyOnceWith(position(25));
    });

    it("flushes the latest pending position on in-app exit without a later duplicate", async () => {
        const save = vi.fn().mockResolvedValue(undefined);
        const scheduler = createPositionSaveScheduler(save, vi.fn());

        scheduler.schedule(position(10));
        await vi.advanceTimersByTimeAsync(100);
        scheduler.schedule(position(11));
        await scheduler.flush();
        await scheduler.flush();
        await vi.advanceTimersByTimeAsync(1000);

        expect(save).toHaveBeenCalledExactlyOnceWith(position(11));
    });

    it("waits for an in-flight older write before sending a newer immediate position", async () => {
        let finishFirst!: () => void;
        const firstWrite = new Promise<void>((resolve) => { finishFirst = resolve; });
        const save = vi.fn()
            .mockReturnValueOnce(firstWrite)
            .mockResolvedValue(undefined);
        const scheduler = createPositionSaveScheduler(save, vi.fn());

        scheduler.schedule(position(10));
        await vi.advanceTimersByTimeAsync(1000);
        const immediate = scheduler.saveImmediately(position(25));
        await Promise.resolve();
        expect(save).toHaveBeenCalledExactlyOnceWith(position(10));

        finishFirst();
        await immediate;
        expect(save.mock.calls).toEqual([[position(10)], [position(25)]]);
    });

    it("handles a background sync failure and continues saving later positions", async () => {
        const error = new Error("Offline");
        const save = vi.fn()
            .mockRejectedValueOnce(error)
            .mockResolvedValue(undefined);
        const onError = vi.fn();
        const scheduler = createPositionSaveScheduler(save, onError);

        scheduler.schedule(position(10));
        await vi.advanceTimersByTimeAsync(1000);
        expect(onError).toHaveBeenCalledExactlyOnceWith(error);

        scheduler.schedule(position(11));
        await vi.advanceTimersByTimeAsync(1000);
        expect(save.mock.calls).toEqual([[position(10)], [position(11)]]);
        expect(onError).toHaveBeenCalledTimes(1);
    });

    it("returns immediate-save errors to the caller without blocking subsequent saves", async () => {
        const error = new Error("Offline");
        const save = vi.fn()
            .mockRejectedValueOnce(error)
            .mockResolvedValue(undefined);
        const scheduler = createPositionSaveScheduler(save, vi.fn());

        await expect(scheduler.saveImmediately(position(10))).rejects.toBe(error);
        await scheduler.saveImmediately(position(11));

        expect(save.mock.calls).toEqual([[position(10)], [position(11)]]);
    });

    it.each([null, "reader-b"])("discards a debounced save when the session becomes %s", async (nextUserId) => {
        let currentUserId: string | null = "reader-a";
        const initialUserId = currentUserId;
        const save = vi.fn().mockResolvedValue(undefined);
        const onError = vi.fn();
        const scheduler = createPositionSaveScheduler(
            save,
            onError,
            () => currentUserId === initialUserId,
        );

        scheduler.schedule(position(10));
        await vi.advanceTimersByTimeAsync(500);
        currentUserId = nextUserId;
        await vi.advanceTimersByTimeAsync(500);

        expect(save).not.toHaveBeenCalled();
        expect(onError).not.toHaveBeenCalled();
    });

    it.each(["immediate", "flush"] as const)("rechecks the account before a queued %s save dispatches", async (method) => {
        let currentUserId = "reader-a";
        const initialUserId = currentUserId;
        let finishFirst!: () => void;
        const firstWrite = new Promise<void>((resolve) => { finishFirst = resolve; });
        const save = vi.fn()
            .mockReturnValueOnce(firstWrite)
            .mockResolvedValue(undefined);
        const scheduler = createPositionSaveScheduler(
            save,
            vi.fn(),
            () => currentUserId === initialUserId,
        );

        scheduler.schedule(position(10));
        await vi.advanceTimersByTimeAsync(1000);
        scheduler.schedule(position(25));
        const nextWrite = method === "immediate"
            ? scheduler.saveImmediately(position(25))
            : scheduler.flush();

        currentUserId = "reader-b";
        finishFirst();
        await nextWrite;
        await vi.advanceTimersByTimeAsync(1000);

        expect(save).toHaveBeenCalledExactlyOnceWith(position(10));
    });
});
