/**
 * Basic GMP functionality tests
 */

import { assert, assertEquals, assertExists, assertThrows } from "@std/assert"
import GMP, { GMPError, GMPInitializationError } from "../../src/lib/index.ts"

Deno.test("GMP Library Initialization", async (t) => {
  await t.step("should initialize successfully", async () => {
    const gmp = new GMP()
    await gmp.initialize()

    assertExists(gmp)
    assert(gmp.isInitialized())

    const version = gmp.version()
    assertExists(version)
    assert(version.includes("mini-wasm"))

    gmp.cleanup()
  })

  await t.step("should handle double initialization", async () => {
    const gmp = new GMP()
    await gmp.initialize()
    await gmp.initialize() // Should not throw

    assert(gmp.isInitialized())
    gmp.cleanup()
  })

  await t.step("should fail operations before initialization", () => {
    const gmp = new GMP()

    assertThrows(() => {
      gmp.mpz()
    }, GMPError, "not initialized")
  })

  await t.step("should initialize with custom options", async () => {
    const gmp = new GMP({
      simdOptimizations: true,
      maxMemoryMB: 512,
      initialMemoryMB: 128
    })

    await gmp.initialize()
    assert(gmp.isInitialized())
    gmp.cleanup()
  })
})

Deno.test("MPZ Integer Creation and Cleanup", async (t) => {
  const gmp = new GMP()
  await gmp.initialize()

  await t.step("should create and clear integers", () => {
    const a = gmp.mpz()
    const b = gmp.mpz()

    assertExists(a)
    assertExists(b)
    assert(!a.isCleared)
    assert(!b.isCleared)
    assert(a.ptr !== 0)
    assert(b.ptr !== 0)
    assert(a.ptr !== b.ptr)

    a.clear()
    b.clear()

    assert(a.isCleared)
    assert(b.isCleared)
  })

  await t.step("should prevent operations on cleared integers", () => {
    const a = gmp.mpz()
    a.clear()

    assertThrows(() => {
      a.setUnsigned(42)
    }, GMPError, "cleared")
  })

  gmp.cleanup()
})

Deno.test("MPZ Integer Basic Operations", async (t) => {
  const gmp = new GMP()
  await gmp.initialize()

  await t.step("should set and get unsigned integers", () => {
    const a = gmp.mpz()

    a.setUnsigned(12345)
    assertEquals(a.getUnsigned(), 12345)

    a.setUnsigned(0)
    assertEquals(a.getUnsigned(), 0)

    // Note: JavaScript numbers have limitations with large unsigned integers
    a.setUnsigned(2147483647) // Max safe signed 32-bit
    assertEquals(a.getUnsigned(), 2147483647)

    a.clear()
  })

  await t.step("should set and get signed integers", () => {
    const a = gmp.mpz()

    a.setSigned(12345)
    assertEquals(a.getSigned(), 12345)

    a.setSigned(-12345)
    assertEquals(a.getSigned(), -12345)

    a.setSigned(0)
    assertEquals(a.getSigned(), 0)

    a.clear()
  })

  await t.step("should set and get string representations", () => {
    const a = gmp.mpz()

    // Base 10 (default)
    assert(a.setString("12345"))
    assertEquals(a.getString(), "12345")

    // Base 16
    assert(a.setString("FF", 16))
    assertEquals(a.getString(16), "ff")

    // Base 2
    assert(a.setString("101010", 2))
    assertEquals(a.getString(2), "101010")

    // Invalid string should return false
    assert(!a.setString("invalid", 10))

    a.clear()
  })

  await t.step("should copy integers", () => {
    const a = gmp.mpz()
    const b = gmp.mpz()

    a.setUnsigned(54321)
    b.set(a)

    assertEquals(b.getUnsigned(), 54321)

    a.clear()
    b.clear()
  })

  gmp.cleanup()
})

