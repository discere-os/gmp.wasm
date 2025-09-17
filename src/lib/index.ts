/**
 * WebAssembly port of GMP (GNU Multiple Precision Arithmetic Library)
 * Copyright (c) 1991, 1996, 1999, 2000, 2007 Free Software Foundation, Inc.
 * Copyright (c) 2025 Superstruct Ltd, New Zealand
 * Licensed under LGPL-3.0
 */

import type {
  GMPOptions,
  GMPModule,
  GMPModuleFactory,
  MPZInteger,
  MPQRational,
  ArithmeticResult,
  SIMDCapabilities,
  SIMDPerformanceResult
} from './types.ts'

import {
  GMPError,
  GMPInitializationError,
  GMPArithmeticError,
  GMPMemoryError
} from './types.ts'

export * from './types.ts'

/**
 * MPZ Integer implementation wrapping mini-gmp mpz_t
 */
class MPZIntegerImpl implements MPZInteger {
  public readonly ptr: number
  private _isCleared = false

  constructor(private gmp: GMP) {
    this.ptr = gmp.module._malloc(16) // sizeof(mpz_t) in mini-gmp
    gmp.mpz_init(this.ptr)
  }

  get isCleared(): boolean {
    return this._isCleared
  }

  private ensureValid(): void {
    if (this._isCleared) {
      throw new GMPArithmeticError('Cannot operate on cleared MPZ integer', 'validation')
    }
  }

  set(other: MPZInteger): void {
    this.ensureValid()
    this.gmp.mpz_set(this.ptr, other.ptr)
  }

  setUnsigned(value: number): void {
    this.ensureValid()
    this.gmp.mpz_set_ui(this.ptr, value)
  }

  setSigned(value: number): void {
    this.ensureValid()
    this.gmp.mpz_set_si(this.ptr, value)
  }

  setString(str: string, base = 10): boolean {
    this.ensureValid()
    return this.gmp.mpz_set_str(this.ptr, str, base) === 0
  }

  getUnsigned(): number {
    this.ensureValid()
    return this.gmp.mpz_get_ui(this.ptr)
  }

  getSigned(): number {
    this.ensureValid()
    return this.gmp.mpz_get_si(this.ptr)
  }

  getString(base = 10): string {
    this.ensureValid()
    return this.gmp.mpz_get_str(this.ptr, base)
  }

  add(a: MPZInteger, b: MPZInteger): void {
    this.ensureValid()
    this.gmp.mpz_add(this.ptr, a.ptr, b.ptr)
  }

  subtract(a: MPZInteger, b: MPZInteger): void {
    this.ensureValid()
    this.gmp.mpz_sub(this.ptr, a.ptr, b.ptr)
  }

  multiply(a: MPZInteger, b: MPZInteger): void {
    this.ensureValid()
    this.gmp.mpz_mul(this.ptr, a.ptr, b.ptr)
  }

  divide(a: MPZInteger, b: MPZInteger): void {
    this.ensureValid()
    this.gmp.mpz_tdiv_q(this.ptr, a.ptr, b.ptr)
  }

  remainder(a: MPZInteger, b: MPZInteger): void {
    this.ensureValid()
    this.gmp.mpz_tdiv_r(this.ptr, a.ptr, b.ptr)
  }

  compare(other: MPZInteger): number {
    this.ensureValid()
    return this.gmp.mpz_cmp(this.ptr, other.ptr)
  }

  compareUnsigned(value: number): number {
    this.ensureValid()
    return this.gmp.mpz_cmp_ui(this.ptr, value)
  }

  compareSigned(value: number): number {
    this.ensureValid()
    return this.gmp.mpz_cmp_si(this.ptr, value)
  }

  abs(other: MPZInteger): void {
    this.ensureValid()
    this.gmp.mpz_abs(this.ptr, other.ptr)
  }

  negate(other: MPZInteger): void {
    this.ensureValid()
    this.gmp.mpz_neg(this.ptr, other.ptr)
  }

