/**
 * Performance benchmarks for GMP WebAssembly
 */

import GMP from "../src/lib/index.ts"

// Global GMP instance for benchmarks
let gmp: GMP

// Setup before all benchmarks
await (async () => {
  gmp = new GMP({
    simdOptimizations: true,
    maxMemoryMB: 512,
    initialMemoryMB: 128
  })
  await gmp.initialize()
  console.log(`🧮 GMP Benchmarks - Version: ${gmp.version()}`)
  console.log("📊 Running performance benchmarks...")
})()

Deno.bench("Integer creation and cleanup", () => {
  const a = gmp.mpz()
  const b = gmp.mpz()
  const c = gmp.mpz()

  a.clear()
  b.clear()
  c.clear()
})

Deno.bench("Small integer arithmetic (32-bit)", () => {
  const a = gmp.mpz()
  const b = gmp.mpz()
  const result = gmp.mpz()

  a.setUnsigned(123456)
  b.setUnsigned(789012)

  result.add(a, b)
  result.multiply(a, b)
  result.subtract(a, b)

  a.clear()
  b.clear()
  result.clear()
})

Deno.bench("Medium integer arithmetic (64-bit)", () => {
  const a = gmp.mpz()
  const b = gmp.mpz()
  const result = gmp.mpz()

  a.setString("1234567890123456")
  b.setString("9876543210987654")

  result.add(a, b)
  result.multiply(a, b)
  result.subtract(a, b)

  a.clear()
  b.clear()
  result.clear()
})

Deno.bench("Large integer arithmetic (256-bit)", () => {
  const a = gmp.mpz()
  const b = gmp.mpz()
  const result = gmp.mpz()

  a.setString("12345678901234567890123456789012345678901234567890123456789012345678")
  b.setString("98765432109876543210987654321098765432109876543210987654321098765432")

  result.add(a, b)
  result.multiply(a, b)

  a.clear()
  b.clear()
  result.clear()
})

Deno.bench("Very large integer multiplication (512-bit)", () => {
  const a = gmp.mpz()
  const b = gmp.mpz()
  const result = gmp.mpz()

  // 512-bit numbers (154+ decimal digits)
  a.setString("1" + "0".repeat(154))
  b.setString("9" + "9".repeat(154))

  result.multiply(a, b)

  a.clear()
  b.clear()
  result.clear()
})

Deno.bench("String conversion operations", () => {
  const a = gmp.mpz()

  // Test various bases
  a.setString("12345678901234567890123456789012345678901234567890")
  const decimal = a.getString(10)
  const hex = a.getString(16)
  const binary = a.getString(2)

  a.setString("ABCDEF123456789", 16)
  const fromHex = a.getString(10)

  a.clear()
})

Deno.bench("Comparison operations", () => {
  const a = gmp.mpz()
  const b = gmp.mpz()

  a.setString("12345678901234567890123456789012345678901234567890")
  b.setString("12345678901234567890123456789012345678901234567891")

  for (let i = 0; i < 100; i++) {
    const cmp = a.compare(b)
    const cmpUi = a.compareUnsigned(12345)
    const cmpSi = a.compareSigned(-54321)
  }

  a.clear()
  b.clear()
})

Deno.bench("Mathematical functions", () => {
  const a = gmp.mpz()
  const b = gmp.mpz()
  const result = gmp.mpz()

  a.setString("12345678901234567890")
  b.setString("98765432109876543210")

  result.gcd(a, b)
  result.abs(a)
  result.negate(a)

  a.clear()
  b.clear()
  result.clear()
})

Deno.bench("Power operations", () => {
  const base = gmp.mpz()
  const result = gmp.mpz()

  base.setUnsigned(2)
  result.power(base, 50)

  base.setUnsigned(3)
  result.power(base, 25)

  base.setUnsigned(10)
  result.power(base, 20)

  base.clear()
  result.clear()
})

Deno.bench("Bitwise operations", () => {
  const a = gmp.mpz()
  const b = gmp.mpz()
  const result = gmp.mpz()

  a.setString("123456789012345678901234567890")
  b.setString("987654321098765432109876543210")

  result.and(a, b)
  result.or(a, b)
  result.xor(a, b)

  a.clear()
  b.clear()
  result.clear()
})

Deno.bench("Division and remainder", () => {
  const dividend = gmp.mpz()
  const divisor = gmp.mpz()
  const quotient = gmp.mpz()
  const remainder = gmp.mpz()

  dividend.setString("12345678901234567890123456789012345678901234567890")
  divisor.setString("9876543210987654321")

  quotient.divide(dividend, divisor)
  remainder.remainder(dividend, divisor)

  dividend.clear()
  divisor.clear()
  quotient.clear()
  remainder.clear()
})

Deno.bench("Fibonacci calculation sequence", () => {
  const a = gmp.mpz()
  const b = gmp.mpz()
  const temp = gmp.mpz()

  a.setUnsigned(0)
  b.setUnsigned(1)

  // Calculate Fibonacci(50)
  for (let i = 2; i <= 50; i++) {
    temp.add(a, b)
    a.set(b)
    b.set(temp)
  }

  a.clear()
  b.clear()
  temp.clear()
})

Deno.bench("Factorial calculation", () => {
  const result = gmp.mpz()
  const temp = gmp.mpz()

  result.setUnsigned(1)

  // Calculate 30!
  for (let i = 2; i <= 30; i++) {
    temp.setUnsigned(i)
    const newResult = gmp.mpz()
    newResult.multiply(result, temp)
    result.set(newResult)
    newResult.clear()
  }

  result.clear()
  temp.clear()
})

Deno.bench("Memory allocation stress test", () => {
  const numbers: any[] = []

  // Allocate 50 numbers
  for (let i = 0; i < 50; i++) {
    const num = gmp.mpz()
    num.setUnsigned(i * 12345)
    numbers.push(num)
  }

  // Perform operations
  for (let i = 0; i < 49; i++) {
    const result = gmp.mpz()
    result.add(numbers[i], numbers[i + 1])
    result.clear()
  }

  // Clean up
  for (const num of numbers) {
    num.clear()
  }
})

Deno.bench("Mixed operation workload", () => {
  const a = gmp.mpz()
  const b = gmp.mpz()
  const c = gmp.mpz()
  const result = gmp.mpz()

  // Initialize with different sized numbers
  a.setString("123456789")
  b.setString("987654321012345678901234567890")
  c.setUnsigned(42)

  // Mixed operations
  result.multiply(a, b)
  result.add(result, c)
  result.power(c, 10)
  result.gcd(a, b)

  const str = result.getString()
  const hex = result.getString(16)

  const cmp = a.compare(b)
  result.abs(result)

  a.clear()
  b.clear()
  c.clear()
  result.clear()
})

// Rational number benchmarks
Deno.bench("Rational number operations", () => {
  const r1 = gmp.mpq()
  const r2 = gmp.mpq()
  const result = gmp.mpq()

  // Basic rational arithmetic
  result.add(r1, r2)
  result.multiply(r1, r2)
  result.canonicalize()

  r1.clear()
  r2.clear()
  result.clear()
})

// Cleanup after benchmarks
globalThis.addEventListener("unload", () => {
  gmp?.cleanup()
  console.log("🧹 Benchmark cleanup completed")
})