import {createContext, useContext} from "react";

export type Config = {
    apiRoot: string;
}

export const ConfigContext = createContext<Config>({
    apiRoot: "http://localhost:5000/api",
})

export const useConfig = () => {
    return useContext(ConfigContext);
}
