#!/usr/bin/env python3
"""
curl_cffi Fetch Script - Chrome TLS Fingerprint Spoofing

Ez a script Chrome böngészőnek álcázza magát TLS szinten,
de NEM futtat böngészőt → minimális CPU használat.

Használat:
    python3 curl_cffi_fetch.py <url>

Output (JSON stdout-ra):
    {
        "success": true,
        "html": "<!DOCTYPE html>...",
        "status_code": 200,
        "headers": {...},
        "cookies": [...],
        "final_url": "https://...",
        "method": "curl_cffi",
        "elapsed_ms": 234
    }

Hiba esetén:
    {
        "success": false,
        "error": "Error message",
        "needs_browser": true/false
    }
"""

import sys
import json
import time

def fetch_with_curl_cffi(url: str) -> dict:
    """
    Fetch URL using curl_cffi with Chrome TLS fingerprint
    """
    start_time = time.time()

    try:
        from curl_cffi import requests
    except ImportError:
        return {
            "success": False,
            "error": "curl_cffi not installed. Run: pip install curl_cffi",
            "needs_browser": True
        }

    try:
        # Chrome 120 TLS fingerprint impersonation
        response = requests.get(
            url,
            impersonate="chrome120",
            timeout=15,
            allow_redirects=True,
            headers={
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
                "Accept-Encoding": "gzip, deflate, br",
                "Cache-Control": "no-cache",
                "Pragma": "no-cache",
                "Sec-Ch-Ua": '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
                "Sec-Ch-Ua-Mobile": "?0",
                "Sec-Ch-Ua-Platform": '"Windows"',
                "Sec-Fetch-Dest": "document",
                "Sec-Fetch-Mode": "navigate",
                "Sec-Fetch-Site": "none",
                "Sec-Fetch-User": "?1",
                "Upgrade-Insecure-Requests": "1",
            }
        )

        elapsed_ms = int((time.time() - start_time) * 1000)
        html = response.text

        # Cloudflare challenge detection
        cloudflare_indicators = [
            "Just a moment...",
            "Checking your browser",
            "cf-browser-verification",
            "cloudflare-static/rocket-loader",
            "_cf_chl_opt",
            "challenge-platform",
            "Attention Required! | Cloudflare",
        ]

        # JavaScript required detection
        js_required_indicators = [
            "Please enable JavaScript",
            "JavaScript is required",
            "This site requires JavaScript",
            "You need to enable JavaScript",
            "<noscript>",
            "browser does not support JavaScript",
        ]

        needs_browser = False
        detection_reason = None

        # Check for Cloudflare challenge
        for indicator in cloudflare_indicators:
            if indicator.lower() in html.lower():
                needs_browser = True
                detection_reason = f"Cloudflare challenge detected: {indicator}"
                break

        # Check for JavaScript required
        if not needs_browser:
            for indicator in js_required_indicators:
                if indicator.lower() in html.lower():
                    needs_browser = True
                    detection_reason = f"JavaScript required: {indicator}"
                    break

        # Check for empty/minimal HTML (SPA)
        if not needs_browser:
            # Remove whitespace and check length
            clean_html = html.strip()
            if len(clean_html) < 500:
                needs_browser = True
                detection_reason = f"Minimal HTML ({len(clean_html)} chars) - likely SPA"
            # Check for empty body
            elif "<body></body>" in clean_html.replace(" ", "").replace("\n", ""):
                needs_browser = True
                detection_reason = "Empty body tag - likely SPA"
            # Check for root div only (React/Vue/Angular)
            elif '<div id="root"></div>' in clean_html or '<div id="app"></div>' in clean_html:
                if clean_html.count("<div") < 5:  # Very few divs
                    needs_browser = True
                    detection_reason = "SPA root div detected with minimal content"

        # Extract cookies
        cookies = []
        for cookie in response.cookies.jar:
            cookies.append({
                "name": cookie.name,
                "value": cookie.value,
                "domain": cookie.domain,
                "path": cookie.path,
                "secure": cookie.secure,
                "httpOnly": "httponly" in str(cookie._rest).lower() if hasattr(cookie, '_rest') else False,
            })

        # Convert headers to dict
        headers_dict = dict(response.headers)

        return {
            "success": True,
            "html": html,
            "status_code": response.status_code,
            "headers": headers_dict,
            "cookies": cookies,
            "final_url": str(response.url),
            "method": "curl_cffi",
            "elapsed_ms": elapsed_ms,
            "needs_browser": needs_browser,
            "detection_reason": detection_reason,
            "html_length": len(html),
        }

    except Exception as e:
        elapsed_ms = int((time.time() - start_time) * 1000)
        error_msg = str(e)

        # Determine if browser might help
        needs_browser = True
        if "timeout" in error_msg.lower():
            needs_browser = True
        elif "ssl" in error_msg.lower():
            needs_browser = True
        elif "connection" in error_msg.lower():
            needs_browser = False  # Connection error, browser won't help

        return {
            "success": False,
            "error": error_msg,
            "needs_browser": needs_browser,
            "elapsed_ms": elapsed_ms,
        }


def main():
    if len(sys.argv) != 2:
        print(json.dumps({
            "success": False,
            "error": "Usage: python3 curl_cffi_fetch.py <url>",
            "needs_browser": False
        }))
        sys.exit(1)

    url = sys.argv[1]

    # Ensure URL has protocol
    if not url.startswith("http://") and not url.startswith("https://"):
        url = f"https://{url}"

    result = fetch_with_curl_cffi(url)

    # Output JSON to stdout
    print(json.dumps(result, ensure_ascii=False))

    # Exit code based on success
    sys.exit(0 if result["success"] and not result.get("needs_browser") else 1)


if __name__ == "__main__":
    main()