  gcd(a: MPZInteger, b: MPZInteger): void {
    this.ensureValid()
    this.gmp.mpz_gcd(this.ptr, a.ptr, b.ptr)
  }

  power(base: MPZInteger, exp: number): void {
    this.ensureValid()
    this.gmp.mpz_pow_ui(this.ptr, base.ptr, exp)
  }

  and(a: MPZInteger, b: MPZInteger): void {
    this.ensureValid()
    this.gmp.mpz_and(this.ptr, a.ptr, b.ptr)
  }

  or(a: MPZInteger, b: MPZInteger): void {
    this.ensureValid()
    this.gmp.mpz_ior(this.ptr, a.ptr, b.ptr)
  }

  xor(a: MPZInteger, b: MPZInteger): void {
    this.ensureValid()
    this.gmp.mpz_xor(this.ptr, a.ptr, b.ptr)
  }

  size(): number {
    this.ensureValid()
    return this.gmp.mpz_size(this.ptr)
  }

  clear(): void {
    if (!this._isCleared) {
      this.gmp.mpz_clear(this.ptr)
      this.gmp.module._free(this.ptr)
      this.gmp.allocatedNumbers.delete(this)
      this._isCleared = true
    }
  }
}

/**
 * MPQ Rational implementation wrapping mini-gmp mpq_t
 */
class MPQRationalImpl implements MPQRational {
  public readonly ptr: number
  private _isCleared = false

  constructor(private gmp: GMP) {
    this.ptr = gmp.module._malloc(32) // sizeof(mpq_t) in mini-gmp
    gmp.mpq_init(this.ptr)
  }

  get isCleared(): boolean {
    return this._isCleared
  }

  private ensureValid(): void {
    if (this._isCleared) {
      throw new GMPArithmeticError('Cannot operate on cleared MPQ rational', 'validation')
    }
  }

  set(other: MPQRational): void {
    this.ensureValid()
    this.gmp.mpq_set(this.ptr, other.ptr)
  }

  add(a: MPQRational, b: MPQRational): void {
    this.ensureValid()
    this.gmp.mpq_add(this.ptr, a.ptr, b.ptr)
  }

  multiply(a: MPQRational, b: MPQRational): void {
    this.ensureValid()
    this.gmp.mpq_mul(this.ptr, a.ptr, b.ptr)
  }

  canonicalize(): void {
    this.ensureValid()
    this.gmp.mpq_canonicalize(this.ptr)
  }

  clear(): void {
    if (!this._isCleared) {
      this.gmp.mpq_clear(this.ptr)
      this.gmp.module._free(this.ptr)
      this.gmp.allocatedNumbers.delete(this)
      this._isCleared = true
    }
  }
}

/**
 * Main GMP WebAssembly class
 */
export default class GMP {
  public module!: GMPModule
  private initialized = false
  private allocatedNumbers: Set<MPZInteger | MPQRational> = new Set()

  // Bound function references
  public mpz_init!: (ptr: number) => void
  public mpz_clear!: (ptr: number) => void
  public mpz_set!: (rop: number, op: number) => void
  public mpz_set_ui!: (rop: number, op: number) => void
  public mpz_set_si!: (rop: number, op: number) => void
  public mpz_add!: (rop: number, op1: number, op2: number) => void
  public mpz_sub!: (rop: number, op1: number, op2: number) => void
  public mpz_mul!: (rop: number, op1: number, op2: number) => void
  public mpz_tdiv_q!: (rop: number, op1: number, op2: number) => void
  public mpz_tdiv_r!: (rop: number, op1: number, op2: number) => void
  public mpz_cmp!: (op1: number, op2: number) => number
  public mpz_cmp_ui!: (op1: number, op2: number) => number
  public mpz_cmp_si!: (op1: number, op2: number) => number
  public mpz_abs!: (rop: number, op: number) => void
  public mpz_neg!: (rop: number, op: number) => void
  public mpz_gcd!: (rop: number, op1: number, op2: number) => void
  public mpz_pow_ui!: (rop: number, base: number, exp: number) => void
  public mpz_and!: (rop: number, op1: number, op2: number) => void
  public mpz_ior!: (rop: number, op1: number, op2: number) => void
  public mpz_xor!: (rop: number, op1: number, op2: number) => void
  public mpz_size!: (op: number) => number
  public mpz_get_ui!: (op: number) => number
  public mpz_get_si!: (op: number) => number
  public mpz_get_str!: (op: number, base: number) => string
  public mpz_set_str!: (rop: number, str: string, base: number) => number

