#!/usr/bin/env php
<?php
/**
 * Fast Scanner - PHP curl-based HTML fetcher
 *
 * Usage: php scanner.php https://example.com
 * Output: JSON with {html, headers, status, timing, etc}
 *
 * Features:
 * - 10-50x faster than Playwright
 * - No JS execution (static HTML only)
 * - Comprehensive header extraction
 * - SSL/TLS analysis
 * - Network timing data
 * - Works identically with TypeScript analyzers
 */

// Disable output buffering for real-time output
ob_implicit_flush(true);

// Error handling
error_reporting(E_ALL);
ini_set('display_errors', 'stderr');

// Validate arguments
if ($argc < 2) {
    fwrite(STDERR, "Usage: php scanner.php <url>\n");
    exit(1);
}

$url = $argv[1];

// Validate URL
if (!filter_var($url, FILTER_VALIDATE_URL)) {
    fwrite(STDERR, "Error: Invalid URL format\n");
    exit(1);
}

// Start timing
$startTime = microtime(true);

// Initialize result structure
$result = [
    'success' => false,
    'url' => $url,
    'timestamp' => date('c'),
    'timing' => [],
    'html' => '',
    'headers' => [],
    'cookies' => [],
    'status' => 0,
    'finalUrl' => $url,
    'redirectChain' => [],
    'ssl' => [],
    'error' => null
];

try {
    // Initialize curl
    $ch = curl_init();

    // Response storage
    $responseHeaders = [];
    $responseBody = '';
    $redirectChain = [];

    // Header callback to capture all headers
    curl_setopt($ch, CURLOPT_HEADERFUNCTION, function($curl, $header) use (&$responseHeaders) {
        $len = strlen($header);
        $header = explode(':', $header, 2);

        if (count($header) < 2) {
            return $len;
        }

        $name = strtolower(trim($header[0]));
        $value = trim($header[1]);

        $responseHeaders[$name] = $value;

        return $len;
    });

    // Browser-like headers (to avoid bot detection)
    $browserHeaders = [
    "sec-ch-ua": "\"Chromium\";v=\"131\", \"Not_A Brand\";v=\"24\", \"Google Chrome\";v=\"131\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "Upgrade-Insecure-Requests": "1",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-User": "?1",
    "Sec-Fetch-Dest": "document",
    "Accept-Encoding": "gzip, deflate, br, zstd", 
    "Accept-Language": "en-US,en;q=0.9",
    "Priority": "u=0, i",
    "Connection": "keep-alive",
    ];

    // Curl options for comprehensive scanning
    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_MAXREDIRS => 5,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_SSL_VERIFYPEER => false,  // Don't fail on SSL errors (we want to analyze them)
        CURLOPT_SSL_VERIFYHOST => false,
        CURLOPT_CERTINFO => true,          // Get SSL certificate info
        CURLOPT_VERBOSE => false,
        CURLOPT_ENCODING => '',            // Accept all encodings
        CURLOPT_HTTPHEADER => $browserHeaders,  // Use browser-like headers
        CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
    ]);

    // Execute request
    $responseBody = curl_exec($ch);

    // Check for errors
    if (curl_errno($ch)) {
        throw new Exception('Curl error: ' . curl_error($ch));
    }

    // Extract timing information
    $result['timing'] = [
        'namelookup' => curl_getinfo($ch, CURLINFO_NAMELOOKUP_TIME) * 1000,
        'connect' => curl_getinfo($ch, CURLINFO_CONNECT_TIME) * 1000,
        'appconnect' => curl_getinfo($ch, CURLINFO_APPCONNECT_TIME) * 1000,
        'pretransfer' => curl_getinfo($ch, CURLINFO_PRETRANSFER_TIME) * 1000,
        'starttransfer' => curl_getinfo($ch, CURLINFO_STARTTRANSFER_TIME) * 1000,
        'total' => curl_getinfo($ch, CURLINFO_TOTAL_TIME) * 1000,
        'redirect' => curl_getinfo($ch, CURLINFO_REDIRECT_TIME) * 1000,
    ];

    // Extract response data
    $result['status'] = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $result['finalUrl'] = curl_getinfo($ch, CURLINFO_EFFECTIVE_URL);
    $result['headers'] = $responseHeaders;
    $result['html'] = $responseBody;

    // Extract SSL/TLS information
    $certInfo = curl_getinfo($ch, CURLINFO_CERTINFO);
    if (!empty($certInfo)) {
        $result['ssl']['certInfo'] = $certInfo;
    }

    // SSL version
    $result['ssl']['version'] = curl_getinfo($ch, CURLINFO_SSL_VERIFYRESULT);

    // Redirect information
    $redirectCount = curl_getinfo($ch, CURLINFO_REDIRECT_COUNT);
    if ($redirectCount > 0) {
        $result['redirectChain'] = [
            'count' => $redirectCount,
            'time' => $result['timing']['redirect']
        ];
    }

    // Extract cookies from Set-Cookie headers
    if (isset($responseHeaders['set-cookie'])) {
        $result['cookies'] = parseCookies($responseHeaders['set-cookie']);
    }

    // Success
    $result['success'] = true;

    curl_close($ch);

} catch (Exception $e) {
    $result['error'] = $e->getMessage();
    $result['success'] = false;
}

// Calculate total duration
$endTime = microtime(true);
$result['duration'] = round(($endTime - $startTime) * 1000, 2); // milliseconds

// Output JSON result
echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

// Helper function to parse cookies
function parseCookies($setCookieHeader) {
    $cookies = [];

    if (!is_array($setCookieHeader)) {
        $setCookieHeader = [$setCookieHeader];
    }

    foreach ($setCookieHeader as $cookie) {
        $parts = explode(';', $cookie);
        $nameValue = explode('=', array_shift($parts), 2);

        if (count($nameValue) === 2) {
            $cookieData = [
                'name' => trim($nameValue[0]),
                'value' => trim($nameValue[1]),
            ];

            // Parse cookie attributes
            foreach ($parts as $part) {
                $part = trim($part);
                if (stripos($part, 'secure') === 0) {
                    $cookieData['secure'] = true;
                } elseif (stripos($part, 'httponly') === 0) {
                    $cookieData['httpOnly'] = true;
                } elseif (stripos($part, 'samesite') === 0) {
                    $cookieData['sameSite'] = explode('=', $part)[1] ?? 'Lax';
                } elseif (stripos($part, 'domain') === 0) {
                    $cookieData['domain'] = explode('=', $part)[1] ?? '';
                } elseif (stripos($part, 'path') === 0) {
                    $cookieData['path'] = explode('=', $part)[1] ?? '/';
                } elseif (stripos($part, 'max-age') === 0) {
                    $cookieData['maxAge'] = intval(explode('=', $part)[1] ?? 0);
                } elseif (stripos($part, 'expires') === 0) {
                    $cookieData['expires'] = explode('=', $part)[1] ?? '';
                }
            }

            $cookies[] = $cookieData;
        }
    }

    return $cookies;
}

exit($result['success'] ? 0 : 1);
