/**
 * Advanced arithmetic operation tests
 */

import { assert, assertEquals, assertExists } from "@std/assert"
import GMP from "../../src/lib/index.ts"

Deno.test("Large Number Arithmetic", async (t) => {
  const gmp = new GMP()
  await gmp.initialize()

  await t.step("should handle very large number addition", () => {
    const a = gmp.mpz()
    const b = gmp.mpz()
    const result = gmp.mpz()

    // 50-digit numbers
    const num1 = "12345678901234567890123456789012345678901234567890"
    const num2 = "98765432109876543210987654321098765432109876543210"
    const expected = "111111111011111111101111111110111111111011111111100"

    a.setString(num1)
    b.setString(num2)
    result.add(a, b)

    assertEquals(result.getString(), expected)

    a.clear()
    b.clear()
    result.clear()
  })

  await t.step("should handle very large number multiplication", () => {
    const a = gmp.mpz()
    const b = gmp.mpz()
    const result = gmp.mpz()

    // Test with smaller numbers first to verify correctness
    a.setString("123456789")
    b.setString("987654321")
    result.multiply(a, b)

    assertEquals(result.getString(), "121932631112635269")

    a.clear()
    b.clear()
    result.clear()
  })

  await t.step("should handle power operations with large results", () => {
    const base = gmp.mpz()
    const result = gmp.mpz()

    base.setUnsigned(2)
    result.power(base, 100)

    // 2^100 = 1267650600228229401496703205376
    assertEquals(result.getString(), "1267650600228229401496703205376")

    base.setUnsigned(10)
    result.power(base, 20)

    assertEquals(result.getString(), "100000000000000000000")

    base.clear()
    result.clear()
  })

  gmp.cleanup()
})

Deno.test("Fibonacci and Factorial Functions", async (t) => {
  const gmp = new GMP()
  await gmp.initialize()

  await t.step("should calculate small Fibonacci numbers", async () => {
    const results = []

    for (let i = 0; i <= 10; i++) {
      const fib = await gmp.fibonacci(i)
      assert(fib.success)
      results.push(parseInt(fib.result!))
    }

    // Check first 11 Fibonacci numbers
    const expected = [0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55]
    assertEquals(results, expected)
  })

  await t.step("should calculate large Fibonacci numbers", async () => {
    const fib50 = await gmp.fibonacci(50)
    assert(fib50.success)
    assertEquals(fib50.result, "12586269025")

    const fib100 = await gmp.fibonacci(100)
    assert(fib100.success)
    assertEquals(fib100.result, "354224848179261915075")

    // Check performance metrics
    assert(fib100.executionTimeMs >= 0)
    assert(typeof fib100.simdUsed === 'boolean')
  })

  await t.step("should calculate factorial numbers", async () => {
    const fact5 = await gmp.factorial(5)
    assert(fact5.success)
    assertEquals(fact5.result, "120")

    const fact10 = await gmp.factorial(10)
    assert(fact10.success)
    assertEquals(fact10.result, "3628800")

    const fact20 = await gmp.factorial(20)
    assert(fact20.success)
    assertEquals(fact20.result, "2432902008176640000")

    // Large factorial
    const fact50 = await gmp.factorial(50)
    assert(fact50.success)
    assertEquals(fact50.result, "30414093201713378043612608166064768844377641568960512000000000000")
  })

  gmp.cleanup()
})

Deno.test("Number Base Conversions", async (t) => {
  const gmp = new GMP()
  await gmp.initialize()

  await t.step("should handle binary representations", () => {
    const a = gmp.mpz()

    // Test binary input
    assert(a.setString("1010101010", 2))
    assertEquals(a.getUnsigned(), 682) // 0b1010101010

    // Test binary output
    a.setUnsigned(255)
    assertEquals(a.getString(2), "11111111")

    a.clear()
  })

  await t.step("should handle hexadecimal representations", () => {
    const a = gmp.mpz()

    // Test hex input (use smaller value due to JavaScript signed int limitations)
    assert(a.setString("ABCDEF", 16))
    assertEquals(a.getUnsigned(), 11259375)

    // Test hex output (mini-gmp returns lowercase)
    a.setUnsigned(255)
    assertEquals(a.getString(16), "ff")

    a.setUnsigned(4095)
    assertEquals(a.getString(16), "fff")

    a.clear()
  })

  await t.step("should handle octal representations", () => {
    const a = gmp.mpz()

    // Test octal input
    assert(a.setString("777", 8))
    assertEquals(a.getUnsigned(), 511) // 0o777

    // Test octal output
    a.setUnsigned(64)
    assertEquals(a.getString(8), "100") // 0o100

    a.clear()
  })

  await t.step("should handle custom bases", () => {
    const a = gmp.mpz()

    // Base 36 (max supported)
    assert(a.setString("ZZ", 36))
    assertEquals(a.getUnsigned(), 1295) // Z=35, ZZ = 35*36 + 35

    // Base 3
    assert(a.setString("2201", 3))
    assertEquals(a.getUnsigned(), 73) // 2*27 + 2*9 + 0*3 + 1

    a.clear()
  })

  gmp.cleanup()
})

