
import { useState, useEffect, useRef } from "react";
import { notFound } from "next/navigation";

export type ErrorResult = {
  error: string;
  httpStatus?: number;
}

export function navigateInPage(params: Record<string, string | string[]> | URLSearchParams) {
    if (params instanceof URLSearchParams) {
        window.history.pushState(null, "", `?${params.toString()}`);
    } else {
        const init = Object.entries(params).flatMap(([key, value]) => (Array.isArray(value) ? value.map(v => [key, v]) : [[key, value]]));
        const searchParams = new URLSearchParams(init);
        window.history.pushState(null, "", `?${searchParams.toString()}`);
    }
}

export function usePromiseData<T, D>(promiseGenerator: () => Promise<T>, defaultValue: D): [T | D, ErrorResult | null] {
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<ErrorResult | null>(null)
  const ref = useRef<() => Promise<T> | null>(null);

  useEffect(() => {
    ref.current = promiseGenerator;
    const fetchData = async () => {
      try {
        const result = await promiseGenerator();
        if (ref.current === promiseGenerator) {
          setData(result);
        }
      } catch (e) {
        if (ref.current === promiseGenerator) {
          setError({
            error: `${e}`,
            httpStatus: e instanceof FetchError ? e.httpStatus : undefined
          });
        }
      }
      
    }
    fetchData();
    return () => {
      ref.current = null;
    };
  }, [setData, promiseGenerator]);

  return [
    data === undefined ? defaultValue : data,
    error
  ];
}

class FetchError extends Error {
  private _httpStatus?: number;

  constructor(msg: string, httpStatus?: number) {
    super(msg)
    this._httpStatus = httpStatus;
  }

  get httpStatus() {
    return this._httpStatus;
  }
}

export async function fetchData<T>(url: string): Promise<T> {
  const response = await fetch(url);
  let errorText: string | null = null;
  if (response.ok) {
    return await response.json() as T
  } else {
    try {
      const errorData = await response.json() as ErrorResult;
      errorText = errorData.error;
      throw new FetchError(
        `${errorData.error}: (${response.status}, ${response.statusText}): ${url}`,
        response.status
      );
    } catch {}
  }
  const baseError = `(${response.status}, ${response.statusText}): ${url}`
  const error = errorText ? `${errorText}: ${baseError}` : baseError;
  throw new FetchError(error, response.status);
}


export function requiredOrNotFound(error: ErrorResult | null) {
  if (error && error.httpStatus === 404) {
    notFound()
  }
}
