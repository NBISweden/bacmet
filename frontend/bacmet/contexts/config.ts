import {createContext, useContext} from "react";

export type Config = {
    apiFetch<T>(path: string, args?: {[x: string]: string | string[]}): Promise<T>;
}

export const ConfigContext = createContext<Config>({
    async apiFetch(path: string, args: Record<string, string> = {}) {
        const apiRoot = (
            typeof window !== undefined 
            ? `${window.location.protocol}//${window.location.hostname}:5000/api`
            : "/api"
        );
        const params = new URLSearchParams(args);
        const url = new URL(`${apiRoot}${path}`);
        url.search = (new URLSearchParams(args)).toString();
        return await (await fetch(url.toString())).json();
    }
})

export const useConfig = () => {
    return useContext(ConfigContext);
}
