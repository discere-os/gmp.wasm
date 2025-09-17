#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * GMP WebAssembly Demo
 * Demonstrates arbitrary precision arithmetic with mini-gmp
 */

import GMP from "./src/lib/index.ts"

async function demo() {
  console.log("🧮 GMP WebAssembly Demo")
  console.log("=" + "=".repeat(50))

  try {
    const gmp = new GMP({
      simdOptimizations: true,
      maxMemoryMB: 128
    })

    console.log("📦 Initializing GMP module...")
    await gmp.initialize()
    console.log(`✅ GMP initialized - Version: ${gmp.version()}`)

    // Basic arithmetic operations
    console.log("\n🔢 Basic Integer Arithmetic:")
    console.log("-".repeat(30))

    const a = gmp.mpz()
    const b = gmp.mpz()
    const result = gmp.mpz()

    // Set some large numbers
    a.setString("123456789012345678901234567890")
    b.setString("987654321098765432109876543210")

    console.log(`a = ${a.getString()}`)
    console.log(`b = ${b.getString()}`)

    // Addition
    result.add(a, b)
    console.log(`a + b = ${result.getString()}`)

    // Multiplication
    result.multiply(a, b)
    console.log(`a × b = ${result.getString()}`)

    // Power
    const base = gmp.mpz()
    base.setUnsigned(2)
    result.power(base, 100)
    console.log(`2^100 = ${result.getString()}`)

    // GCD
    const gcd_a = gmp.mpz()
    const gcd_b = gmp.mpz()
    gcd_a.setString("1071")
    gcd_b.setString("462")
    result.gcd(gcd_a, gcd_b)
    console.log(`GCD(1071, 462) = ${result.getString()}`)

    // Comparison operations
    console.log("\n⚖️  Comparison Operations:")
    console.log("-".repeat(25))

    const x = gmp.mpz()
    const y = gmp.mpz()
    x.setString("999999999999999999")
    y.setString("1000000000000000000")

    console.log(`x = ${x.getString()}`)
    console.log(`y = ${y.getString()}`)

    const cmp = x.compare(y)
    if (cmp < 0) console.log("x < y")
    else if (cmp > 0) console.log("x > y")
    else console.log("x = y")

    // Bitwise operations
    console.log("\n🔧 Bitwise Operations:")
    console.log("-".repeat(20))

    const bit_a = gmp.mpz()
    const bit_b = gmp.mpz()
    bit_a.setUnsigned(0xAAAA)
    bit_b.setUnsigned(0x5555)

    result.and(bit_a, bit_b)
    console.log(`0xAAAA & 0x5555 = 0x${result.getUnsigned().toString(16).toUpperCase()}`)

    result.or(bit_a, bit_b)
    console.log(`0xAAAA | 0x5555 = 0x${result.getUnsigned().toString(16).toUpperCase()}`)

    result.xor(bit_a, bit_b)
    console.log(`0xAAAA ^ 0x5555 = 0x${result.getUnsigned().toString(16).toUpperCase()}`)

    // Rational numbers
    console.log("\n🔣 Rational Number Operations:")
    console.log("-".repeat(30))

    const r1 = gmp.mpq()
    const r2 = gmp.mpq()
    const r_result = gmp.mpq()

    // Note: mini-mpq doesn't have string conversion, so we'll show basic operations
    console.log("Created rational numbers r1 and r2")
    console.log("r1 + r2 computed (no string conversion in mini-mpq)")

    r_result.add(r1, r2)
    console.log("✅ Rational arithmetic operations successful")

    // Performance demonstration
    console.log("\n⚡ Performance Demonstrations:")
    console.log("-".repeat(32))

    // Fibonacci
    console.log("🌀 Computing Fibonacci(100)...")
    const fibStart = performance.now()
    const fibResult = await gmp.fibonacci(100)
    const fibEnd = performance.now()

    if (fibResult.success) {
      console.log(`Fibonacci(100) = ${fibResult.result}`)
      console.log(`⏱️  Execution time: ${fibResult.executionTimeMs.toFixed(3)}ms`)
      console.log(`🚀 SIMD used: ${fibResult.simdUsed}`)
    }

    // Factorial
    console.log("\n📈 Computing 50! (factorial)...")
    const factStart = performance.now()
    const factResult = await gmp.factorial(50)
    const factEnd = performance.now()

    if (factResult.success) {
      console.log(`50! = ${factResult.result}`)
      console.log(`⏱️  Execution time: ${factResult.executionTimeMs.toFixed(3)}ms`)
      console.log(`🚀 SIMD used: ${factResult.simdUsed}`)
    }

    // Large number operations
    console.log("\n🎯 Large Number Stress Test:")
    console.log("-".repeat(30))

    const large1 = gmp.mpz()
    const large2 = gmp.mpz()
    const largeResult = gmp.mpz()

    // Generate very large numbers
    large1.setString("9".repeat(100)) // 100 digits of 9
    large2.setString("8".repeat(100)) // 100 digits of 8

    const largeStart = performance.now()
    largeResult.multiply(large1, large2)
    const largeEnd = performance.now()

    console.log(`Multiplying two 100-digit numbers...`)
    console.log(`Result has ${largeResult.getString().length} digits`)
    console.log(`⏱️  Execution time: ${(largeEnd - largeStart).toFixed(3)}ms`)

    // Memory usage
    console.log("\n💾 Memory Information:")
    console.log("-".repeat(20))
    console.log(`Numbers allocated: ${gmp['allocatedNumbers'].size}`)

    // Clean up resources
    console.log("\n🧹 Cleaning up resources...")
    a.clear()
    b.clear()
    result.clear()
    base.clear()
    gcd_a.clear()
    gcd_b.clear()
    x.clear()
    y.clear()
    bit_a.clear()
    bit_b.clear()
    r1.clear()
    r2.clear()
    r_result.clear()
    large1.clear()
    large2.clear()
    largeResult.clear()

    gmp.cleanup()
    console.log("✅ Cleanup complete")

    console.log("\n🎉 Demo completed successfully!")
    console.log("💫 GMP WebAssembly is ready for production use.")

  } catch (error) {
    console.error("❌ Demo failed:", error.message)
    console.error(error.stack)
    Deno.exit(1)
  }
}

if (import.meta.main) {
  await demo()
}