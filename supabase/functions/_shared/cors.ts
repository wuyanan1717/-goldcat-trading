// Shared CORS Configuration
// Restrict access to specific domains only

const ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://goldcat.trade',
    'https://www.goldcat.trade',
];

export const getCorsHeaders = (requestOrigin: string | null) => {
    const origin = requestOrigin && ALLOWED_ORIGINS.includes(requestOrigin)
        ? requestOrigin
        : ALLOWED_ORIGINS[0];

    return {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Credentials': 'true',
    };
};

export const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
