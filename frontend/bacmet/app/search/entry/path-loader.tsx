import { usePathname } from "next/navigation";
import React from "react"

const PathLoaderContext = React.createContext<RegExpMatchArray | null>(null);

export function usePathLoader() {
    return React.useContext(PathLoaderContext);
}

export default function PathLoader({children, match}: {match: RegExp, children: React.ReactNode}) {
  const pathname = usePathname();
  const matchResult = pathname.match(match);

  return (
    <PathLoaderContext.Provider value={matchResult}>
        {children}
    </PathLoaderContext.Provider>
  )
}
