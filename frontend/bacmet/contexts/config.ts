import {createContext, useContext} from "react";

export type Config = {
    apiRoot: string;
}

export const ConfigContext = createContext<Config>({
    apiRoot: "/api",
})

export const useConfig = () => {
    return useContext(ConfigContext);
}
