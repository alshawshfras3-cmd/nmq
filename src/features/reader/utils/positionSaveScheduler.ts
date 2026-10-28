import type {SavePositionRequest} from "../types/SavedPosition";

/** Debounces one reader's updates and keeps its cloud writes in order. */
export function createPositionSaveScheduler(
    save: (request: SavePositionRequest) => Promise<void>,
    onError: (error: unknown) => void,
    canSave: () => boolean = () => true,
) {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let pending: SavePositionRequest | undefined;
    let queue = Promise.resolve();

    function clearTimer() {
        if (timer !== undefined) {
            clearTimeout(timer);
            timer = undefined;
        }
    }

    function enqueue(request: SavePositionRequest): Promise<void> {
        const operation = queue.then(() => {
            // Recheck at dispatch, including after an earlier request settles.
            // Pending work must never follow a different signed-in account.
            if (canSave()) return save(request);
        });
        // A failed request must not block newer reading positions.
        queue = operation.catch(() => {});
        return operation;
    }

    function flush(): Promise<void> {
        clearTimer();
        const request = pending;
        pending = undefined;
        return request ? enqueue(request) : queue;
    }

    function schedule(request: SavePositionRequest) {
        pending = request;
        clearTimer();
        timer = setTimeout(() => {
            void flush().catch(onError);
        }, 1000);
    }

    function saveImmediately(request: SavePositionRequest): Promise<void> {
        clearTimer();
        pending = undefined;
        return enqueue(request);
    }

    return {schedule, saveImmediately, flush};
}
