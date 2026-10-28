export type UiRole = "USER" | "ADMIN";

/** Reads a UI hint only; the backend must verify tokens and enforce permissions. */
export function getUiRoleFromAccessToken(accessToken: unknown): UiRole {
    if (typeof accessToken !== "string") return "USER";

    const parts = accessToken.split(".");
    if (parts.length !== 3 || !parts[1]) return "USER";

    try {
        const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
        const bytes = Uint8Array.from(atob(padded), character => character.charCodeAt(0));
        const payload: unknown = JSON.parse(new TextDecoder("utf-8", {fatal: true}).decode(bytes));

        if (typeof payload === "object" && payload !== null && "role" in payload && payload.role === "ADMIN") {
            return "ADMIN";
        }
    } catch {
        // Missing or malformed claims must never grant an administrative UI role.
    }

    return "USER";
}
