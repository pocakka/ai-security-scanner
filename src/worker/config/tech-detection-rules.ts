/**
 * Tech Detection Rules Configuration
 *
 * User-editable technology detection patterns.
 * Add or modify rules to detect CMS, Analytics, Ads, CDN, and Social integrations.
 *
 * Pattern Types:
 * - dom: HTML content regex match
 * - script: <script src="..."> URL pattern
 * - link: <link href="..."> URL pattern
 * - html: Full HTML source regex match
 * - header: HTTP response header check
 * - meta: <meta> tag check
 */

export interface TechPattern {
  name: string
  category: 'cms' | 'analytics' | 'ads' | 'cdn' | 'social' | 'ecommerce' | 'framework' | 'hosting'
  confidence: 'low' | 'medium' | 'high'
  patterns: {
    type: 'dom' | 'script' | 'link' | 'html' | 'header' | 'meta' | 'js-global'
    match: string | RegExp
    version?: RegExp // Optional version extraction
  }[]
  description?: string
  website?: string
}

export const TECH_DETECTION_RULES: TechPattern[] = [
  // ==================== CMS ====================
  {
    name: 'WordPress',
    category: 'cms',
    confidence: 'high',
    description: 'Open-source content management system',
    website: 'https://wordpress.org',
    patterns: [
      { type: 'html', match: /wp-content\//i },
      { type: 'html', match: /wp-includes\//i },
      { type: 'meta', match: /<meta name="generator" content="WordPress ([\d.]+)"/i, version: /WordPress ([\d.]+)/i },
      { type: 'script', match: /\/wp-content\/plugins\//i },
      { type: 'script', match: /\/wp-includes\/js\//i },
    ],
  },
  {
    name: 'Joomla',
    category: 'cms',
    confidence: 'high',
    description: 'Open-source CMS',
    website: 'https://joomla.org',
    patterns: [
      { type: 'html', match: /\/components\/com_/i },
      { type: 'meta', match: /<meta name="generator" content="Joomla/i },
      { type: 'script', match: /\/media\/jui\//i },
    ],
  },
  {
    name: 'Drupal',
    category: 'cms',
    confidence: 'high',
    description: 'Open-source CMS',
    website: 'https://drupal.org',
    patterns: [
      { type: 'html', match: /Drupal\.settings/i },
      { type: 'meta', match: /<meta name="generator" content="Drupal ([\d.]+)"/i, version: /Drupal ([\d.]+)/i },
      { type: 'script', match: /\/sites\/default\/files\//i },
    ],
  },
  {
    name: 'Shopify',
    category: 'cms',
    confidence: 'high',
    description: 'E-commerce platform',
    website: 'https://shopify.com',
    patterns: [
      { type: 'html', match: /cdn\.shopify\.com/i },
      { type: 'js-global', match: /window\.Shopify/i },
      { type: 'script', match: /cdn\.shopify\.com/i },
    ],
  },
  {
    name: 'Wix',
    category: 'cms',
    confidence: 'high',
    description: 'Website builder',
    website: 'https://wix.com',
    patterns: [
      { type: 'html', match: /static\.wixstatic\.com/i },
      { type: 'meta', match: /<meta name="generator" content="Wix\.com"/i },
    ],
  },
  {
    name: 'Webflow',
    category: 'cms',
    confidence: 'high',
    description: 'Visual web design platform',
    website: 'https://webflow.com',
    patterns: [
      { type: 'html', match: /assets\.website-files\.com/i },
      { type: 'meta', match: /<meta name="generator" content="Webflow"/i },
    ],
  },
  {
    name: 'Squarespace',
    category: 'cms',
    confidence: 'high',
    description: 'Website builder',
    website: 'https://squarespace.com',
    patterns: [
      { type: 'html', match: /static1\.squarespace\.com/i },
      { type: 'meta', match: /<meta name="generator" content="Squarespace"/i },
    ],
  },

  // ==================== E-COMMERCE ====================
  {
    name: 'WooCommerce',
    category: 'ecommerce',
    confidence: 'high',
    description: 'WordPress e-commerce plugin',
    website: 'https://woocommerce.com',
    patterns: [
      { type: 'script', match: /\/wp-content\/plugins\/woocommerce\//i },
      { type: 'html', match: /woocommerce/i },
    ],
  },
  {
    name: 'Magento',
    category: 'ecommerce',
    confidence: 'high',
    description: 'Open-source e-commerce platform',
    website: 'https://magento.com',
    patterns: [
      { type: 'html', match: /Mage\.Cookies/i },
      { type: 'script', match: /\/static\/frontend\//i },
      { type: 'script', match: /\/mage\//i },
    ],
  },
  {
    name: 'PrestaShop',
    category: 'ecommerce',
    confidence: 'high',
    description: 'Open-source e-commerce solution',
    website: 'https://prestashop.com',
    patterns: [
      { type: 'html', match: /\/modules\/[^\/]+\/[^\/]+/i },
      { type: 'meta', match: /<meta name="generator" content="PrestaShop"/i },
    ],
  },

  // ==================== ANALYTICS ====================
  {
    name: 'Google Analytics',
    category: 'analytics',
    confidence: 'high',
    description: 'Web analytics service',
    website: 'https://analytics.google.com',
    patterns: [
      { type: 'script', match: /google-analytics\.com\/analytics\.js/i },
      { type: 'script', match: /googletagmanager\.com\/gtag\/js/i },
      { type: 'html', match: /['"](UA-\d{4,}-\d+)['"]/i, version: /UA-([\d-]+)/i },
      { type: 'html', match: /['"](G-[A-Z0-9]+)['"]/i },
    ],
  },
  {
    name: 'Google Tag Manager',
    category: 'analytics',
    confidence: 'high',
    description: 'Tag management system',
    website: 'https://tagmanager.google.com',
    patterns: [
      { type: 'script', match: /googletagmanager\.com\/gtm\.js/i },
      { type: 'html', match: /['"](GTM-[A-Z0-9]+)['"]/i, version: /GTM-([A-Z0-9]+)/i },
    ],
  },
  {
    name: 'Facebook Pixel',
    category: 'analytics',
    confidence: 'high',
    description: 'Facebook analytics',
    website: 'https://facebook.com/business/tools/meta-pixel',
    patterns: [
      { type: 'script', match: /connect\.facebook\.net\/.*\/fbevents\.js/i },
      { type: 'html', match: /fbq\s*\(/i },
    ],
  },
  {
    name: 'Hotjar',
    category: 'analytics',
    confidence: 'high',
    description: 'Session recording and heatmaps',
    website: 'https://hotjar.com',
    patterns: [
      { type: 'script', match: /static\.hotjar\.com/i },
      { type: 'js-global', match: /window\.hj/i },
    ],
  },
  {
    name: 'Mixpanel',
    category: 'analytics',
    confidence: 'high',
    description: 'Product analytics',
    website: 'https://mixpanel.com',
    patterns: [
      { type: 'script', match: /cdn\.mxpnl\.com/i },
      { type: 'js-global', match: /window\.mixpanel/i },
    ],
  },
  {
    name: 'Segment',
    category: 'analytics',
    confidence: 'high',
    description: 'Customer data platform',
    website: 'https://segment.com',
    patterns: [
      { type: 'script', match: /cdn\.segment\.com/i },
      { type: 'js-global', match: /window\.analytics/i },
    ],
  },
  {
    name: 'Amplitude',
    category: 'analytics',
    confidence: 'high',
    description: 'Product analytics',
    website: 'https://amplitude.com',
    patterns: [
      { type: 'script', match: /cdn\.amplitude\.com/i },
      { type: 'js-global', match: /window\.amplitude/i },
    ],
  },

  // ==================== ADVERTISING ====================
  {
    name: 'Google AdSense',
    category: 'ads',
    confidence: 'high',
    description: 'Ad network',
    website: 'https://adsense.google.com',
    patterns: [
      { type: 'script', match: /pagead2\.googlesyndication\.com/i },
      { type: 'html', match: /google_ad_client/i },
    ],
  },
  {
    name: 'Google DoubleClick',
    category: 'ads',
    confidence: 'high',
    description: 'Ad serving platform',
    website: 'https://marketingplatform.google.com/about/enterprise/',
    patterns: [
      { type: 'script', match: /doubleclick\.net/i },
      { type: 'script', match: /googleadservices\.com/i },
    ],
  },
  {
    name: 'Media.net',
    category: 'ads',
    confidence: 'high',
    description: 'Ad network',
    website: 'https://media.net',
    patterns: [
      { type: 'script', match: /media\.net/i },
    ],
  },
  {
    name: 'Taboola',
    category: 'ads',
    confidence: 'high',
    description: 'Content recommendation',
    website: 'https://taboola.com',
    patterns: [
      { type: 'script', match: /cdn\.taboola\.com/i },
    ],
  },
  {
    name: 'Outbrain',
    category: 'ads',
    confidence: 'high',
    description: 'Content discovery platform',
    website: 'https://outbrain.com',
    patterns: [
      { type: 'script', match: /widgets\.outbrain\.com/i },
    ],
  },

  // ==================== CDN ====================
  {
    name: 'Cloudflare',
    category: 'cdn',
    confidence: 'high',
    description: 'CDN and security',
    website: 'https://cloudflare.com',
    patterns: [
      { type: 'header', match: /cf-ray/i },
      { type: 'script', match: /cdnjs\.cloudflare\.com/i },
    ],
  },
  {
    name: 'Amazon CloudFront',
    category: 'cdn',
    confidence: 'high',
    description: 'AWS CDN',
    website: 'https://aws.amazon.com/cloudfront/',
    patterns: [
      { type: 'header', match: /x-amz-cf-id/i },
      { type: 'script', match: /\.cloudfront\.net/i },
    ],
  },
  {
    name: 'Fastly',
    category: 'cdn',
    confidence: 'high',
    description: 'Edge cloud platform',
    website: 'https://fastly.com',
    patterns: [
      { type: 'header', match: /fastly/i },
    ],
  },
  {
    name: 'jsDelivr',
    category: 'cdn',
    confidence: 'high',
    description: 'Free CDN for open source',
    website: 'https://jsdelivr.com',
    patterns: [
      { type: 'script', match: /cdn\.jsdelivr\.net/i },
    ],
  },
  {
    name: 'unpkg',
    category: 'cdn',
    confidence: 'high',
    description: 'Fast global CDN for npm',
    website: 'https://unpkg.com',
    patterns: [
      { type: 'script', match: /unpkg\.com/i },
    ],
  },

  // ==================== SOCIAL ====================
  {
    name: 'Facebook SDK',
    category: 'social',
    confidence: 'high',
    description: 'Facebook integration',
    website: 'https://developers.facebook.com',
    patterns: [
      { type: 'script', match: /connect\.facebook\.net\/.*\/sdk\.js/i },
      { type: 'html', match: /FB\.init/i },
    ],
  },
  {
    name: 'Twitter Widget',
    category: 'social',
    confidence: 'high',
    description: 'Twitter embedded content',
    website: 'https://developer.twitter.com',
    patterns: [
      { type: 'script', match: /platform\.twitter\.com\/widgets\.js/i },
    ],
  },
  {
    name: 'Instagram Embed',
    category: 'social',
    confidence: 'high',
    description: 'Instagram embedded posts',
    website: 'https://instagram.com',
    patterns: [
      { type: 'script', match: /instagram\.com\/embed\.js/i },
    ],
  },
  {
    name: 'LinkedIn Insights',
    category: 'social',
    confidence: 'high',
    description: 'LinkedIn analytics',
    website: 'https://linkedin.com',
    patterns: [
      { type: 'script', match: /snap\.licdn\.com/i },
    ],
  },
  {
    name: 'Pinterest Save Button',
    category: 'social',
    confidence: 'high',
    description: 'Pinterest sharing',
    website: 'https://pinterest.com',
    patterns: [
      { type: 'script', match: /assets\.pinterest\.com/i },
    ],
  },
  {
    name: 'AddThis',
    category: 'social',
    confidence: 'high',
    description: 'Social sharing widget',
    website: 'https://addthis.com',
    patterns: [
      { type: 'script', match: /s7\.addthis\.com/i },
    ],
  },
  {
    name: 'ShareThis',
    category: 'social',
    confidence: 'high',
    description: 'Social sharing buttons',
    website: 'https://sharethis.com',
    patterns: [
      { type: 'script', match: /platform-api\.sharethis\.com/i },
    ],
  },

  // ==================== FRAMEWORKS ====================
  {
    name: 'React',
    category: 'framework',
    confidence: 'medium',
    description: 'JavaScript library',
    website: 'https://react.dev',
    patterns: [
      { type: 'html', match: /__REACT_/i },
      { type: 'html', match: /data-reactroot/i },
      { type: 'js-global', match: /window\.React/i },
    ],
  },
  {
    name: 'Next.js',
    category: 'framework',
    confidence: 'high',
    description: 'React framework',
    website: 'https://nextjs.org',
    patterns: [
      { type: 'html', match: /__NEXT_DATA__/i },
      { type: 'script', match: /\/_next\//i },
    ],
  },
  {
    name: 'Vue.js',
    category: 'framework',
    confidence: 'medium',
    description: 'JavaScript framework',
    website: 'https://vuejs.org',
    patterns: [
      { type: 'html', match: /data-v-[a-f0-9]{8}/i },
      { type: 'js-global', match: /window\.Vue/i },
    ],
  },
  {
    name: 'Angular',
    category: 'framework',
    confidence: 'medium',
    description: 'JavaScript framework',
    website: 'https://angular.io',
    patterns: [
      { type: 'html', match: /ng-version/i },
      { type: 'js-global', match: /window\.ng/i },
    ],
  },

  // ==================== HOSTING ====================
  {
    name: 'Vercel',
    category: 'hosting',
    confidence: 'high',
    description: 'Cloud platform',
    website: 'https://vercel.com',
    patterns: [
      { type: 'header', match: /x-vercel-id/i },
    ],
  },
  {
    name: 'Netlify',
    category: 'hosting',
    confidence: 'high',
    description: 'Web hosting',
    website: 'https://netlify.com',
    patterns: [
      { type: 'header', match: /x-nf-request-id/i },
    ],
  },
  {
    name: 'GitHub Pages',
    category: 'hosting',
    confidence: 'high',
    description: 'Static site hosting',
    website: 'https://pages.github.com',
    patterns: [
      { type: 'header', match: /x-github-request-id/i },
    ],
  },
]