Deno.test("MPZ Arithmetic Operations", async (t) => {
  const gmp = new GMP()
  await gmp.initialize()

  await t.step("should perform addition", () => {
    const a = gmp.mpz()
    const b = gmp.mpz()
    const result = gmp.mpz()

    a.setUnsigned(123)
    b.setUnsigned(456)
    result.add(a, b)

    assertEquals(result.getUnsigned(), 579)

    // Test large numbers
    a.setString("999999999999999999")
    b.setString("1")
    result.add(a, b)

    assertEquals(result.getString(), "1000000000000000000")

    a.clear()
    b.clear()
    result.clear()
  })

  await t.step("should perform subtraction", () => {
    const a = gmp.mpz()
    const b = gmp.mpz()
    const result = gmp.mpz()

    a.setUnsigned(1000)
    b.setUnsigned(123)
    result.subtract(a, b)

    assertEquals(result.getUnsigned(), 877)

    a.clear()
    b.clear()
    result.clear()
  })

  await t.step("should perform multiplication", () => {
    const a = gmp.mpz()
    const b = gmp.mpz()
    const result = gmp.mpz()

    a.setUnsigned(123)
    b.setUnsigned(456)
    result.multiply(a, b)

    assertEquals(result.getUnsigned(), 56088)

    // Test large number multiplication
    a.setString("12345678901234567890")
    b.setString("98765432109876543210")
    result.multiply(a, b)

    assertEquals(result.getString(), "1219326311370217952237463801111263526900")

    a.clear()
    b.clear()
    result.clear()
  })

  await t.step("should perform division and remainder", () => {
    const a = gmp.mpz()
    const b = gmp.mpz()
    const quotient = gmp.mpz()
    const remainder = gmp.mpz()

    a.setUnsigned(1000)
    b.setUnsigned(7)

    quotient.divide(a, b)
    remainder.remainder(a, b)

    assertEquals(quotient.getUnsigned(), 142)
    assertEquals(remainder.getUnsigned(), 6)

    // Verify: 142 * 7 + 6 = 1000
    const verify = gmp.mpz()
    const temp = gmp.mpz()
    temp.multiply(quotient, b)
    verify.add(temp, remainder)
    assertEquals(verify.getUnsigned(), 1000)

    a.clear()
    b.clear()
    quotient.clear()
    remainder.clear()
    verify.clear()
    temp.clear()
  })

  gmp.cleanup()
})

Deno.test("MPZ Comparison Operations", async (t) => {
  const gmp = new GMP()
  await gmp.initialize()

  await t.step("should compare integers", () => {
    const a = gmp.mpz()
    const b = gmp.mpz()

    a.setUnsigned(100)
    b.setUnsigned(200)

    assert(a.compare(b) < 0) // a < b
    assert(b.compare(a) > 0) // b > a

    b.setUnsigned(100)
    assertEquals(a.compare(b), 0) // a == b

    a.clear()
    b.clear()
  })

  await t.step("should compare with unsigned values", () => {
    const a = gmp.mpz()

    a.setUnsigned(100)

    assert(a.compareUnsigned(200) < 0)
    assert(a.compareUnsigned(50) > 0)
    assertEquals(a.compareUnsigned(100), 0)

    a.clear()
  })

  await t.step("should compare with signed values", () => {
    const a = gmp.mpz()

    a.setSigned(-50)

    assert(a.compareSigned(0) < 0)
    assert(a.compareSigned(-100) > 0)
    assertEquals(a.compareSigned(-50), 0)

    a.clear()
  })

  gmp.cleanup()
})

