import { createAuthClient } from '@neon/auth';
import { BetterAuthReactAdapter } from '@neon/auth/react/adapters';

const authBaseUrl = import.meta.env.VITE_NEON_AUTH_URL;

if (!authBaseUrl) {
    throw new Error('VITE_NEON_AUTH_URL is required to initialize Neon Auth.');
}

// @ts-ignore
export const neon = {
    auth: createAuthClient(authBaseUrl, {
        adapter: BetterAuthReactAdapter({
            fetchOptions: {
                onRequest: request => console.info('[neon-auth-request]', request.method, request.url),
                onResponse: context => console.info(
                    '[neon-auth-response]',
                    context.response.status,
                    context.response.url,
                ),
            },
        }),
    }),
};
