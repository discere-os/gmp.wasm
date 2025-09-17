/**
 * Type definitions for GMP WebAssembly port
 * Copyright (c) 1991, 1996, 1999, 2000, 2007 Free Software Foundation, Inc.
 * Copyright (c) 2025 Superstruct Ltd, New Zealand
 * Licensed under LGPL-3.0
 */

/** Configuration options for GMP initialization */
export interface GMPOptions {
  /** Enable SIMD optimizations where available */
  simdOptimizations?: boolean
  /** Maximum memory in MB (default: 256MB) */
  maxMemoryMB?: number
  /** Initial memory in MB (default: 64MB) */
  initialMemoryMB?: number
}

/** Base interface for all GMP number types */
export interface GMPNumber {
  /** Pointer to the internal GMP structure */
  readonly ptr: number
  /** Whether this number has been cleared (freed) */
  readonly isCleared: boolean
}

/** Multiple precision integer (mpz_t) */
export interface MPZInteger extends GMPNumber {
  /** Set this integer from another integer */
  set(other: MPZInteger): void
  /** Set this integer from an unsigned long */
  setUnsigned(value: number): void
  /** Set this integer from a signed long */
  setSigned(value: number): void
  /** Set this integer from a string representation */
  setString(str: string, base?: number): boolean

  /** Get this integer as an unsigned long */
  getUnsigned(): number
  /** Get this integer as a signed long */
  getSigned(): number
  /** Get this integer as a string representation */
  getString(base?: number): string

  /** Add two integers: this = a + b */
  add(a: MPZInteger, b: MPZInteger): void
  /** Subtract two integers: this = a - b */
  subtract(a: MPZInteger, b: MPZInteger): void
  /** Multiply two integers: this = a * b */
  multiply(a: MPZInteger, b: MPZInteger): void
  /** Divide two integers: this = a / b (truncated) */
  divide(a: MPZInteger, b: MPZInteger): void
  /** Remainder: this = a % b */
  remainder(a: MPZInteger, b: MPZInteger): void

  /** Compare with another integer */
  compare(other: MPZInteger): number
  /** Compare with unsigned long */
  compareUnsigned(value: number): number
  /** Compare with signed long */
  compareSigned(value: number): number

  /** Set to absolute value of another integer */
  abs(other: MPZInteger): void
  /** Set to negative of another integer */
  negate(other: MPZInteger): void
  /** Set to GCD of two integers */
  gcd(a: MPZInteger, b: MPZInteger): void
  /** Set to base^exp */
  power(base: MPZInteger, exp: number): void

  /** Bitwise AND */
  and(a: MPZInteger, b: MPZInteger): void
  /** Bitwise OR */
  or(a: MPZInteger, b: MPZInteger): void
  /** Bitwise XOR */
  xor(a: MPZInteger, b: MPZInteger): void

  /** Get size in limbs */
  size(): number

  /** Free the memory used by this integer */
  clear(): void
}

/** Multiple precision rational (mpq_t) */
export interface MPQRational extends GMPNumber {
  /** Set this rational from another rational */
  set(other: MPQRational): void

  /** Add two rationals: this = a + b */
  add(a: MPQRational, b: MPQRational): void
  /** Multiply two rationals: this = a * b */
  multiply(a: MPQRational, b: MPQRational): void

  /** Canonicalize (reduce to lowest terms) */
  canonicalize(): void

  /** Free the memory used by this rational */
  clear(): void
}

/** Arithmetic operation result with performance metrics */
export interface ArithmeticResult {
  /** Whether the operation succeeded */
  success: boolean
  /** Result as string if applicable */
  result?: string
  /** Execution time in milliseconds */
  executionTimeMs: number
  /** Whether SIMD was used */
  simdUsed: boolean
  /** Memory used in bytes */
  memoryUsed?: number
}

/** Performance benchmark result */
export interface BenchmarkResult {
  /** Operation name */
  operation: string
  /** Throughput in operations per second */
  opsPerSecond: number
  /** Average execution time in milliseconds */
  avgTimeMs: number
  /** Whether SIMD was utilized */
  simdUtilized: boolean
  /** Input size or complexity metric */
  inputSize: number
}

/** SIMD capabilities information */
export interface SIMDCapabilities {
  /** Whether SIMD is supported */
  supported: boolean
  /** Whether SIMD test passed */
  tested: boolean
  /** Detailed capability information */
  info: string
}

/** SIMD performance comparison result */
export interface SIMDPerformanceResult {
  /** Operation name */
  operation: string
  /** Scalar execution time in milliseconds */
  scalarTimeMs: number
  /** SIMD execution time in milliseconds */
  simdTimeMs: number
  /** Performance speedup ratio (scalar/simd) */
  speedup: number
  /** Throughput in MB/s */
  throughputMBps: number
}

/** Module factory type from Emscripten */
export interface GMPModuleFactory {
  (options?: {
    wasmBinary?: ArrayBuffer
    locateFile?: (path: string) => string
  }): Promise<GMPModule>
}

/** Internal Emscripten module interface */
export interface GMPModule {
  // Emscripten runtime methods
  cwrap: (name: string, returnType: string, argTypes: string[]) => Function
  ccall: (name: string, returnType: string, argTypes: string[], args: any[]) => any
  UTF8ToString: (ptr: number) => string
  stringToUTF8: (str: string, ptr: number, maxBytes: number) => void
  lengthBytesUTF8: (str: string) => number
  HEAPU8: Uint8Array
  getValue: (ptr: number, type: string) => number
  setValue: (ptr: number, value: number, type: string) => void

  // Memory management
  _malloc: (size: number) => number
  _free: (ptr: number) => void

  // GMP function wrappers (bound in initialization)
  _gmp_version?: () => number
  _gmp_malloc?: (size: number) => number
  _gmp_free?: (ptr: number) => void
  _gmp_mpz_init?: (ptr: number) => void
  _gmp_mpz_clear?: (ptr: number) => void
  _gmp_mpz_add?: (rop: number, op1: number, op2: number) => void
  // ... other GMP functions as needed
}

/** Error types for GMP operations */
export class GMPError extends Error {
  constructor(message: string, public readonly operation?: string) {
    super(message)
    this.name = 'GMPError'
  }
}

export class GMPInitializationError extends GMPError {
  constructor(message: string) {
    super(message, 'initialization')
    this.name = 'GMPInitializationError'
  }
}

export class GMPArithmeticError extends GMPError {
  constructor(message: string, operation: string) {
    super(message, operation)
    this.name = 'GMPArithmeticError'
  }
}

export class GMPMemoryError extends GMPError {
  constructor(message: string) {
    super(message, 'memory')
    this.name = 'GMPMemoryError'
  }
}