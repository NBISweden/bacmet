
import { useState, useEffect, useRef } from "react";

export function navigateInPage(params: Record<string, string | string[]> | URLSearchParams) {
    if (params instanceof URLSearchParams) {
        window.history.pushState(null, "", `?${params.toString()}`);
    } else {
        const init = Object.entries(params).flatMap(([key, value]) => (Array.isArray(value) ? value.map(v => [key, v]) : [[key, value]]));
        const searchParams = new URLSearchParams(init);
        window.history.pushState(null, "", `?${searchParams.toString()}`);
    }
}

export function usePromiseData<T, D>(promiseGenerator: () => Promise<T>, defaultValue: D): T | D {
  const [data, setData] = useState<T | null>(null);
  const ref = useRef<() => Promise<T> | null>(null);

  useEffect(() => {
    ref.current = promiseGenerator;
    const fetchData = async () => {
      const result = await promiseGenerator();
      if (ref.current === promiseGenerator) {
        setData(result);
      }
    }
    fetchData();
    return () => {
      ref.current = null;
    };
  }, [setData, promiseGenerator]);

  return data || defaultValue;
}

export async function fetchData<T>(url: string): Promise<T> {
  const response = await fetch(url);
  return await response.json() as T
}
