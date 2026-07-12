import {toaster} from "@/shared/ui/toaster";

export interface ToastFactoryParams {
    message: string;
    type: "success" | "info" | "warning" | "error";
}

export default function ToastFactory({message, type}: ToastFactoryParams) {
    const title = message.trim() || "Something went wrong";

    switch (type) {
        case "success":
            toaster.success({title});
            break;
        case "warning":
            toaster.warning({title});
            break;
        case "error":
            toaster.error({title});
            break;
        case "info":
            toaster.info({title});
            break;
    }
}
