/**
 * curl_cffi Wrapper - Node.js interface to Python curl_cffi
 *
 * Calls the Python curl_cffi_fetch.py script as a subprocess
 * and returns the result in a format compatible with CrawlerAdapter.
 */

import { spawn } from 'child_process'
import path from 'path'

export interface CurlCffiResult {
  success: boolean
  html?: string
  status_code?: number
  headers?: Record<string, string>
  cookies?: Array<{
    name: string
    value: string
    domain: string
    path: string
    secure: boolean
    httpOnly: boolean
  }>
  final_url?: string
  method?: string
  elapsed_ms?: number
  needs_browser?: boolean
  detection_reason?: string
  html_length?: number
  error?: string
}

/**
 * Fetch URL using curl_cffi Python script
 * @param url URL to fetch
 * @param timeoutMs Timeout in milliseconds (default: 15000)
 */
export async function fetchWithCurlCffi(
  url: string,
  timeoutMs: number = 15000
): Promise<CurlCffiResult> {
  return new Promise((resolve) => {
    const scriptPath = path.join(process.cwd(), 'scripts', 'curl_cffi_fetch.py')

    let stdout = ''
    let stderr = ''
    let resolved = false

    const python = spawn('python3', [scriptPath, url], {
      cwd: process.cwd(),
      timeout: timeoutMs,
    })

    // Timeout handler
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true
        python.kill('SIGKILL')
        resolve({
          success: false,
          error: `Timeout after ${timeoutMs}ms`,
          needs_browser: true,
        })
      }
    }, timeoutMs)

    python.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    python.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    python.on('close', (code) => {
      clearTimeout(timeout)

      if (resolved) return
      resolved = true

      if (stderr && !stdout) {
        resolve({
          success: false,
          error: stderr.trim(),
          needs_browser: true,
        })
        return
      }

      try {
        const result = JSON.parse(stdout)
        resolve(result)
      } catch (parseError) {
        resolve({
          success: false,
          error: `JSON parse error: ${stdout.substring(0, 200)}`,
          needs_browser: true,
        })
      }
    })

    python.on('error', (err) => {
      clearTimeout(timeout)

      if (resolved) return
      resolved = true

      resolve({
        success: false,
        error: `Process error: ${err.message}`,
        needs_browser: true,
      })
    })
  })
}

/**
 * Check if curl_cffi is available
 */
export async function isCurlCffiAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    const python = spawn('python3', ['-c', 'from curl_cffi import requests; print("OK")'], {
      timeout: 5000,
    })

    let stdout = ''

    python.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    python.on('close', (code) => {
      resolve(code === 0 && stdout.includes('OK'))
    })

    python.on('error', () => {
      resolve(false)
    })
  })
}
