#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * Simple GMP WebAssembly Demo
 * Basic arbitrary precision arithmetic
 */

import GMP from "./src/lib/index.ts"

async function simpleDemo() {
  console.log("🧮 Simple GMP Demo")

  const gmp = new GMP()
  await gmp.initialize()

  console.log(`Version: ${gmp.version()}`)

  // Basic arithmetic
  const a = gmp.mpz()
  const b = gmp.mpz()
  const result = gmp.mpz()

  a.setString("123456789")
  b.setString("987654321")

  result.add(a, b)
  console.log(`${a.getString()} + ${b.getString()} = ${result.getString()}`)

  result.multiply(a, b)
  console.log(`${a.getString()} × ${b.getString()} = ${result.getString()}`)

  // Cleanup
  a.clear()
  b.clear()
  result.clear()
  gmp.cleanup()

  console.log("✅ Simple demo complete")
}

if (import.meta.main) {
  await simpleDemo()
}