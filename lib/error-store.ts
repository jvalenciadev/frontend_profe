type BackendError = {
    success: false;
    statusCode: number;
    timestamp: string;
    path: string;
    method: string;
    message: string;
    errorCode: string;
    details?: any;
};

type ErrorStore = {
    error: BackendError | null;
    setError: (error: BackendError | null) => void;
};

let currentError: BackendError | null = null;
let listeners: Array<(error: BackendError | null) => void> = [];

export const errorStore = {
    setError: (error: BackendError | null) => {
        currentError = error;
        listeners.forEach(listener => listener(error));
    },
    subscribe: (listener: (error: BackendError | null) => void) => {
        listeners.push(listener);
        return () => {
            listeners = listeners.filter(l => l !== listener);
        };
    },
    getError: () => currentError
};