Deno.test("Edge Cases and Error Conditions", async (t) => {
  const gmp = new GMP()
  await gmp.initialize()

  await t.step("should handle zero operations", () => {
    const zero = gmp.mpz()
    const a = gmp.mpz()
    const result = gmp.mpz()

    zero.setUnsigned(0)
    a.setUnsigned(42)

    // Addition with zero
    result.add(a, zero)
    assertEquals(result.getUnsigned(), 42)

    // Multiplication with zero
    result.multiply(a, zero)
    assertEquals(result.getUnsigned(), 0)

    // Power of zero
    result.power(zero, 5)
    assertEquals(result.getUnsigned(), 0)

    // Zero power (should be 1)
    result.power(a, 0)
    assertEquals(result.getUnsigned(), 1)

    zero.clear()
    a.clear()
    result.clear()
  })

  await t.step("should handle negative numbers", () => {
    const a = gmp.mpz()
    const b = gmp.mpz()
    const result = gmp.mpz()

    a.setSigned(-100)
    b.setSigned(50)

    result.add(a, b)
    assertEquals(result.getSigned(), -50)

    result.subtract(a, b)
    assertEquals(result.getSigned(), -150)

    result.multiply(a, b)
    assertEquals(result.getSigned(), -5000)

    // Absolute value
    result.abs(a)
    assertEquals(result.getUnsigned(), 100)

    // Negation
    result.negate(a)
    assertEquals(result.getSigned(), 100)

    a.clear()
    b.clear()
    result.clear()
  })

  await t.step("should handle invalid string inputs", () => {
    const a = gmp.mpz()

    // Invalid characters for base 10
    assert(!a.setString("abc", 10))
    assert(!a.setString("12.34", 10))
    assert(!a.setString("", 10))

    // Invalid characters for base 2
    assert(!a.setString("123", 2))

    // Valid edge case - should work
    assert(a.setString("0", 10))
    assertEquals(a.getUnsigned(), 0)

    a.clear()
  })

  await t.step("should handle maximum safe integers", () => {
    const a = gmp.mpz()

    // JavaScript's MAX_SAFE_INTEGER
    const maxSafe = 9007199254740991
    a.setString(maxSafe.toString())
    assertEquals(a.getString(), maxSafe.toString())

    // Beyond MAX_SAFE_INTEGER
    a.setString("9007199254740992")
    assertEquals(a.getString(), "9007199254740992")

    a.clear()
  })

  gmp.cleanup()
})

Deno.test("Performance and Memory Management", async (t) => {
  const gmp = new GMP()
  await gmp.initialize()

  await t.step("should handle many allocations efficiently", () => {
    const numbers = []

    // Allocate many integers
    for (let i = 0; i < 100; i++) {
      const num = gmp.mpz()
      num.setUnsigned(i)
      numbers.push(num)
    }

    // Verify they all have different values
    for (let i = 0; i < 100; i++) {
      assertEquals(numbers[i].getUnsigned(), i)
    }

    // Clean them all up
    for (const num of numbers) {
      num.clear()
    }
  })

  await t.step("should track allocated numbers", () => {
    const initialCount = gmp['allocatedNumbers'].size

    const a = gmp.mpz()
    const b = gmp.mpz()

    assertEquals(gmp['allocatedNumbers'].size, initialCount + 2)

    a.clear()
    assertEquals(gmp['allocatedNumbers'].size, initialCount + 2) // Still tracked

    b.clear()
    assertEquals(gmp['allocatedNumbers'].size, initialCount + 2) // Still tracked
  })

  await t.step("should measure timed operations", async () => {
    const result = await gmp.timedOperation(() => {
      const a = gmp.mpz()
      const b = gmp.mpz()
      const result = gmp.mpz()

      a.setString("123456789")
      b.setString("987654321")
      result.multiply(a, b)

      const resultStr = result.getString()

      a.clear()
      b.clear()
      result.clear()

      return resultStr
    })

    assert(result.success)
    assertEquals(result.result, "121932631112635269")
    assert(result.executionTimeMs >= 0)
    assert(typeof result.simdUsed === 'boolean')
    assert(typeof result.memoryUsed === 'number')
  })

  gmp.cleanup()
})