import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Knowledge Base Seed Data
 * Professional E-E-A-T content for all finding types
 * ~200 words per explanation for SEO and user education
 */

const knowledgeBaseFindings = [
  // ========================================
  // SECURITY HEADERS
  // ========================================
  {
    findingKey: 'missing-content-security-policy',
    category: 'security',
    severity: 'high',
    title: 'Missing Content Security Policy (CSP)',
    explanation: `Content Security Policy (CSP) is a critical security header that acts as an additional layer of protection against Cross-Site Scripting (XSS), clickjacking, and other code injection attacks. It works by allowing website owners to specify which sources of content browsers should consider valid. Without CSP, your website is vulnerable to attackers injecting malicious scripts that can steal user data, hijack sessions, or deface your site. Modern web applications, especially those handling sensitive data or implementing AI features, should always implement CSP as part of their defense-in-depth strategy.`,
    impact: `Without CSP, attackers can inject and execute malicious JavaScript on your pages, potentially stealing user credentials, session tokens, or sensitive AI prompts and responses. This is particularly dangerous for AI-powered websites where user inputs and AI outputs might contain confidential information. XSS attacks can lead to account takeovers, data theft, malware distribution, and complete compromise of user trust. For businesses, this translates to regulatory fines under GDPR, reputational damage, and potential legal liability. The absence of CSP is often flagged in security audits and can affect compliance certifications.`,
    solution: `Implement a Content Security Policy header in your web server configuration. Start with a restrictive policy that only allows resources from trusted sources. For example: "Content-Security-Policy: default-src 'self'; script-src 'self' https://trusted-cdn.com; style-src 'self' 'unsafe-inline'". Avoid using 'unsafe-inline' and 'unsafe-eval' when possible. For AI applications, ensure that API endpoints and WebSocket connections are explicitly whitelisted. Test your CSP using browser developer tools and CSP evaluators. Deploy CSP in report-only mode first to identify issues, then enforce it. Use nonces or hashes for inline scripts if absolutely necessary. Regularly review and update your policy as your application evolves.`,
    technicalDetails: `CSP works through HTTP response headers or meta tags. Level 3 CSP supports advanced features like 'strict-dynamic', 'nonce-{random}', and 'hash-{algorithm}'. Monitor CSP violations using report-uri or report-to directives to detect attack attempts.`,
    references: JSON.stringify([
      'https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP',
      'https://content-security-policy.com/',
      'https://csp-evaluator.withgoogle.com/'
    ]),
    seoKeywords: 'CSP, Content Security Policy, XSS protection, web security headers, injection attacks'
  },

  {
    findingKey: 'missing-strict-transport-security',
    category: 'security',
    severity: 'high',
    title: 'Missing Strict-Transport-Security (HSTS)',
    explanation: `HTTP Strict Transport Security (HSTS) is a web security policy mechanism that forces browsers to interact with websites exclusively over HTTPS, never HTTP. When a site sends the HSTS header, browsers remember this instruction and automatically upgrade all future requests to HTTPS, even if users type "http://" in the address bar. This prevents man-in-the-middle attacks, protocol downgrade attacks, and cookie hijacking. HSTS is essential for maintaining the integrity and confidentiality of data transmitted between users and your server, particularly critical for AI applications that may handle sensitive prompts, API keys, or personal information.`,
    impact: `Without HSTS, users are vulnerable to SSL stripping attacks where attackers intercept the initial HTTP request and prevent the upgrade to HTTPS. This allows them to eavesdrop on "secure" communications, steal session cookies, inject malicious code, or modify responses. For AI-powered websites, this means attackers could intercept API keys, steal proprietary prompts, or manipulate AI responses before they reach users. Even if your site redirects HTTP to HTTPS, there's a vulnerable window during the initial connection. This exposure can lead to credential theft, session hijacking, and compliance violations under regulations like PCI DSS and GDPR which mandate encryption for sensitive data.`,
    solution: `Add the Strict-Transport-Security header to all HTTPS responses: "Strict-Transport-Security: max-age=31536000; includeSubDomains; preload". The max-age directive (one year minimum recommended) tells browsers how long to remember the HSTS policy. includeSubDomains applies the policy to all subdomains. The preload directive allows you to submit your domain to the HSTS preload list, ensuring browsers enforce HTTPS from the very first visit. Before enabling preload, ensure all subdomains support HTTPS. Use tools like hstspreload.org to validate your implementation. Monitor certificate expiration dates to prevent HSTS-related outages. For production environments, start with a shorter max-age (e.g., 86400 seconds) to test, then increase to one year.`,
    technicalDetails: `HSTS only works over HTTPS. The browser caches the policy based on max-age. Removing HSTS requires waiting for max-age expiration or clearing browser data. HSTS preload lists are hardcoded into browsers.`,
    references: JSON.stringify([
      'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security',
      'https://hstspreload.org/',
      'https://www.chromium.org/hsts/'
    ]),
    seoKeywords: 'HSTS, Strict Transport Security, HTTPS enforcement, SSL stripping, man-in-the-middle protection'
  },

  {
    findingKey: 'missing-x-frame-options',
    category: 'security',
    severity: 'medium',
    title: 'Missing X-Frame-Options Header',
    explanation: `The X-Frame-Options HTTP header protects your website from clickjacking attacks by controlling whether your pages can be embedded in frames, iframes, or objects on other domains. Clickjacking tricks users into clicking on something different from what they perceive, potentially leading to unintended actions like fund transfers, changing privacy settings, or authorizing malicious applications. For AI-powered websites, clickjacking could trick users into submitting sensitive prompts to attacker-controlled interfaces or authorizing access to AI services. This header is a simple but effective defense mechanism that should be implemented on all pages containing sensitive functionality or user interactions.`,
    impact: `Without X-Frame-Options, attackers can embed your website in invisible iframes overlaid on malicious pages. Users think they're interacting with the attacker's site but are actually clicking buttons on your legitimate site. This can lead to unauthorized purchases, privilege escalation, OAuth token theft, or sensitive data disclosure. In AI applications, attackers could capture user prompts, API responses, or session tokens. Clickjacking bypasses CSRF protections and can affect even security-conscious users. The vulnerability is particularly dangerous for administrative interfaces, payment forms, and AI chatbots where user interactions have immediate consequences. Regulatory frameworks like GDPR consider clickjacking a security breach that must be prevented.`,
    solution: `Set the X-Frame-Options header to "DENY" to prevent all framing, or "SAMEORIGIN" to allow framing only by pages on the same domain: "X-Frame-Options: DENY" or "X-Frame-Options: SAMEORIGIN". For modern browsers, also implement Content Security Policy's frame-ancestors directive: "Content-Security-Policy: frame-ancestors 'none'" (equivalent to DENY) or "frame-ancestors 'self'" (equivalent to SAMEORIGIN). CSP's frame-ancestors is more flexible and supersedes X-Frame-Options in modern browsers. If you need to allow framing from specific domains, use frame-ancestors with explicit origins. Test your implementation by attempting to iframe your site from external domains. For AI embeddings or widgets that legitimately need framing, use CORS and explicit origin whitelisting instead of allowing all framing.`,
    technicalDetails: `X-Frame-Options is supported by all modern browsers. The ALLOW-FROM directive is obsolete. Use CSP frame-ancestors for granular control. Conflicting headers (X-Frame-Options and CSP) may cause browsers to use the more restrictive policy.`,
    references: JSON.stringify([
      'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options',
      'https://owasp.org/www-community/attacks/Clickjacking',
      'https://cheatsheetseries.owasp.org/cheatsheets/Clickjacking_Defense_Cheat_Sheet.html'
    ]),
    seoKeywords: 'X-Frame-Options, clickjacking protection, iframe security, frame embedding, UI redressing attacks'
  },

  {
    findingKey: 'missing-x-content-type-options',
    category: 'security',
    severity: 'low',
    title: 'Missing X-Content-Type-Options Header',
    explanation: `The X-Content-Type-Options header prevents browsers from MIME-sniffing responses away from the declared content-type. MIME-sniffing is when browsers try to guess the content type of a response by examining its contents, potentially overriding the server's declared Content-Type header. While this feature was designed to improve user experience, it creates security vulnerabilities when browsers incorrectly interpret files as executable content. For example, an image file containing malicious code could be interpreted and executed as JavaScript. This header should be set to "nosniff" on all responses to ensure browsers respect your declared content types and don't attempt potentially dangerous content-type detection.`,
    impact: `Without X-Content-Type-Options: nosniff, attackers can exploit MIME-sniffing to execute malicious scripts disguised as harmless file types. A classic attack vector involves uploading a file that appears to be an image but contains JavaScript code. Without proper content-type enforcement, browsers might execute this code, leading to XSS vulnerabilities. For AI applications that handle user uploads or generate dynamic content, this could allow attackers to inject malicious code through file uploads, PDFs, or SVGs. The impact includes unauthorized script execution, data theft, session hijacking, and potential compromise of other users. While lower severity than missing CSP, this header is part of defense-in-depth and is required by many security compliance frameworks.`,
    solution: `Add the X-Content-Type-Options header with the "nosniff" value to all HTTP responses: "X-Content-Type-Options: nosniff". This is a simple one-line addition to your web server configuration that provides immediate protection. For Nginx: add_header X-Content-Type-Options "nosniff"; For Apache: Header always set X-Content-Type-Options "nosniff". Ensure your server sends correct Content-Type headers for all resources. Test with developer tools to verify headers are present. This header is particularly important for pages serving user-uploaded content, API responses, and downloadable files. Combined with a proper Content Security Policy, this provides robust protection against content-type confusion attacks. No maintenance is required once implemented.`,
    technicalDetails: `The only valid value is "nosniff". This header affects script and style resources. Browsers will block requests if the MIME type doesn't match expectations. Particularly important for defending against polyglot files.`,
    references: JSON.stringify([
      'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options',
      'https://scotthelme.co.uk/hardening-your-http-response-headers/#x-content-type-options',
      'https://owasp.org/www-project-secure-headers/'
    ]),
    seoKeywords: 'X-Content-Type-Options, MIME sniffing, content type security, nosniff header, browser security'
  },

  // ========================================
  // SSL/TLS FINDINGS
  // ========================================
  {
    findingKey: 'no-https-encryption',
    category: 'ssl',
    severity: 'critical',
    title: 'No HTTPS Encryption',
    explanation: `HTTPS (HTTP Secure) is the foundation of secure communication on the internet, encrypting all data transmitted between users' browsers and your web server using TLS/SSL protocols. Without HTTPS, all data - including passwords, API keys, personal information, and AI prompts - travels across the internet in plain text, visible to anyone who can intercept the traffic. In 2025, HTTPS is not optional; it's a fundamental requirement for any website. Search engines penalize HTTP sites, browsers display prominent "Not Secure" warnings, and users have learned to distrust non-HTTPS websites. For AI applications, the stakes are even higher as conversations often contain confidential business information, personal data, or proprietary queries that absolutely must be encrypted.`,
    impact: `Operating without HTTPS exposes your users to catastrophic security risks. Attackers on the same network (coffee shop WiFi, public hotspots, compromised routers) can intercept all traffic, stealing passwords, session cookies, and sensitive data. For AI-powered sites, this means attackers can capture API keys (leading to unauthorized usage and massive bills), steal proprietary prompts (intellectual property theft), manipulate AI responses before they reach users, or inject malicious code into your pages. Man-in-the-middle attacks are trivial on HTTP. Beyond security, running HTTP damages your reputation, reduces search engine rankings, triggers browser warnings that scare users away, and violates regulations like GDPR and PCI DSS. Modern browsers are blocking features like geolocation, camera access, and service workers on HTTP sites. This is a critical vulnerability that must be addressed immediately.`,
    solution: `Obtain and install an SSL/TLS certificate immediately. Use Let's Encrypt for free, automatically-renewed certificates, or purchase certificates from trusted Certificate Authorities for commercial sites requiring extended validation. Configure your web server (Nginx, Apache, IIS) to serve content over HTTPS on port 443. Redirect all HTTP traffic to HTTPS using 301 redirects. Implement HSTS headers to force HTTPS for future visits. Update all internal links to use HTTPS URLs. Ensure API endpoints, WebSockets, and third-party resources also use HTTPS to avoid mixed content warnings. Test your SSL configuration using tools like SSL Labs Server Test. For production environments, use automated certificate renewal (Certbot for Let's Encrypt). Modern hosting providers like Vercel, Netlify, and Cloudflare offer automatic HTTPS setup. There's no legitimate reason to run HTTP-only websites in 2025. The process takes minutes and the security benefits are immeasurable.`,
    technicalDetails: `TLS 1.2 is minimum recommended; TLS 1.3 is preferred for performance. Disable SSLv3 and TLS 1.0/1.1. Use strong cipher suites. Certificate transparency logs are monitored by browsers. HTTPS is required for HTTP/2 and HTTP/3.`,
    references: JSON.stringify([
      'https://letsencrypt.org/',
      'https://www.ssllabs.com/ssltest/',
      'https://https.cio.gov/everything/'
    ]),
    seoKeywords: 'HTTPS, SSL certificate, TLS encryption, secure connection, website security, encrypted traffic'
  },

  {
    findingKey: 'ssl-certificate-expired',
    category: 'ssl',
    severity: 'critical',
    title: 'SSL Certificate Expired',
    explanation: `An expired SSL certificate is a critical security issue that immediately renders your HTTPS encryption ineffective. SSL certificates have expiration dates (typically 90 days for Let's Encrypt, 1-2 years for commercial CAs) as a security measure to ensure cryptographic keys are regularly rotated and certificate ownership is revalidated. When a certificate expires, browsers display alarming security warnings that prevent most users from accessing your site. The warning messages ("Your connection is not private") are intentionally frightening because an expired certificate means the encryption protecting user data cannot be verified as trustworthy. For businesses, an expired certificate is equivalent to hanging a "CLOSED" sign - users will leave, and many won't return even after you fix it.`,
    impact: `An expired SSL certificate has severe immediate consequences. Modern browsers (Chrome, Firefox, Safari) display full-page warnings that most users cannot or will not bypass. This results in a complete loss of traffic - studies show 95%+ of users abandon sites with certificate warnings. Search engines may flag or de-rank your site. Any users who do bypass the warning are using an unverified connection that could be compromised. For AI services, expired certificates mean API calls fail, integrations break, and revenue stops. The reputational damage is severe - users question your technical competence and commitment to security. Automated systems and security tools flag expired certificates, potentially triggering compliance violations. The business impact includes lost revenue, damaged trust, support ticket floods, and potential regulatory fines. This is a security emergency requiring immediate attention.`,
    solution: `Renew your SSL certificate immediately. If using Let's Encrypt, run Certbot with the renew command: "certbot renew". For commercial certificates, purchase and install a new certificate from your CA. Most modern hosting platforms (Vercel, Cloudflare, AWS) offer automatic certificate management that prevents expiration. Implement automated certificate renewal to prevent future expirations - set up Certbot cron jobs or use cloud provider auto-renewal features. Configure monitoring alerts to notify you 30 and 7 days before expiration. After renewal, clear browser caches and test from multiple devices to ensure the new certificate is served correctly. Document certificate renewal procedures in your runbooks. Consider moving to Let's Encrypt with auto-renewal for zero-maintenance certificate management. The typical renewal process takes 5-10 minutes but should be automated. Never let certificates expire - set up multiple redundant renewal alerts.`,
    technicalDetails: `Certificate expiration is checked by browsers on every connection. Renewal should happen 30 days before expiration. OCSP stapling can improve performance. Certificate Transparency logs track all issued certificates. Modern CAs support automatic renewal APIs.`,
    references: JSON.stringify([
      'https://letsencrypt.org/docs/expiration-emails/',
      'https://certbot.eff.org/',
      'https://crt.sh/'
    ]),
    seoKeywords: 'expired SSL certificate, certificate renewal, HTTPS warning, SSL expiration, certificate monitoring'
  },

  {
    findingKey: 'ssl-certificate-expiring-soon',
    category: 'ssl',
    severity: 'high',
    title: 'SSL Certificate Expiring Soon',
    explanation: `Your SSL certificate is approaching its expiration date (within 30 days), requiring immediate attention to prevent service disruption. SSL certificates are issued with finite validity periods as a security best practice - shorter validity periods mean compromised certificates have less time to be exploited, and regular renewal ensures certificate holders maintain control of their domains. The trend in the industry is toward shorter certificate lifespans (Let's Encrypt uses 90 days, and there's movement toward 45-day certificates). This finding indicates you're in the danger zone where certificate expiration could disrupt your service if renewal is delayed. While not yet critical, this warning should be treated with urgency to prevent the catastrophic consequences of an expired certificate.`,
    impact: `A soon-to-expire certificate poses significant risk of service disruption. If renewal is forgotten or encounters problems (DNS issues, CA downtime, configuration errors), your certificate will expire and users will be locked out of your site. The business impact of even a few hours of downtime can be severe - lost revenue, customer frustration, reputational damage, and broken integrations. For AI services, expired certificates mean API failures, webhook delivery failures, and service interruptions that cascade to your customers. The risk increases during holidays, weekends, or when key technical staff are unavailable. Additionally, security audits and compliance scans flag certificates expiring within 30 days as a process failure. Proactive certificate management is a basic indicator of operational maturity. Letting certificates get this close to expiration suggests gaps in your monitoring and automation infrastructure.`,
    solution: `Renew your SSL certificate immediately - don't wait until the last minute. For Let's Encrypt, run "certbot renew --force-renewal" to get a fresh 90-day certificate. For commercial CAs, initiate the renewal process through your provider's control panel. After renewal, verify the new certificate is correctly installed and served to users. Implement automated certificate renewal to prevent this situation in the future. Set up monitoring with alerts at 60, 30, and 7 days before expiration using tools like SSL Labs Monitoring, UptimeRobot, or cloud provider monitoring services. For production environments, maintain a certificate inventory and renewal calendar. Consider migrating to Let's Encrypt with Certbot auto-renewal for zero-touch certificate management. Test your renewal process quarterly to ensure it works. Document emergency renewal procedures for out-of-hours situations. The goal is to never see this warning again because renewal happens automatically months before expiration.`,
    technicalDetails: `Most browsers cache certificate data. OCSP responses indicate certificate validity. Certificate renewal can happen any time before expiration. Best practice is to renew at 2/3 of certificate lifetime (60 days for 90-day certs).`,
    references: JSON.stringify([
      'https://letsencrypt.org/docs/faq/',
      'https://www.ssllabs.com/ssltest/',
      'https://crontab.guru/'
    ]),
    seoKeywords: 'SSL certificate renewal, certificate expiration warning, automatic renewal, certificate monitoring, SSL maintenance'
  },

  {
    findingKey: 'ssl-certificate-renewal-recommended',
    category: 'ssl',
    severity: 'medium',
    title: 'SSL Certificate Renewal Recommended',
    explanation: `Your SSL certificate is valid but entering the renewal window (within 90 days of expiration), making this an optimal time to renew. While not urgent, proactive renewal is a security and operations best practice that prevents last-minute scrambles and potential service disruptions. Certificate renewal at this stage gives you ample time to address any issues that might arise during the renewal process, test the new certificate thoroughly, and implement automation to prevent future manual renewals. Many organizations use the 90-day mark as a trigger for routine maintenance tasks related to certificates, including reviewing certificate inventory, updating documentation, and validating monitoring systems.`,
    impact: `While not immediately critical, delaying certificate renewal creates unnecessary risk. As the expiration date approaches, the pressure increases and the margin for error decreases. If renewal is postponed, you enter the "expiring soon" danger zone where any technical issues, personnel unavailability, or process delays could result in certificate expiration and service outage. For businesses, operating with aging certificates suggests reactive rather than proactive security management. Compliance auditors and security scans may flag certificates in their final 90 days as a process concern. The operational impact of last-minute renewals includes rushed work, increased stress, and potential for configuration errors. Additionally, staying current with certificates ensures you benefit from the latest cryptographic standards and security features. This is a low-stress opportunity to maintain good security hygiene.`,
    solution: `Plan and execute certificate renewal during this low-pressure window. Review your certificate renewal process and documentation. If using Let's Encrypt, verify Certbot auto-renewal is functioning correctly by running "certbot renew --dry-run". For commercial certificates, initiate renewal through your CA's portal. Consider this an opportunity to implement or improve automation - set up auto-renewal if you haven't already, configure comprehensive monitoring with alerts at 90, 60, 30, and 7 days before expiration, and document the renewal process for team members. Test the renewal process in a staging environment if possible. Update your certificate inventory and set calendar reminders for next renewal cycle. For production systems, consider implementing zero-downtime certificate rotation. This renewal window is also a good time to evaluate your certificate strategy - are you using the most cost-effective provider? Is your automation robust? Are all stakeholders aware of certificate management procedures? Use this opportunity to mature your certificate management practices.`,
    technicalDetails: `Certificates can be renewed any time before expiration. Let's Encrypt allows renewal within 30 days of expiration while maintaining remaining validity. Certificate chain changes should be tested. Renewal doesn't require service downtime if properly automated.`,
    references: JSON.stringify([
      'https://letsencrypt.org/docs/integration-guide/',
      'https://certbot.eff.org/docs/using.html',
      'https://wiki.mozilla.org/Security/Server_Side_TLS'
    ]),
    seoKeywords: 'SSL renewal planning, certificate lifecycle management, proactive security, certificate automation, SSL best practices'
  },

  {
    findingKey: 'self-signed-ssl-certificate',
    category: 'ssl',
    severity: 'high',
    title: 'Self-Signed SSL Certificate',
    explanation: `A self-signed SSL certificate is one that hasn't been verified and signed by a trusted Certificate Authority (CA). While it provides encryption, browsers don't trust it by default because there's no third-party validation of your domain ownership or identity. Self-signed certificates are appropriate for development, testing, and internal networks, but should never be used in production environments accessible to external users. The fundamental problem is the lack of trust chain - browsers can't verify that the certificate actually belongs to your domain, making it impossible for users to distinguish between your legitimate self-signed certificate and an attacker's fraudulent certificate. In 2025, with free automated certificates available from Let's Encrypt, there's no justification for using self-signed certificates on public-facing websites.`,
    impact: `Self-signed certificates trigger severe browser warnings that are deliberately designed to scare users away. Modern browsers display full-page interstitials warning users that "Your connection is not private" and actively prevent access to the site (requiring multiple clicks to bypass). This creates a terrible user experience - most users will abandon your site, and those who do bypass the warning are being trained to ignore critical security warnings. For businesses, self-signed certificates are professionally embarrassing and damage credibility. Search engines may flag your site, API clients will reject connections by default, and third-party integrations may fail. From a security perspective, self-signed certificates provide encryption but no authentication, leaving users vulnerable to man-in-the-middle attacks where attackers can substitute their own self-signed certificates. Compliance frameworks explicitly prohibit self-signed certificates for systems handling sensitive data. The reputational and practical impacts make this unacceptable for production use.`,
    solution: `Replace the self-signed certificate immediately with a certificate from a trusted Certificate Authority. Use Let's Encrypt for free, automatically-renewed certificates - the entire process takes less than 10 minutes using Certbot. If you require extended validation or warranty, purchase a commercial certificate from providers like DigiCert, Sectigo, or GlobalSign. For internal services, consider setting up an internal CA infrastructure or using certificates from your cloud provider. Never ask users to manually trust self-signed certificates - this trains them to ignore security warnings. Update your deployment documentation to include certificate provisioning. For development and testing, use localhost certificates or development domains with valid certificates. Modern hosting platforms (Vercel, Netlify, Cloudflare) provide automatic certificate management. There's literally no reason to use self-signed certificates for public-facing services in 2025. The migration takes minutes and immediately improves security, trust, and user experience.`,
    technicalDetails: `Self-signed certificates create their own trust chain. Browsers maintain lists of trusted root CAs. Certificate pinning can mitigate some risks but isn't a substitute for proper CA-signed certificates. Internal CAs require deploying root certificates to all clients.`,
    references: JSON.stringify([
      'https://letsencrypt.org/getting-started/',
      'https://www.cloudflare.com/learning/ssl/what-is-ssl/',
      'https://www.thesslstore.com/blog/self-signed-certificate/'
    ]),
    seoKeywords: 'self-signed certificate, untrusted SSL, certificate authority, browser warnings, SSL trust, Let\'s Encrypt'
  },

  // ========================================
  // CLIENT-SIDE RISKS
  // ========================================
  {
    findingKey: 'exposed-api-key',
    category: 'client',
    severity: 'critical',
    title: 'API Key Exposed in Client Code',
    explanation: `An API key has been detected in your client-side JavaScript code, representing one of the most critical security vulnerabilities in modern web applications. API keys are meant to be secret credentials that authenticate your application to third-party services. When embedded in client-side code, these keys become publicly accessible to anyone who views your website's source code or network traffic. This is equivalent to leaving your house keys under the doormat with a sign pointing to them. For AI services like OpenAI, Anthropic, or Google AI, exposed API keys grant attackers complete access to your account, allowing unlimited usage of expensive AI services at your cost. This vulnerability is extremely common - developers often expose keys during rapid development or testing and forget to move them server-side before deployment.`,
    impact: `Exposed API keys create catastrophic financial and security consequences. Attackers who discover your keys can immediately begin consuming your AI service quotas, potentially running up bills of thousands or millions of dollars within hours. AI API abuse is a thriving underground market where stolen keys are sold or used for cryptocurrency mining, spam generation, or other malicious purposes. Beyond financial damage, exposed keys can lead to data breaches if they provide access to databases or user information, account compromise if they have administrative privileges, and reputational damage when customers discover your poor security practices. For AI services specifically, attackers can access your chat histories, fine-tuned models, or custom prompts, resulting in intellectual property theft. Compliance violations under regulations like GDPR, PCI DSS, and SOC 2 are certain. Many companies have gone bankrupt due to exposed API keys resulting in six-figure surprise bills from cloud providers. This is a security emergency.`,
    solution: `Immediately revoke and rotate the exposed API key through your service provider's dashboard. Never put API keys, passwords, or secrets in client-side code - this is a fundamental security principle. Move all API calls to server-side endpoints that securely store credentials in environment variables or secrets management systems (AWS Secrets Manager, HashiCorp Vault, Google Secret Manager). Implement a backend proxy pattern where your frontend makes requests to your server, which then calls the AI service with credentials stored server-side. Use environment variables (.env files) excluded from version control (.gitignore). Scan your entire codebase and git history for other exposed secrets using tools like GitGuardian, TruffleHog, or GitHub's secret scanning. Set up spending alerts on AI service dashboards to detect unauthorized usage. Implement rate limiting and usage monitoring. Review your application's authentication and authorization architecture. For production environments, use secrets managers and never commit credentials to code repositories. This is basic security hygiene that must be addressed immediately to prevent financial catastrophe.`,
    technicalDetails: `API keys in client code are visible in JavaScript source, browser dev tools, and network traffic. Even minified/obfuscated code can be reverse-engineered. Keys in git history remain accessible. Modern secrets management uses environment variables, KMS, and least-privilege access.`,
    references: JSON.stringify([
      'https://owasp.org/www-community/vulnerabilities/Use_of_hard-coded_password',
      'https://github.com/features/security',
      'https://www.gitguardian.com/secrets-detection'
    ]),
    seoKeywords: 'exposed API key, hardcoded credentials, secret exposure, API security, credentials in code, environment variables'
  },

  // ========================================
  // COOKIE SECURITY
  // ========================================
  {
    findingKey: 'cookie-missing-httponly',
    category: 'cookie',
    severity: 'high',
    title: 'Cookie Missing HttpOnly Flag',
    explanation: `The HttpOnly flag is a critical security attribute for cookies that prevents client-side scripts from accessing cookie data. When a cookie lacks the HttpOnly flag, JavaScript code running on your page (including malicious scripts injected through XSS attacks) can read, modify, or steal the cookie's value. For session cookies or authentication tokens, this is a severe security vulnerability because attackers can use XSS to steal user sessions and impersonate users. HttpOnly is a simple but powerful defense mechanism that should be enabled on all cookies containing sensitive data. This is especially important for session cookies, authentication tokens, and any cookies used for security decisions. The flag has no impact on legitimate server-side cookie usage while significantly reducing the attack surface against XSS.`,
    impact: `Cookies without HttpOnly flags are vulnerable to theft through Cross-Site Scripting (XSS) attacks. If an attacker can inject JavaScript into your page (through stored XSS, reflected XSS, or DOM-based XSS), they can use document.cookie to read all non-HttpOnly cookies and send them to attacker-controlled servers. For session cookies, this enables complete account takeover - attackers can hijack authenticated sessions without needing passwords. They can then access user data, perform unauthorized actions, modify account settings, or escalate privileges. For AI applications, stolen session cookies might grant access to conversation histories, API keys, or premium features. The vulnerability persists as long as XSS exists anywhere in your application. Even if you've fixed all known XSS vulnerabilities, defense-in-depth principles require HttpOnly flags as a secondary protection layer. This finding indicates a fundamental security configuration error affecting user privacy and account security.`,
    solution: `Add the HttpOnly flag to all cookies containing sensitive data, especially session cookies and authentication tokens. When setting cookies, include the HttpOnly attribute: "Set-Cookie: sessionId=abc123; HttpOnly; Secure; SameSite=Strict". For Express.js: res.cookie('name', 'value', { httpOnly: true, secure: true, sameSite: 'strict' }). For other frameworks, consult documentation for cookie configuration. Review all cookie usage in your application and classify cookies by sensitivity - authentication/session cookies absolutely require HttpOnly. The flag doesn't affect cookies that legitimately need JavaScript access (like UI preferences), but those should never contain sensitive data. Implement a security headers policy that sets HttpOnly by default. Test with browser developer tools to verify flags are set correctly. Combine HttpOnly with Secure (HTTPS-only) and SameSite (CSRF protection) flags for comprehensive cookie security. This is a straightforward configuration change with no impact on functionality but significant security benefits.`,
    technicalDetails: `HttpOnly cookies are sent in HTTP requests but inaccessible to JavaScript. document.cookie won't return HttpOnly cookies. The flag is supported by all modern browsers. No performance impact. Can be set in server responses or web server configuration.`,
    references: JSON.stringify([
      'https://owasp.org/www-community/HttpOnly',
      'https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies',
      'https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html'
    ]),
    seoKeywords: 'HttpOnly flag, cookie security, XSS protection, session hijacking, secure cookies, cookie attributes'
  },

  {
    findingKey: 'cookie-missing-secure',
    category: 'cookie',
    severity: 'high',
    title: 'Cookie Missing Secure Flag',
    explanation: `The Secure flag is a cookie attribute that ensures cookies are only transmitted over encrypted HTTPS connections, never over unencrypted HTTP. Without the Secure flag, cookies can be transmitted in plain text when users access your site via HTTP (even if you normally use HTTPS), making them vulnerable to interception by network attackers. This is particularly dangerous for session cookies, authentication tokens, and any cookies containing sensitive data. On networks with weak security (public WiFi, compromised routers, or corporate networks with SSL inspection), attackers can easily capture cookies sent over HTTP. The Secure flag provides a simple guarantee that cookies will never be exposed through unencrypted transmission, complementing HTTPS and HSTS to ensure end-to-end encryption of all authentication credentials and session data.`,
    impact: `Cookies without the Secure flag are vulnerable to interception whenever HTTP connections occur. Even if your site uses HTTPS, users accessing via HTTP (typing http:// manually, following old bookmarks, or being downgraded by network attacks) will send cookies in plain text. Man-in-the-middle attackers on the same network can capture these cookies using tools like Wireshark or Ettercap. Stolen session cookies enable immediate account takeover - attackers can replay the cookies to impersonate users without needing credentials. For AI applications, this could expose API keys, conversation tokens, or subscription credentials. The vulnerability is particularly dangerous on public WiFi networks, hotels, airports, and coffee shops where network eavesdropping is trivial. Beyond direct attacks, regulatory compliance frameworks (PCI DSS, HIPAA, GDPR) require Secure flags on cookies handling sensitive data. Failure to implement basic cookie security demonstrates negligence in protecting user privacy and can result in fines, lawsuits, and reputational damage.`,
    solution: `Add the Secure flag to all cookies, especially those containing authentication or session data: "Set-Cookie: sessionId=abc123; Secure; HttpOnly; SameSite=Strict". Ensure your site exclusively uses HTTPS (redirect all HTTP to HTTPS) before enabling Secure flags, as Secure cookies won't be sent over HTTP connections, potentially breaking functionality if HTTP is still in use. In Express.js: res.cookie('name', 'value', { secure: true, httpOnly: true, sameSite: 'strict' }). For production environments, set Secure as the default for all cookies. Implement HSTS to force HTTPS and prevent protocol downgrades. Review cookie policies and ensure Secure flags are part of your standard configuration. Test from both HTTPS and HTTP contexts to verify cookies behave correctly. Combine with HttpOnly (prevents JavaScript access) and SameSite (prevents CSRF) for comprehensive cookie security. For development environments using HTTP, use conditional logic to set Secure only in production. This is a critical security control that should be implemented immediately.`,
    technicalDetails: `Secure cookies are only sent over HTTPS. Browsers will not send Secure cookies over HTTP connections. Works with HSTS to enforce encrypted transmission. No impact on functionality when site is fully HTTPS. Supported by all modern browsers since 1990s.`,
    references: JSON.stringify([
      'https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies#restrict_access_to_cookies',
      'https://owasp.org/www-community/controls/SecureCookieAttribute',
      'https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html#secure-attribute'
    ]),
    seoKeywords: 'Secure cookie flag, HTTPS cookies, cookie encryption, session security, network interception, WiFi security'
  },

  // ========================================
  // AI-SPECIFIC FINDINGS
  // ========================================
  // COOKIE SECURITY - ADDITIONAL
  // ========================================
  {
    findingKey: 'cookie-missing-samesite',
    category: 'cookie',
    severity: 'medium',
    title: 'Cookie Missing SameSite Attribute',
    explanation: `The SameSite cookie attribute is a powerful security mechanism that controls whether cookies are sent with cross-site requests, providing robust protection against Cross-Site Request Forgery (CSRF) attacks. When a cookie lacks the SameSite attribute, browsers apply default behavior that may not provide adequate protection against cross-origin attacks. SameSite has three values: "Strict" (cookie never sent on cross-site requests), "Lax" (cookie sent only on safe cross-site top-level navigation), and "None" (cookie sent on all requests, requires Secure flag). Modern web applications should explicitly set SameSite on all cookies to maintain control over cross-site cookie behavior rather than relying on browser defaults which have changed over time and vary between browsers.`,
    impact: `Without proper SameSite configuration, your cookies are vulnerable to CSRF attacks where malicious websites trick users' browsers into making unwanted authenticated requests to your site. Attackers can exploit this to perform actions on behalf of users without their knowledge - changing passwords, making purchases, transferring funds, or modifying account settings. For AI applications, CSRF can be used to submit malicious prompts, exhaust API quotas, or manipulate AI-generated content. Session cookies without SameSite protection are particularly dangerous as they can be used to maintain persistent unauthorized access. The lack of SameSite also increases risk from clickjacking and timing attacks. Modern browsers have started applying default SameSite=Lax behavior, but relying on defaults is dangerous as older browsers and certain configurations don't provide this protection. Explicit SameSite configuration is required for compliance with security standards like OWASP and payment industry requirements (PCI DSS).`,
    solution: `Set the SameSite attribute explicitly on all cookies based on their usage. For session cookies and authentication: use SameSite=Strict or SameSite=Lax depending on whether you need cross-site navigation to maintain sessions. For tracking or advertising cookies that require cross-site functionality: use SameSite=None WITH the Secure flag (requires HTTPS). Never use SameSite=None without Secure. Example cookie header: "Set-Cookie: sessionid=abc123; SameSite=Strict; Secure; HttpOnly". For Lax (allows top-level navigation): "Set-Cookie: sessionid=abc123; SameSite=Lax; Secure; HttpOnly". Test your SameSite configuration by attempting cross-site requests from different origins. Review all cookies and classify them by purpose to determine appropriate SameSite values. Update legacy code that creates cookies to include SameSite. Consider that SameSite=Strict may break legitimate cross-site workflows (email links, payment gateways) requiring SameSite=Lax for those scenarios.`,
    technicalDetails: `SameSite=Strict prevents all cross-site cookie transmission. SameSite=Lax allows cookies on top-level navigation (GET requests) but not on embedded requests. SameSite=None requires Secure flag and HTTPS. Browser defaults have evolved: Chrome 80+ defaults to Lax.`,
    references: JSON.stringify([
      'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite',
      'https://web.dev/samesite-cookies-explained/',
      'https://owasp.org/www-community/SameSite'
    ]),
    seoKeywords: 'SameSite cookie, CSRF protection, cross-site request forgery, cookie security, web security'
  },

  // ========================================
  // JAVASCRIPT LIBRARIES
  // ========================================
  {
    findingKey: 'cdn-missing-sri',
    category: 'library',
    severity: 'medium',
    title: 'CDN Scripts Without Subresource Integrity',
    explanation: `Subresource Integrity (SRI) is a security feature that enables browsers to verify that resources fetched from Content Delivery Networks (CDNs) haven't been tampered with. When you load JavaScript libraries from third-party CDNs without SRI, you're trusting that CDN and every intermediary completely. If a CDN gets compromised, attackers can inject malicious code into popular libraries that your website loads, affecting potentially millions of users across thousands of websites. SRI works by providing a cryptographic hash of the expected file content in the script tag. Browsers verify this hash before executing the code, refusing to run scripts that don't match. This protects against CDN compromises, man-in-the-middle attacks, and malicious modifications by untrusted intermediaries. SRI is especially critical for production websites loading popular libraries like jQuery, React, Vue, Bootstrap, or any framework from public CDNs.`,
    impact: `Loading CDN resources without SRI exposes your website to supply chain attacks. If a CDN is compromised (as happened with British Airways in 2018, costing them £183 million), attackers can inject malicious JavaScript that executes with full access to your pages. This can lead to credential theft, payment card skimming, session hijacking, data exfiltration, cryptocurrency mining, or complete website defacement. For AI applications, compromised CDN scripts can intercept AI prompts and responses, steal API keys, or manipulate AI outputs. Even without malicious intent, CDN errors or misconfigurations can serve incorrect versions of libraries, breaking your website. The attack is particularly insidious because it affects all your users simultaneously and requires no direct compromise of your servers. Security audits and compliance frameworks increasingly require SRI for all external resources. Modern security policies like Content Security Policy can enforce SRI usage through the require-sri-for directive.`,
    solution: `Add integrity attributes to all script and link tags loading from CDNs. Example: <script src="https://cdn.example.com/library.js" integrity="sha384-HASH" crossorigin="anonymous"></script>. Generate SRI hashes using online tools (srihash.org) or command line: "openssl dgst -sha384 -binary library.js | openssl base64 -A". Always include the crossorigin="anonymous" attribute when using SRI with CDN resources. Use sha384 or sha512 hashing algorithms (sha256 is acceptable but less secure). If you're using a package manager, generate SRI hashes during build time and inject them into HTML templates. For resources that change frequently, consider self-hosting instead of using CDNs. Implement a CSP policy with require-sri-for directive to enforce SRI usage across your site. Test SRI implementation by attempting to load modified versions of libraries. Document all external resources and their SRI hashes in your security documentation. Update SRI hashes whenever you update library versions.`,
    technicalDetails: `SRI uses cryptographic hashing (sha256/sha384/sha512). Browsers fetch resource, compute hash, compare to integrity attribute. Mismatch = refuse execution. Requires CORS (crossorigin attribute). Supported by all modern browsers.`,
    references: JSON.stringify([
      'https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity',
      'https://www.srihash.org/',
      'https://caniuse.com/subresource-integrity'
    ]),
    seoKeywords: 'Subresource Integrity, SRI, CDN security, supply chain attacks, script integrity, web security'
  },

  {
    findingKey: 'deprecated-library',
    category: 'library',
    severity: 'low',
    title: 'Deprecated JavaScript Library Detected',
    explanation: `Deprecated libraries are software packages that maintainers have officially declared unsupported, with no further security patches, bug fixes, or feature updates planned. Popular examples include Moment.js (use date-fns or Day.js instead), Request.js (use Axios or Fetch), and jQuery UI (use modern frameworks). While deprecated libraries often continue to function, they accumulate known vulnerabilities that will never be patched, increasing security risk over time. Deprecated status typically occurs when better alternatives exist or when maintaining the library becomes unsustainable. Using deprecated libraries signals technical debt and can complicate future development, hiring, and audits. Security researchers actively hunt for vulnerabilities in widely-used deprecated libraries knowing patches will never be released, making these libraries attractive targets. Continuing to use deprecated libraries after warnings have been issued demonstrates poor security posture to auditors and potential customers.`,
    impact: `Deprecated libraries pose mounting security risks as new vulnerabilities are discovered but never patched. Your application becomes increasingly vulnerable to known exploits documented in CVE databases that attackers can easily weaponize. Automated scanning tools flag deprecated dependencies, failing security audits and compliance checks. Technical debt accumulates as deprecated libraries become incompatible with modern development tools, frameworks, and security practices. Hiring becomes harder as developers prefer working with current technologies. Integration with modern services, APIs, and platforms becomes problematic as deprecated libraries lack support for new standards. Over time, upgrading becomes exponentially more difficult as dependency trees grow complex and breaking changes accumulate. While immediate risk may be low, the trajectory is toward increasing vulnerability and eventual crisis when critical security issues force emergency rewrites. Legal and compliance frameworks increasingly require maintaining updated dependencies, making deprecated libraries a regulatory risk.`,
    solution: `Plan migration away from deprecated libraries by identifying modern alternatives recommended by the original maintainers. For Moment.js, migrate to date-fns or Day.js which are actively maintained, smaller, and more performant. Create a phased migration plan starting with new code using modern alternatives while gradually refactoring legacy code. Assess the scope of usage through your codebase using dependency analysis tools. Allocate dedicated engineering time for the migration rather than expecting it to happen opportunistically. Write migration scripts or codemods to automate repetitive refactoring. Maintain comprehensive test coverage to catch regressions during migration. Update documentation and coding standards to prevent new uses of deprecated libraries. Set up automated dependency scanning to alert on deprecated packages. Consider using dependency management tools like Renovate or Dependabot to stay current. If immediate migration is impossible, isolate deprecated libraries behind abstraction layers to minimize exposure and facilitate future replacement. Schedule regular technical debt review sessions.`,
    technicalDetails: `Check library status on npm, GitHub, or official sites. Use npm audit or Snyk to detect deprecated packages. Semantic versioning may continue, but security patches cease. Deprecation ≠ immediate failure, but risk increases over time.`,
    references: JSON.stringify([
      'https://momentjs.com/docs/#/-project-status/',
      'https://www.npmjs.com/package/npm-check-updates',
      'https://github.com/features/security'
    ]),
    seoKeywords: 'deprecated libraries, technical debt, dependency management, library migration, software maintenance'
  },

  {
    findingKey: 'vulnerable-library-version',
    category: 'library',
    severity: 'critical',
    title: 'Vulnerable JavaScript Library Version Detected',
    explanation: `A vulnerable library version means your website is using a specific version of a JavaScript library that has known, documented security vulnerabilities listed in public databases like the Common Vulnerabilities and Exposures (CVE) system. These aren't theoretical risks - they're proven security holes that attackers actively exploit in the wild. Vulnerability scanners and automated attack tools specifically target these known weaknesses, making vulnerable libraries low-hanging fruit for attackers. The vulnerabilities range from Cross-Site Scripting (XSS) and Remote Code Execution (RCE) to prototype pollution and denial of service. Every day a vulnerable library remains in production increases the likelihood of exploitation. Public exploits, proof-of-concept code, and even automated attack scripts are often available for documented CVEs, making exploitation accessible even to low-skilled attackers. Security researchers, bug bounty hunters, and malicious actors continuously scan the internet for sites using vulnerable library versions.`,
    impact: `Using libraries with known vulnerabilities directly exposes your application to documented attack methods. Attackers can exploit these weaknesses to steal user data, hijack sessions, inject malicious content, or completely compromise your server. The specific impact depends on the vulnerability - XSS vulnerabilities allow script injection and credential theft, prototype pollution can lead to authentication bypasses, and RCE vulnerabilities give attackers complete system control. For AI applications, vulnerable libraries can enable prompt injection, API key theft, or manipulation of AI outputs. Beyond direct exploitation, vulnerable dependencies fail security audits, block compliance certifications, and create legal liability when breaches occur. Cyber insurance policies may deny claims if breaches result from unpatched known vulnerabilities. Automated scanning during mergers, acquisitions, or partnerships will flag these issues, potentially blocking business deals. The reputation damage from breaches caused by known, preventable vulnerabilities is severe as it demonstrates negligence.`,
    solution: `Update the vulnerable library to the latest secure version immediately. Use npm update or yarn upgrade to update dependencies. Check the library's changelog and security advisories for breaking changes before updating. Run your test suite after updating to catch regressions. For critical vulnerabilities, treat updates as emergency hotfixes requiring immediate deployment. If updating breaks functionality, allocate engineering time to fix compatibility issues rather than postponing the update. For libraries with no secure version available, find alternative libraries or implement workarounds. Use automated dependency scanning tools like npm audit, Snyk, or GitHub Dependabot to catch vulnerabilities early. Set up automated pull requests for dependency updates. Implement a policy requiring security updates within 7 days of disclosure for critical vulnerabilities, 30 days for high severity. Monitor security mailing lists and vulnerability databases for your dependencies. Maintain an inventory of all third-party libraries used. Consider using Software Composition Analysis (SCA) tools in your CI/CD pipeline to block deployments with known vulnerabilities.`,
    technicalDetails: `CVE identifiers track vulnerabilities (e.g., CVE-2023-1234). CVSS scores rate severity (0-10). National Vulnerability Database (NVD) documents exploits. Automated tools scan package.json/yarn.lock for matches. Zero-day = unknown, but documented CVE = known risk.`,
    references: JSON.stringify([
      'https://nvd.nist.gov/',
      'https://snyk.io/vuln',
      'https://github.com/advisories'
    ]),
    seoKeywords: 'vulnerable libraries, CVE, security vulnerabilities, dependency security, software composition analysis'
  },

  // ========================================
  // SSL/TLS - ADDITIONAL
  // ========================================
  {
    findingKey: 'mixed-content-detected',
    category: 'ssl',
    severity: 'high',
    title: 'Mixed Content Detected',
    explanation: `Mixed content occurs when an HTTPS webpage loads resources (images, scripts, stylesheets, iframes) over unencrypted HTTP connections. This undermines the security of your HTTPS implementation by creating holes in the encryption. When users visit your HTTPS site, they expect all content and communications to be encrypted. Mixed content breaks this promise by allowing portions of the page to be transmitted in plaintext, visible to anyone monitoring network traffic. Modern browsers increasingly block mixed content by default, especially "active" mixed content like scripts and stylesheets that can alter page behavior. "Passive" mixed content like images still loads but triggers security warnings. Mixed content typically results from legacy code, content migration from HTTP to HTTPS, or hardcoded HTTP URLs. It can also occur when embedding third-party content that doesn't support HTTPS.`,
    impact: `Mixed content creates security vulnerabilities in otherwise secure HTTPS pages. Attackers on the network path can intercept and modify HTTP resources, injecting malicious scripts, stealing cookies, or defacing your site. For mixed content scripts, attackers gain full execution capabilities within your HTTPS page, completely compromising the security model. Users see browser warnings indicating "not fully secure" which damages trust and credibility. Conversion rates suffer as security-conscious users abandon transactions. Modern browsers block mixed content scripts entirely, breaking functionality. Search engines penalize sites with mixed content issues. Compliance frameworks like PCI DSS prohibit mixed content on payment pages. For AI applications, mixed content can expose API keys, intercept prompts and responses, or inject malicious code into AI interfaces. The vulnerability is particularly insidious because it creates false sense of security - your site uses HTTPS, but portions remain unencrypted.`,
    solution: `Identify all mixed content resources using browser developer tools (Console tab shows mixed content warnings). Update all resource URLs to use HTTPS instead of HTTP. Use protocol-relative URLs (//example.com/script.js) or HTTPS URLs (https://example.com/script.js). Search codebase for hardcoded HTTP links: grep -r "http://" in your source files. Update Content Management Systems to serve all assets over HTTPS. If third-party resources don't support HTTPS, find alternatives or self-host the resources. Configure Content Security Policy with upgrade-insecure-requests directive to automatically upgrade HTTP requests to HTTPS. Implement HSTS to force all connections to HTTPS. Test thoroughly after fixes using browser DevTools and online SSL checkers. Use automated tools like SSL Labs to scan for mixed content. Add monitoring to detect mixed content issues before users encounter them. Update build processes and content pipelines to prevent new mixed content from being deployed.`,
    technicalDetails: `Active mixed content (scripts, stylesheets, iframes) is blocked by modern browsers. Passive mixed content (images, audio, video) loads with warnings. CSP upgrade-insecure-requests directive auto-upgrades HTTP to HTTPS. Mixed content = HTTPS page loading HTTP resources.`,
    references: JSON.stringify([
      'https://developer.mozilla.org/en-US/docs/Web/Security/Mixed_content',
      'https://web.dev/what-is-mixed-content/',
      'https://www.ssllabs.com/ssltest/'
    ]),
    seoKeywords: 'mixed content, HTTPS security, SSL/TLS, encrypted connections, web security'
  },

  // ========================================
  // AI SECURITY
  // ========================================
  {
    findingKey: 'ai-technology-detected',
    category: 'ai',
    severity: 'medium',
    title: 'AI Technology Detected',
    explanation: `AI technology has been detected on your website, indicating integration with Large Language Models (LLMs), chatbots, or AI-powered features. While AI capabilities enhance user experience, they introduce unique security challenges that require specialized attention beyond traditional web security practices. AI systems are vulnerable to prompt injection attacks, data leakage, output manipulation, model theft, adversarial inputs, and other AI-specific threats categorized in the OWASP Top 10 for LLM Applications. The detection of AI technology doesn't indicate a vulnerability itself but rather highlights the need for comprehensive AI security measures including input validation, output filtering, prompt isolation, rate limiting, and monitoring for abuse patterns. Organizations deploying AI must understand and mitigate these new attack vectors to protect both their systems and users.`,
    impact: `AI implementations without proper security controls expose your organization to significant risks. Prompt injection attacks can manipulate AI behavior to bypass content filters, extract training data, or produce harmful outputs. Data leakage can occur when AI systems inadvertently reveal information from training datasets, API keys, or other sensitive context. For customer-facing AI, malicious users can abuse the system to generate spam, phishing content, or illegal material that damages your reputation and creates legal liability. Unprotected AI endpoints consume significant computational resources, making them targets for denial-of-service attacks that can result in massive infrastructure costs. Intellectual property theft through model extraction attacks can compromise proprietary AI systems. Compliance risks arise when AI processes personal data without adequate safeguards for GDPR, HIPAA, or other regulations. Beyond security, poorly secured AI can produce biased, harmful, or legally problematic outputs that expose your organization to lawsuits and reputational damage.`,
    solution: `Implement a comprehensive AI security strategy addressing the OWASP LLM Top 10. Conduct security testing using tools like Garak (LLM vulnerability scanner), PyRIT (adversarial testing), or Promptfoo (prompt security testing). Implement input validation and sanitization for all user prompts. Use output filtering to detect and block harmful, biased, or inappropriate AI responses. Deploy rate limiting on AI endpoints to prevent abuse and control costs. Monitor AI usage for unusual patterns indicating attacks or abuse. Implement prompt injection defenses through input segregation and privilege separation. Add content moderation layers before presenting AI outputs to users. Ensure AI systems don't expose sensitive data through responses. Implement proper authentication and authorization for AI features. Use separate API keys for production with spending limits. Consider engaging specialized AI security consultants for penetration testing focused on LLM vulnerabilities. Document AI security controls for compliance audits. Stay updated on emerging AI threats and security best practices.`,
    technicalDetails: `AI security differs from traditional web security. Prompt injection is analogous to SQL injection. Model behavior is probabilistic and hard to test exhaustively. API costs scale with usage. Output filtering requires semantic analysis, not just pattern matching.`,
    references: JSON.stringify([
      'https://owasp.org/www-project-top-10-for-large-language-model-applications/',
      'https://github.com/leondz/garak',
      'https://github.com/Azure/PyRIT'
    ]),
    seoKeywords: 'AI security, LLM vulnerabilities, prompt injection, AI testing, OWASP LLM Top 10, AI risk management'
  }
]

async function main() {
  console.log('🌱 Seeding Knowledge Base...')

  for (const finding of knowledgeBaseFindings) {
    await prisma.knowledgeBaseFinding.upsert({
      where: { findingKey: finding.findingKey },
      update: finding,
      create: finding,
    })
    console.log(`  ✓ ${finding.findingKey}`)
  }

  console.log(`\n✅ Seeded ${knowledgeBaseFindings.length} knowledge base entries`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
