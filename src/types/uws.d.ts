declare module 'uWebSockets.js' {
    export interface WebSocket {
        send(message: string | ArrayBuffer | Buffer): void;
        close(): void;
        on(event: string, callback: (...args: any[]) => void): void;
    }

    export interface AppOptions {
        key_file_name?: string;
        cert_file_name?: string;
        passphrase?: string;
    }

    export interface ListenOptions {
        port: number;
        host?: string;
    }

    export interface TemplatedApp {
        ws(pattern: string, behavior: {
            upgrade?: (res: any, req: any, context: any) => void;
            open?: (ws: WebSocket) => void;
            message?: (ws: WebSocket, message: ArrayBuffer, isBinary: boolean) => void;
            close?: (ws: WebSocket, code: number, message: ArrayBuffer) => void;
        }): TemplatedApp;
        any(pattern: string, handler: (res: any, req: any) => void): TemplatedApp;
        listen(port: number, cb: (listenSocket: any) => void): void;
        listen(host: string, port: number, cb: (listenSocket: any) => void): void;
        listen(options: ListenOptions, cb: (listenSocket: any) => void): void;
    }

    export function App(options?: AppOptions): TemplatedApp;
    export function SSLApp(options?: AppOptions): TemplatedApp;
}
