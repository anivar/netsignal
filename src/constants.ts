/**
 * NetSignal Constants
 */

/**
 * Default probe URLs for connectivity checks
 * These are reliable, fast endpoints designed for connectivity testing
 */
export const DEFAULT_PROBE_URLS = {
  // Google's connectivity check endpoint - returns 204 No Content
  primary: 'https://www.google.com/generate_204',

  // Cloudflare DNS - very fast, global presence
  secondary: 'https://1.1.1.1/dns-query',

  // Alternative options
  alternatives: [
    'https://www.gstatic.com/generate_204', // Google Static
    'https://connectivitycheck.gstatic.com/generate_204', // Android connectivity check
    'https://clients3.google.com/generate_204', // Chrome connectivity check
    'https://cloudflare.com/cdn-cgi/trace', // Cloudflare trace
  ],
};

/**
 * Default timeout values (in milliseconds)
 */
export const TIMEOUTS = {
  probe: 5000, // Default probe timeout
  probeMin: 1, // Minimum allowed timeout
  probeMax: 60000, // Maximum allowed timeout
  retryDelay: 1000, // Default delay between retries
};

/**
 * Network quality thresholds (in milliseconds)
 */
export const QUALITY_THRESHOLDS = {
  excellent: 50,
  good: 150,
  fair: 300,
  // poor: anything above fair
};
