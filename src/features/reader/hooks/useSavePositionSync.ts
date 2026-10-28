import {useCallback, useEffect, useMemo, useRef} from "react";
import type {RefObject} from "react";
import {savePosition} from "../api/savedPositionApi";
import ToastFactory from "@/shared/lib/toast/toast";
import type {BookFormatType} from "@/entities/book/model/bookFormats";
import type {Locator} from "@readium/shared";
import {saveLocatorLocal} from "@/features/reader/utils/savedPositionState";
import {serializeLocatorForCloud} from "@/features/reader/utils/locatorUtils";
import {createPositionSaveScheduler} from "../utils/positionSaveScheduler";

function getCurrentUserId(): string | null {
    if (typeof window === "undefined") return null;
    try {
        return window.sessionStorage.getItem("user_id");
    } catch {
        return null;
    }
}

export function useSavePositionSync(bookId: string, format: BookFormatType, deviceName: string, resourceBaseRef?: RefObject<string | undefined>) {
    const failedRef = useRef(false);

    const reportSyncFailure = useCallback(() => {
        if (!failedRef.current) {
            failedRef.current = true;
            ToastFactory({message: "Unable to sync position. Reading offline.", type: "warning"});
        }
    }, []);

    const scheduler = useMemo(() => {
        const userId = getCurrentUserId();
        return createPositionSaveScheduler(async (request) => {
            await savePosition(bookId, request);
            if (failedRef.current) {
                failedRef.current = false;
                ToastFactory({message: "Position sync restored", type: "success"});
            }
        }, reportSyncFailure, () => !!userId && getCurrentUserId() === userId);
    }, [bookId, format, reportSyncFailure]);

    useEffect(() => {
        return () => {
            // Preserve the latest update when navigating within the app. This
            // does not guarantee delivery when the browser closes the tab.
            void scheduler.flush().catch(reportSyncFailure);
        };
    }, [scheduler, reportSyncFailure]);

    const onLocationChange = useCallback(
        (locator: Locator, percentage?: number) => {
            saveLocatorLocal(bookId, locator);
            const cloudSerialized = serializeLocatorForCloud(locator, resourceBaseRef?.current);
            scheduler.schedule({position: cloudSerialized, deviceName, percentage});
        },
        [bookId, deviceName, scheduler, resourceBaseRef],
    );

    const saveImmediate = useCallback(
        async (locator: Locator, percentage?: number) => {
            saveLocatorLocal(bookId, locator);
            const cloudSerialized = serializeLocatorForCloud(locator, resourceBaseRef?.current);
            await scheduler.saveImmediately({position: cloudSerialized, deviceName, percentage});
        },
        [bookId, deviceName, scheduler, resourceBaseRef],
    );

    return {onLocationChange, saveImmediate};
}
