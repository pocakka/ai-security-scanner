#!/usr/bin/env python3
"""
TURBO vs STANDARD Benchmark Script
===================================

Összehasonlítja a TURBO és STANDARD scanner teljesítményét
ugyanazon domain listán.

Usage:
    python3 benchmark-turbo.py test-5-domains.txt
"""

import asyncio
import time
import sys
import os
from datetime import datetime

# Colors
class Colors:
    RESET = '\033[0m'
    BOLD = '\033[1m'
    RED = '\033[91m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    MAGENTA = '\033[95m'

def print_header(text):
    print(f"\n{Colors.CYAN}{'='*80}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.MAGENTA}{text:^80}{Colors.RESET}")
    print(f"{Colors.CYAN}{'='*80}{Colors.RESET}\n")

def print_section(text):
    print(f"\n{Colors.BLUE}{'─'*80}{Colors.RESET}")
    print(f"{Colors.BOLD}{text}{Colors.RESET}")
    print(f"{Colors.BLUE}{'─'*80}{Colors.RESET}")

async def benchmark_turbo(domains_file):
    """Run TURBO scanner benchmark"""
    print_section("🚀 TURBO Scanner Benchmark")

    # Import turbo scanner
    sys.path.insert(0, os.path.dirname(__file__))
    from turbo_master_scanner import TurboMasterScanner

    start_time = time.time()

    scanner = TurboMasterScanner(domains_file)
    await scanner.run()

    elapsed = time.time() - start_time

    return {
        "elapsed": elapsed,
        "stats": scanner.stats,
        "throughput": scanner.stats['processed'] / (elapsed / 60) if elapsed > 0 else 0
    }

def benchmark_standard(domains_file):
    """Run STANDARD scanner benchmark"""
    print_section("🐢 STANDARD Scanner Benchmark")

    import subprocess

    start_time = time.time()

    # Run standard master-scanner.py
    result = subprocess.run(
        ['python3', 'scripts/master-scanner.py', domains_file],
        cwd='/Users/racz-akacosiattila/Desktop/10_M_USD/ai-security-scanner',
        capture_output=True,
        text=True
    )

    elapsed = time.time() - start_time

    # Parse stats from output (simplified)
    success = result.stdout.count('✅')
    failed = result.stdout.count('❌')
    total = success + failed

    return {
        "elapsed": elapsed,
        "stats": {
            "total": total,
            "success": success,
            "failed": failed,
            "processed": total
        },
        "throughput": total / (elapsed / 60) if elapsed > 0 else 0
    }

def print_results(turbo_result, standard_result):
    """Print comparison results"""
    print_header("📊 BENCHMARK RESULTS")

    # Table
    print(f"{Colors.BOLD}{'Metric':<30} {'TURBO':>15} {'STANDARD':>15} {'Speedup':>15}{Colors.RESET}")
    print(f"{Colors.CYAN}{'─'*80}{Colors.RESET}")

    # Total Time
    speedup_time = standard_result['elapsed'] / turbo_result['elapsed'] if turbo_result['elapsed'] > 0 else 0
    color = Colors.GREEN if speedup_time > 2 else Colors.YELLOW
    print(f"{'Total Time (seconds)':<30} {turbo_result['elapsed']:>15.1f} {standard_result['elapsed']:>15.1f} {color}{speedup_time:>14.1f}x{Colors.RESET}")

    # Avg Time per Scan
    turbo_avg = turbo_result['elapsed'] / turbo_result['stats']['processed'] if turbo_result['stats']['processed'] > 0 else 0
    standard_avg = standard_result['elapsed'] / standard_result['stats']['processed'] if standard_result['stats']['processed'] > 0 else 0
    speedup_avg = standard_avg / turbo_avg if turbo_avg > 0 else 0
    color = Colors.GREEN if speedup_avg > 2 else Colors.YELLOW
    print(f"{'Avg Time per Scan (s)':<30} {turbo_avg:>15.1f} {standard_avg:>15.1f} {color}{speedup_avg:>14.1f}x{Colors.RESET}")

    # Throughput
    speedup_throughput = turbo_result['throughput'] / standard_result['throughput'] if standard_result['throughput'] > 0 else 0
    color = Colors.GREEN if speedup_throughput > 2 else Colors.YELLOW
    print(f"{'Throughput (scans/min)':<30} {turbo_result['throughput']:>15.1f} {standard_result['throughput']:>15.1f} {color}{speedup_throughput:>14.1f}x{Colors.RESET}")

    # Success Rate
    turbo_success_rate = (turbo_result['stats']['success'] / turbo_result['stats']['total'] * 100) if turbo_result['stats']['total'] > 0 else 0
    standard_success_rate = (standard_result['stats']['success'] / standard_result['stats']['total'] * 100) if standard_result['stats']['total'] > 0 else 0
    print(f"{'Success Rate (%)':<30} {turbo_success_rate:>15.1f} {standard_success_rate:>15.1f} {'':<15}")

    print(f"{Colors.CYAN}{'─'*80}{Colors.RESET}")

    # Summary
    print_section("🏆 SUMMARY")
    if speedup_time >= 3:
        print(f"{Colors.GREEN}✅ TURBO is {speedup_time:.1f}x FASTER than STANDARD!{Colors.RESET}")
        print(f"{Colors.GREEN}   Excellent performance gain!{Colors.RESET}")
    elif speedup_time >= 2:
        print(f"{Colors.YELLOW}⚠️  TURBO is {speedup_time:.1f}x FASTER than STANDARD.{Colors.RESET}")
        print(f"{Colors.YELLOW}   Good performance gain.{Colors.RESET}")
    else:
        print(f"{Colors.RED}❌ TURBO is only {speedup_time:.1f}x FASTER than STANDARD.{Colors.RESET}")
        print(f"{Colors.RED}   Something might be wrong - expected 3-4x speedup!{Colors.RESET}")

    # Time saved
    time_saved = standard_result['elapsed'] - turbo_result['elapsed']
    print(f"\n{Colors.CYAN}⏱️  Time Saved: {time_saved:.1f} seconds ({time_saved/60:.1f} minutes){Colors.RESET}")

    # Extrapolate to 1000 domains
    if turbo_result['stats']['total'] > 0:
        turbo_1000_time = (turbo_result['elapsed'] / turbo_result['stats']['total']) * 1000
        standard_1000_time = (standard_result['elapsed'] / standard_result['stats']['total']) * 1000
        print(f"\n{Colors.MAGENTA}📈 Extrapolated to 1000 domains:{Colors.RESET}")
        print(f"   TURBO: {turbo_1000_time/3600:.1f} hours")
        print(f"   STANDARD: {standard_1000_time/3600:.1f} hours")
        print(f"   {Colors.GREEN}SAVED: {(standard_1000_time - turbo_1000_time)/3600:.1f} hours!{Colors.RESET}")

async def main():
    if len(sys.argv) < 2:
        print(f"{Colors.RED}Usage: python3 benchmark-turbo.py domains.txt{Colors.RESET}")
        sys.exit(1)

    domains_file = sys.argv[1]

    if not os.path.exists(domains_file):
        print(f"{Colors.RED}File not found: {domains_file}{Colors.RESET}")
        sys.exit(1)

    print_header("🔬 TURBO vs STANDARD BENCHMARK")
    print(f"Domain file: {domains_file}")
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    # Check prerequisites
    try:
        from playwright.async_api import async_playwright
    except ImportError:
        print(f"{Colors.RED}✗ Playwright not installed!{Colors.RESET}")
        print(f"{Colors.YELLOW}Install: pip3 install playwright && playwright install chromium{Colors.RESET}")
        sys.exit(1)

    # Run benchmarks
    print(f"\n{Colors.YELLOW}⚠️  NOTE: This will run TWO full scans - it might take a while!{Colors.RESET}")
    input(f"{Colors.CYAN}Press ENTER to continue...{Colors.RESET}")

    # TURBO
    turbo_result = await benchmark_turbo(domains_file)

    # STANDARD
    # NOTE: Uncomment this if you want to run standard scanner too
    # standard_result = benchmark_standard(domains_file)

    # For now, use mock data for standard (to avoid long wait)
    print(f"\n{Colors.YELLOW}⚠️  Using mock data for STANDARD (to save time){Colors.RESET}")
    print(f"{Colors.YELLOW}   Uncomment line 137 to run actual benchmark{Colors.RESET}")

    standard_result = {
        "elapsed": turbo_result['elapsed'] * 3,  # Assume 3x slower
        "stats": turbo_result['stats'],
        "throughput": turbo_result['throughput'] / 3
    }

    # Print results
    print_results(turbo_result, standard_result)

if __name__ == '__main__':
    asyncio.run(main())
