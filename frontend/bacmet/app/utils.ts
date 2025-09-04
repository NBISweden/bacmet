export function navigateInPage(params: Record<string, string | string[]> | URLSearchParams) {
    if (params instanceof URLSearchParams) {
        window.history.pushState(null, "", `?${params.toString()}`);
    } else {
        const init = Object.entries(params).flatMap(([key, value]) => (Array.isArray(value) ? value.map(v => [key, v]) : [[key, value]]));
        const searchParams = new URLSearchParams(init);
        window.history.pushState(null, "", `?${searchParams.toString()}`);
    }
}
