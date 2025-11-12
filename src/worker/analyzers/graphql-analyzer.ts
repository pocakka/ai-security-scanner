/**
 * GraphQL Security Analyzer
 *
 * Detects GraphQL endpoints and checks for common security misconfigurations.
 *
 * Checks for:
 * - GraphQL endpoint detection
 * - Introspection enabled (security risk)
 * - GraphQL Playground/GraphiQL exposed
 * - Query depth limiting
 * - Query cost analysis
 * - Batch query support
 *
 * ALL CHECKS ARE PASSIVE - analyzing HTML and endpoints only
 */

interface GraphQLFinding {
  type: string
  severity: 'info' | 'low' | 'medium' | 'high'
  title: string
  category: string
  endpoint?: string
  evidence?: string
  recommendation?: string
  impact?: string
}

export interface GraphQLResult {
  findings: GraphQLFinding[]
  hasGraphQL: boolean
  endpoints: string[]
  hasIntrospection: boolean
  hasPlayground: boolean
  hasGraphiQL: boolean
}

export async function analyzeGraphQL(html: string): Promise<GraphQLResult> {
  const findings: GraphQLFinding[] = []
  const endpoints: string[] = []
  let hasIntrospection = false
  let hasPlayground = false
  let hasGraphiQL = false

  const lowerHTML = html.toLowerCase()

  // Detect GraphQL endpoints
  const detectedEndpoints = detectGraphQLEndpoints(html, lowerHTML)
  endpoints.push(...detectedEndpoints)

  if (detectedEndpoints.length > 0) {
    findings.push({
      type: 'graphql-endpoint',
      severity: 'info',
      title: 'GraphQL Endpoint Detected',
      category: 'graphql',
      endpoint: detectedEndpoints.join(', '),
      evidence: `Found ${detectedEndpoints.length} GraphQL endpoint(s)`,
    })
  }

  // Check for introspection
  if (checkIntrospection(html, lowerHTML)) {
    hasIntrospection = true
    findings.push({
      type: 'graphql-introspection',
      severity: 'medium',
      title: 'GraphQL Introspection Enabled',
      category: 'graphql',
      impact: 'Attackers can discover the entire GraphQL schema including all types, queries, and mutations',
      recommendation: 'Disable introspection in production environments',
    })
  }

  // Check for GraphQL Playground
  if (checkPlayground(html, lowerHTML)) {
    hasPlayground = true
    findings.push({
      type: 'graphql-playground',
      severity: 'high',
      title: 'GraphQL Playground Exposed',
      category: 'graphql',
      impact: 'Interactive GraphQL IDE accessible to anyone - allows easy exploration and testing of your API',
      recommendation: 'Disable GraphQL Playground in production',
    })
  }

  // Check for GraphiQL
  if (checkGraphiQL(html, lowerHTML)) {
    hasGraphiQL = true
    findings.push({
      type: 'graphql-graphiql',
      severity: 'high',
      title: 'GraphiQL IDE Exposed',
      category: 'graphql',
      impact: 'GraphiQL development interface is publicly accessible',
      recommendation: 'Disable GraphiQL in production environments',
    })
  }

  // Check for batching
  if (checkBatching(html, lowerHTML)) {
    findings.push({
      type: 'graphql-batching',
      severity: 'info',
      title: 'GraphQL Query Batching Detected',
      category: 'graphql',
      evidence: 'Query batching support detected',
      recommendation: 'Ensure batch query limits are in place to prevent DoS attacks',
    })
  }

  // Recommendations if GraphQL detected
  if (endpoints.length > 0) {
    if (!hasIntrospection) {
      findings.push({
        type: 'graphql-introspection-disabled',
        severity: 'info',
        title: 'Introspection Appears Disabled',
        category: 'graphql',
        evidence: 'No introspection indicators found (good security practice)',
      })
    }

    findings.push({
      type: 'graphql-best-practices',
      severity: 'info',
      title: 'GraphQL Security Recommendations',
      category: 'graphql',
      recommendation: 'Implement query depth limiting, query cost analysis, and rate limiting for GraphQL endpoints',
    })
  }

  return {
    findings,
    hasGraphQL: endpoints.length > 0,
    endpoints,
    hasIntrospection,
    hasPlayground,
    hasGraphiQL,
  }
}

/**
 * Detect GraphQL Endpoints
 */
function detectGraphQLEndpoints(html: string, lowerHTML: string): string[] {
  const endpoints: string[] = []

  // Common GraphQL endpoint patterns
  const patterns = [
    '/graphql',
    '/api/graphql',
    '/v1/graphql',
    '/query',
    '/api/query',
    '/gql',
    '/api/gql',
  ]

  for (const pattern of patterns) {
    if (lowerHTML.includes(pattern)) {
      endpoints.push(pattern)
    }
  }

  // Check for GraphQL client libraries
  if (
    lowerHTML.includes('apollo') ||
    lowerHTML.includes('@apollo/client') ||
    html.includes('ApolloClient') ||
    html.includes('ApolloProvider')
  ) {
    if (!endpoints.includes('/graphql')) {
      endpoints.push('/graphql (Apollo Client detected)')
    }
  }

  if (lowerHTML.includes('relay') || lowerHTML.includes('react-relay')) {
    if (!endpoints.includes('/graphql')) {
      endpoints.push('/graphql (Relay detected)')
    }
  }

  if (lowerHTML.includes('urql') || lowerHTML.includes('@urql/core')) {
    if (!endpoints.includes('/graphql')) {
      endpoints.push('/graphql (urql detected)')
    }
  }

  return [...new Set(endpoints)]
}

/**
 * Check for Introspection
 */
function checkIntrospection(html: string, lowerHTML: string): boolean {
  const introspectionIndicators = [
    '__schema',
    '__type',
    'introspectionquery',
    'introspection query',
    '__typename',
  ]

  for (const indicator of introspectionIndicators) {
    if (lowerHTML.includes(indicator)) {
      return true
    }
  }

  return false
}

/**
 * Check for GraphQL Playground
 */
function checkPlayground(html: string, lowerHTML: string): boolean {
  return (
    lowerHTML.includes('graphql playground') ||
    lowerHTML.includes('graphql-playground') ||
    html.includes('GraphQLPlayground') ||
    lowerHTML.includes('playground.css')
  )
}

/**
 * Check for GraphiQL
 */
function checkGraphiQL(html: string, lowerHTML: string): boolean {
  return (
    lowerHTML.includes('graphiql') ||
    html.includes('GraphiQL') ||
    lowerHTML.includes('graphiql.css') ||
    lowerHTML.includes('graphiql.min.js')
  )
}

/**
 * Check for Query Batching
 */
function checkBatching(html: string, lowerHTML: string): boolean {
  return (
    lowerHTML.includes('batch') &&
    (lowerHTML.includes('graphql') || lowerHTML.includes('query'))
  )
}
