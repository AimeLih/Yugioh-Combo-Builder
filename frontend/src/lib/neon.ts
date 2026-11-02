import { createAuthClient } from '@neondatabase/neon-js/auth';
import { BetterAuthReactAdapter } from '@neondatabase/neon-js/auth/react/adapters';

export const neon = {
    auth: createAuthClient(import.meta.env.VITE_NEON_AUTH_URL, {
        adapter: BetterAuthReactAdapter(),
    }),
};