Deno.test("MPZ Mathematical Functions", async (t) => {
  const gmp = new GMP()
  await gmp.initialize()

  await t.step("should compute absolute value", () => {
    const a = gmp.mpz()
    const result = gmp.mpz()

    a.setSigned(-123)
    result.abs(a)
    assertEquals(result.getUnsigned(), 123)

    a.setSigned(456)
    result.abs(a)
    assertEquals(result.getUnsigned(), 456)

    a.clear()
    result.clear()
  })

  await t.step("should compute negation", () => {
    const a = gmp.mpz()
    const result = gmp.mpz()

    a.setSigned(123)
    result.negate(a)
    assertEquals(result.getSigned(), -123)

    a.setSigned(-456)
    result.negate(a)
    assertEquals(result.getSigned(), 456)

    a.clear()
    result.clear()
  })

  await t.step("should compute GCD", () => {
    const a = gmp.mpz()
    const b = gmp.mpz()
    const result = gmp.mpz()

    a.setUnsigned(48)
    b.setUnsigned(18)
    result.gcd(a, b)
    assertEquals(result.getUnsigned(), 6)

    // Test with larger numbers
    a.setUnsigned(1071)
    b.setUnsigned(462)
    result.gcd(a, b)
    assertEquals(result.getUnsigned(), 21)

    a.clear()
    b.clear()
    result.clear()
  })

  await t.step("should compute power", () => {
    const a = gmp.mpz()
    const result = gmp.mpz()

    a.setUnsigned(2)
    result.power(a, 10)
    assertEquals(result.getUnsigned(), 1024)

    a.setUnsigned(3)
    result.power(a, 4)
    assertEquals(result.getUnsigned(), 81)

    a.clear()
    result.clear()
  })

  gmp.cleanup()
})

Deno.test("MPZ Bitwise Operations", async (t) => {
  const gmp = new GMP()
  await gmp.initialize()

  await t.step("should perform bitwise AND", () => {
    const a = gmp.mpz()
    const b = gmp.mpz()
    const result = gmp.mpz()

    a.setUnsigned(0xAAAA)
    b.setUnsigned(0x5555)
    result.and(a, b)
    assertEquals(result.getUnsigned(), 0x0000)

    a.setUnsigned(0xF0F0)
    b.setUnsigned(0xFF00)
    result.and(a, b)
    assertEquals(result.getUnsigned(), 0xF000)

    a.clear()
    b.clear()
    result.clear()
  })

  await t.step("should perform bitwise OR", () => {
    const a = gmp.mpz()
    const b = gmp.mpz()
    const result = gmp.mpz()

    a.setUnsigned(0xAAAA)
    b.setUnsigned(0x5555)
    result.or(a, b)
    assertEquals(result.getUnsigned(), 0xFFFF)

    a.clear()
    b.clear()
    result.clear()
  })

  await t.step("should perform bitwise XOR", () => {
    const a = gmp.mpz()
    const b = gmp.mpz()
    const result = gmp.mpz()

    a.setUnsigned(0xAAAA)
    b.setUnsigned(0x5555)
    result.xor(a, b)
    assertEquals(result.getUnsigned(), 0xFFFF)

    a.setUnsigned(0xF0F0)
    b.setUnsigned(0xF0F0)
    result.xor(a, b)
    assertEquals(result.getUnsigned(), 0x0000)

    a.clear()
    b.clear()
    result.clear()
  })

  gmp.cleanup()
})

Deno.test("MPZ Size and Properties", async (t) => {
  const gmp = new GMP()
  await gmp.initialize()

  await t.step("should report size in limbs", () => {
    const a = gmp.mpz()

    a.setUnsigned(0)
    const size0 = a.size()
    assert(size0 >= 0)

    a.setUnsigned(1)
    const size1 = a.size()
    assert(size1 >= 1)

    // Large number should have larger size
    a.setString("123456789012345678901234567890")
    const sizeLarge = a.size()
    assert(sizeLarge > size1)

    a.clear()
  })

  gmp.cleanup()
})

Deno.test("Error Handling", async (t) => {
  await t.step("should throw initialization errors appropriately", async () => {
    // This test would need to simulate WASM loading failure
    // For now, just verify error types exist
    const error = new GMPInitializationError("test")
    assertEquals(error.name, "GMPInitializationError")
  })

  await t.step("should handle cleanup gracefully", async () => {
    const gmp = new GMP()
    await gmp.initialize()

    // Multiple cleanups should not throw
    gmp.cleanup()
    gmp.cleanup()

    // Operations after cleanup should fail
    assertThrows(() => {
      gmp.mpz()
    }, GMPError)
  })
})