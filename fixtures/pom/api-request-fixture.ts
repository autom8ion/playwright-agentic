import { test as base } from './page-object-fixture';

export type ApiRequestOptions = {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    url: string;
    data?: unknown;
    headers?: Record<string, string>;
    token?: string;
};

export type ApiResponse<T> = {
    status: number;
    body: T;
};

export type ApiRequestFn = <T>(options: ApiRequestOptions) => Promise<ApiResponse<T>>;

export type ApiRequestFixtures = {
    apiRequest: ApiRequestFn;
};

export const test = base.extend<ApiRequestFixtures>({
    apiRequest: async ({ request }, use) => {
        const fn: ApiRequestFn = async (options) => {
            const response = await request.fetch(options.url, {
                method: options.method,
                data: options.data,
                headers: {
                    ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
                    ...options.headers,
                },
            });
            const status = response.status();
            const body = status === 204 ? (undefined as never) : await response.json();
            return { status, body };
        };
        await use(fn);
    },
});