  public mpq_init!: (ptr: number) => void
  public mpq_clear!: (ptr: number) => void
  public mpq_set!: (rop: number, op: number) => void
  public mpq_add!: (rop: number, op1: number, op2: number) => void
  public mpq_mul!: (rop: number, op1: number, op2: number) => void
  public mpq_canonicalize!: (op: number) => void

  // SIMD function bindings
  public simd_test!: () => number
  public simd_info!: (buffer: number, bufferSize: number) => void
  public simd_memcmp!: (ptr1: number, ptr2: number, len: number) => number
  public simd_memcpy!: (dest: number, src: number, len: number) => void
  public simd_is_zero!: (ptr: number, len: number) => number
  public simd_find_char!: (str: number, len: number, target: number) => number
  public simd_validate_digits!: (str: number, len: number, base: number) => number
  public simd_test_inline!: () => number

  constructor(private options: GMPOptions = {}) {
    this.options = {
      simdOptimizations: true,
      maxMemoryMB: 256,
      initialMemoryMB: 64,
      ...options
    }
  }

  /**
   * Initialize the GMP WebAssembly module
   */
  async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      const wasmBinary = await this.loadWasmBinary()
      const moduleFactory = await this.loadModuleFactory()

      this.module = await moduleFactory({
        wasmBinary,
        locateFile: (path: string) => {
          if (path.endsWith('.wasm')) {
            return new URL('../../install/wasm/' + path, import.meta.url).href
          }
          return path
        }
      })

