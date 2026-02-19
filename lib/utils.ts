/**
 * Dynamically determines the application's base URL.
 * Handles Vercel deployment URLs, explicit environment variables, and local development.
 */
export const getURL = () => {
    let url =
        process?.env?.NEXT_PUBLIC_APP_URL ?? // Custom env var
        process?.env?.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set by Vercel
        'http://localhost:3000/';

    // Make sure to include `https://` when not localhost.
    url = url.includes('http') ? url : `https://${url}`;

    // Make sure to include a trailing `/`.
    url = url.charAt(url.length - 1) === '/' ? url : `${url}/`;

    return url;
};