      this.setupBindings()
      this.initialized = true
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      throw new GMPInitializationError(`Failed to initialize GMP: ${message}`)
    }
  }

  private async loadWasmBinary(): Promise<ArrayBuffer> {
    if (typeof globalThis.Deno !== 'undefined') {
      // Deno environment
      const wasmPath = new URL('../../install/wasm/gmp-main.wasm', import.meta.url).pathname
      try {
        const wasmBuffer = await Deno.readFile(wasmPath)
        return wasmBuffer.buffer
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        throw new GMPInitializationError(`Failed to load WASM binary: ${message}`)
      }
    } else {
      // Browser environment - try CDN fallback
      try {
        const response = await fetch('https://wasm.discere.cloud/npm/@discere-os/gmp.wasm/main.wasm')
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        return await response.arrayBuffer()
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        throw new GMPInitializationError(`Failed to load WASM binary from CDN: ${message}`)
      }
    }
  }

  private async loadModuleFactory(): Promise<GMPModuleFactory> {
    const modulePath = new URL('../../install/wasm/gmp-main.js', import.meta.url).href
    try {
      const module = await import(modulePath)
      return module.default || module.GMPModule
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      throw new GMPInitializationError(`Failed to load module factory: ${message}`)
    }
  }

  private setupBindings(): void {
    // Bind all GMP functions using cwrap for type safety
    this.mpz_init = this.module.cwrap('gmp_mpz_init', null, ['number'])
    this.mpz_clear = this.module.cwrap('gmp_mpz_clear', null, ['number'])
    this.mpz_set = this.module.cwrap('gmp_mpz_set', null, ['number', 'number'])
    this.mpz_set_ui = this.module.cwrap('gmp_mpz_set_ui', null, ['number', 'number'])
    this.mpz_set_si = this.module.cwrap('gmp_mpz_set_si', null, ['number', 'number'])

    this.mpz_add = this.module.cwrap('gmp_mpz_add', null, ['number', 'number', 'number'])
    this.mpz_sub = this.module.cwrap('gmp_mpz_sub', null, ['number', 'number', 'number'])
    this.mpz_mul = this.module.cwrap('gmp_mpz_mul', null, ['number', 'number', 'number'])
    this.mpz_tdiv_q = this.module.cwrap('gmp_mpz_tdiv_q', null, ['number', 'number', 'number'])
    this.mpz_tdiv_r = this.module.cwrap('gmp_mpz_tdiv_r', null, ['number', 'number', 'number'])

    this.mpz_cmp = this.module.cwrap('gmp_mpz_cmp', 'number', ['number', 'number'])
    this.mpz_cmp_ui = this.module.cwrap('gmp_mpz_cmp_ui', 'number', ['number', 'number'])
    this.mpz_cmp_si = this.module.cwrap('gmp_mpz_cmp_si', 'number', ['number', 'number'])

    this.mpz_abs = this.module.cwrap('gmp_mpz_abs', null, ['number', 'number'])
    this.mpz_neg = this.module.cwrap('gmp_mpz_neg', null, ['number', 'number'])
    this.mpz_gcd = this.module.cwrap('gmp_mpz_gcd', null, ['number', 'number', 'number'])
    this.mpz_pow_ui = this.module.cwrap('gmp_mpz_pow_ui', null, ['number', 'number', 'number'])

    this.mpz_and = this.module.cwrap('gmp_mpz_and', null, ['number', 'number', 'number'])
    this.mpz_ior = this.module.cwrap('gmp_mpz_ior', null, ['number', 'number', 'number'])
    this.mpz_xor = this.module.cwrap('gmp_mpz_xor', null, ['number', 'number', 'number'])

    this.mpz_size = this.module.cwrap('gmp_mpz_size', 'number', ['number'])
    this.mpz_get_ui = this.module.cwrap('gmp_mpz_get_ui', 'number', ['number'])
    this.mpz_get_si = this.module.cwrap('gmp_mpz_get_si', 'number', ['number'])

    // String functions need special handling
    const mpz_get_str_raw = this.module.cwrap('gmp_mpz_get_str_wrapper', 'number', ['number', 'number'])
    this.mpz_get_str = (ptr: number, base: number): string => {
      const strPtr = mpz_get_str_raw(base, ptr)
      const result = this.module.UTF8ToString(strPtr)
      this.module._free(strPtr)
      return result
    }

    const mpz_set_str_raw = this.module.cwrap('gmp_mpz_set_str_wrapper', 'number', ['number', 'string', 'number'])
    this.mpz_set_str = (ptr: number, str: string, base: number): number => {
      return mpz_set_str_raw(ptr, str, base)
    }

    // MPQ (rational) functions
    this.mpq_init = this.module.cwrap('gmp_mpq_init', null, ['number'])
    this.mpq_clear = this.module.cwrap('gmp_mpq_clear', null, ['number'])
    this.mpq_set = this.module.cwrap('gmp_mpq_set', null, ['number', 'number'])
    this.mpq_add = this.module.cwrap('gmp_mpq_add', null, ['number', 'number', 'number'])
    this.mpq_mul = this.module.cwrap('gmp_mpq_mul', null, ['number', 'number', 'number'])
    this.mpq_canonicalize = this.module.cwrap('gmp_mpq_canonicalize', null, ['number'])

    // SIMD function bindings with error handling
    try {
      this.simd_test_inline = this.module.cwrap('gmp_simd_test_inline', 'number', [])
      this.simd_test = this.module.cwrap('gmp_simd_test', 'number', [])
      this.simd_info = this.module.cwrap('gmp_simd_info', null, ['number', 'number'])
      this.simd_memcmp = this.module.cwrap('gmp_simd_memcmp', 'number', ['number', 'number', 'number'])
      this.simd_memcpy = this.module.cwrap('gmp_simd_memcpy', null, ['number', 'number', 'number'])
      this.simd_is_zero = this.module.cwrap('gmp_simd_is_zero', 'number', ['number', 'number'])
      this.simd_find_char = this.module.cwrap('gmp_simd_find_char', 'number', ['number', 'number', 'number'])
      this.simd_validate_digits = this.module.cwrap('gmp_simd_validate_digits', 'number', ['number', 'number', 'number'])
    } catch (error) {
      // SIMD functions not available - this is okay
      console.warn('SIMD functions not available:', error)
    }
  }

  /**
   * Create a new MPZ integer
   */
  mpz(): MPZInteger {
    if (!this.initialized) {
      throw new GMPError('GMP not initialized. Call initialize() first.')
    }

    const mpz = new MPZIntegerImpl(this)
    this.allocatedNumbers.add(mpz)
    return mpz
  }

  /**
   * Create a new MPQ rational
   */
  mpq(): MPQRational {
    if (!this.initialized) {
      throw new GMPError('GMP not initialized. Call initialize() first.')
    }

    const mpq = new MPQRationalImpl(this)
    this.allocatedNumbers.add(mpq)
    return mpq
  }

  /**
   * Get library version
   */
  version(): string {
    if (!this.initialized) {
      throw new GMPError('GMP not initialized. Call initialize() first.')
    }

    try {
      const versionPtr = this.module.ccall('gmp_version', 'number', [], [])
      return this.module.UTF8ToString(versionPtr)
    } catch {
      return '6.3.0-mini-wasm'
    }
  }

  /**
   * Check if library is initialized
   */
  isInitialized(): boolean {
    return this.initialized
  }

  /**
   * Clean up all allocated resources
   */
  cleanup(): void {
    // Clear all allocated numbers
    for (const num of this.allocatedNumbers) {
      if (!num.isCleared) {
        num.clear()
      }
    }
    this.allocatedNumbers.clear()

    if (this.module) {
      this.module = null!
      this.initialized = false
    }
  }

  /**
   * Perform a timed arithmetic operation with metrics
   */
  async timedOperation<T>(operation: () => T): Promise<ArithmeticResult> {
    const startTime = performance.now()
    let success = false
    let result: string | undefined

    try {
      const operationResult = operation()
      success = true

      if (typeof operationResult === 'string') {
        result = operationResult
      } else if (operationResult && typeof operationResult.getString === 'function') {
        result = (operationResult as any).getString()
      }
    } catch (error) {
      success = false
    }

    const endTime = performance.now()

    return {
      success,
      result,
      executionTimeMs: endTime - startTime,
      simdUsed: this.options.simdOptimizations ?? false,
      memoryUsed: this.allocatedNumbers.size * 32 // Rough estimate
    }
  }

  // Convenience methods for common operations

  /**
   * Calculate Fibonacci number
   */
  fibonacci(n: number): ArithmeticResult {
    const result = this.mpz()

    return this.timedOperation(() => {
      if (this.module._gmp_demo_fibonacci) {
        this.module.ccall('gmp_demo_fibonacci', 'void', ['number', 'number'], [result.ptr, n])
        return result.getString()
      } else {
        // Fallback implementation
        const a = this.mpz()
        const b = this.mpz()
        const temp = this.mpz()

        a.setUnsigned(0)
        b.setUnsigned(1)

        if (n <= 1) {
          result.setUnsigned(n)
        } else {
          for (let i = 2; i <= n; i++) {
            temp.add(a, b)
            a.set(b)
            b.set(temp)
          }
          result.set(b)
        }

        a.clear()
        b.clear()
        temp.clear()

        return result.getString()
      }
    })
  }

  /**
   * Calculate factorial
   */
  factorial(n: number): ArithmeticResult {
    const result = this.mpz()

    return this.timedOperation(() => {
      if (this.module._gmp_demo_factorial) {
        this.module.ccall('gmp_demo_factorial', 'void', ['number', 'number'], [result.ptr, n])
        return result.getString()
      } else {
        // Fallback implementation
        result.setUnsigned(1)
        for (let i = 2; i <= n; i++) {
          const temp = this.mpz()
          temp.setUnsigned(i)
          const newResult = this.mpz()
          newResult.multiply(result, temp)
          result.set(newResult)
          temp.clear()
          newResult.clear()
        }
        return result.getString()
      }
    })
  }

  // SIMD Optimization Methods

  /**
   * Get SIMD capabilities information
   */
  getSIMDCapabilities(): SIMDCapabilities {
    if (!this.initialized) {
      throw new GMPError('GMP not initialized. Call initialize() first.')
    }

    let supported = false
    let tested = false
    let info = 'SIMD not available'

    try {
      // First try the inline test function
      if (this.simd_test_inline) {
        const inlineResult = this.simd_test_inline()
        if (inlineResult === 1) {
          supported = true
          tested = true
          info = 'SIMD compile-time support detected'
        } else {
          info = 'SIMD not compiled in'
        }
      }

      // Then try the external test function
      if (this.simd_test && !supported) {
        tested = this.simd_test() === 1
        supported = tested
        if (!supported) {
          info = 'SIMD runtime test failed'
        }
      }

      // Get detailed info if available
      if (this.simd_info && supported) {
        const bufferSize = 512
        const buffer = this.module._malloc(bufferSize)
        this.simd_info(buffer, bufferSize)
        info = this.module.UTF8ToString(buffer)
        this.module._free(buffer)
      }
    } catch (error) {
      supported = false
      tested = false
      info = `SIMD test failed: ${error instanceof Error ? error.message : String(error)}`
    }

    return {
      supported,
      tested,
      info
    }
  }

  /**
   * Benchmark SIMD vs scalar performance for memory operations
   */
  benchmarkSIMDMemory(sizeBytes: number = 1024 * 1024): SIMDPerformanceResult {
    if (!this.initialized) {
      throw new GMPError('GMP not initialized. Call initialize() first.')
    }

    // Create test data
    const data1 = this.module._malloc(sizeBytes)
    const data2 = this.module._malloc(sizeBytes)
    const result = this.module._malloc(sizeBytes)

    // Fill with test data
    for (let i = 0; i < sizeBytes; i++) {
      this.module.setValue(data1 + i, i % 256, 'i8')
      this.module.setValue(data2 + i, (i + 100) % 256, 'i8')
    }

    try {
      // Benchmark scalar memcmp
      const scalarStart = performance.now()
      for (let i = 0; i < 100; i++) {
        // Use standard C library memcmp equivalent
        let different = false
        for (let j = 0; j < sizeBytes; j++) {
          if (this.module.getValue(data1 + j, 'i8') !== this.module.getValue(data2 + j, 'i8')) {
            different = true
            break
          }
        }
      }
      const scalarTime = performance.now() - scalarStart

      // Benchmark SIMD memcmp
      const simdStart = performance.now()
      for (let i = 0; i < 100; i++) {
        if (this.simd_memcmp) {
          this.simd_memcmp(data1, data2, sizeBytes)
        }
      }
      const simdTime = performance.now() - simdStart

      const speedup = scalarTime / simdTime
      const throughputMBps = (sizeBytes * 100) / (simdTime * 1000) // MB/s

      return {
        operation: 'Memory Comparison',
        scalarTimeMs: scalarTime,
        simdTimeMs: simdTime,
        speedup,
        throughputMBps
      }
    } finally {
      // Clean up
      this.module._free(data1)
      this.module._free(data2)
      this.module._free(result)
    }
  }

  /**
   * Benchmark SIMD vs scalar for string operations
   */
  benchmarkSIMDString(length: number = 10000): SIMDPerformanceResult {
    if (!this.initialized) {
      throw new GMPError('GMP not initialized. Call initialize() first.')
    }

    // Create test string
    const testStr = 'A'.repeat(length - 1) + 'Z'
    const strPtr = this.module._malloc(length + 1)
    this.module.stringToUTF8(testStr, strPtr, length + 1)

    try {
      // Benchmark scalar character search
      const scalarStart = performance.now()
      for (let i = 0; i < 1000; i++) {
        let found = -1
        for (let j = 0; j < length; j++) {
          if (this.module.getValue(strPtr + j, 'i8') === 90) { // 'Z'
            found = j
            break
          }
        }
      }
      const scalarTime = performance.now() - scalarStart

      // Benchmark SIMD character search
      const simdStart = performance.now()
      for (let i = 0; i < 1000; i++) {
        if (this.simd_find_char) {
          this.simd_find_char(strPtr, length, 90) // Search for 'Z'
        }
      }
      const simdTime = performance.now() - simdStart

      const speedup = scalarTime / simdTime
      const throughputMBps = (length * 1000) / (simdTime * 1000000) // MB/s

      return {
        operation: 'Character Search',
        scalarTimeMs: scalarTime,
        simdTimeMs: simdTime,
        speedup,
        throughputMBps
      }
    } finally {
      // Clean up
      this.module._free(strPtr)
    }
  }

  /**
   * Test SIMD digit validation performance
   */
  benchmarkSIMDDigitValidation(digitCount: number = 50000): SIMDPerformanceResult {
    if (!this.initialized) {
      throw new GMPError('GMP not initialized. Call initialize() first.')
    }

    // Create test digits string (all valid base-10 digits)
    const testDigits = '1234567890'.repeat(Math.floor(digitCount / 10))
    const digitsPtr = this.module._malloc(digitCount + 1)
    this.module.stringToUTF8(testDigits, digitsPtr, digitCount + 1)

    try {
      // Benchmark scalar digit validation
      const scalarStart = performance.now()
      for (let i = 0; i < 100; i++) {
        let valid = true
        for (let j = 0; j < digitCount; j++) {
          const char = this.module.getValue(digitsPtr + j, 'i8')
          if (char < 48 || char > 57) { // '0' to '9'
            valid = false
            break
          }
        }
      }
      const scalarTime = performance.now() - scalarStart

      // Benchmark SIMD digit validation
      const simdStart = performance.now()
      for (let i = 0; i < 100; i++) {
        if (this.simd_validate_digits) {
          this.simd_validate_digits(digitsPtr, digitCount, 10)
        }
      }
      const simdTime = performance.now() - simdStart

      const speedup = scalarTime / simdTime
      const throughputMBps = (digitCount * 100) / (simdTime * 1000000) // MB/s

      return {
        operation: 'Digit Validation',
        scalarTimeMs: scalarTime,
        simdTimeMs: simdTime,
        speedup,
        throughputMBps
      }
    } finally {
      // Clean up
      this.module._free(digitsPtr)
    }
  }

  /**
   * Run comprehensive SIMD performance suite
   */
  async benchmarkSIMDSuite(): Promise<SIMDPerformanceResult[]> {
    if (!this.initialized) {
      throw new GMPError('GMP not initialized. Call initialize() first.')
    }

    const results: SIMDPerformanceResult[] = []

    try {
      // Memory operations
      results.push(this.benchmarkSIMDMemory(1024 * 1024)) // 1MB

      // String operations
      results.push(this.benchmarkSIMDString(100000)) // 100K chars

      // Digit validation
      results.push(this.benchmarkSIMDDigitValidation(50000)) // 50K digits

      console.log('🚀 SIMD Performance Results:')
      for (const result of results) {
        console.log(`${result.operation}: ${result.speedup.toFixed(2)}x speedup (${result.throughputMBps.toFixed(1)} MB/s)`)
      }

      return results
    } catch (error) {
      console.warn('SIMD benchmarking failed:', error)
      return results
    }
  }
}