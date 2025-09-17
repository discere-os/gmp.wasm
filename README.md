# @discere-os/gmp.wasm

High-performance WebAssembly port of GMP (GNU Multiple Precision Arithmetic Library) using mini-gmp with SIMD optimizations and Deno-first development.

[![Build Status](https://github.com/discere-os/discere-nucleus/actions/workflows/gmp-wasm-ci.yml/badge.svg)](https://github.com/discere-os/discere-nucleus/actions)
[![Deno](https://jsr.io/badges/@discere-os/gmp.wasm)](https://jsr.io/@discere-os/gmp.wasm)
[![npm](https://badge.fury.io/js/@discere-os%2Fgmp.wasm.svg)](https://www.npmjs.com/package/@discere-os/gmp.wasm)
[![License: LGPL-3.0](https://img.shields.io/badge/License-LGPL--3.0-blue.svg)](COPYING.LESSERv3)

## Features

- **🚀 High Performance**: Nanosecond-level operations for basic arithmetic
- **📐 Arbitrary Precision**: Work with numbers of any size, limited only by memory
- **🧮 Complete API**: Integers (mpz), rationals (mpq), with full GMP compatibility
- **🦕 Deno-First**: Direct TypeScript execution, zero build steps for development
- **⚡ SIMD Optimized**: Vectorized operations where applicable
- **🌐 Dual Architecture**: SIDE_MODULE (76KB) + MAIN_MODULE (59KB) builds
- **🔧 Type-Safe**: Complete TypeScript definitions with error handling
- **🎯 Browser Native**: Optimized for Chrome/Edge 113+ (WebGPU capable browsers)

## Performance Highlights

Based on benchmarks on Intel i9-14900HX:

| Operation | Time | Throughput |
|-----------|------|------------|
| Integer creation/cleanup | **202ns** | 4.9M ops/sec |
| Small arithmetic (32-bit) | **217ns** | 4.6M ops/sec |
| Large multiplication (256-bit) | **1.3µs** | 769K ops/sec |
| String conversions | **3.5µs** | 285K ops/sec |
| Mathematical functions | **909ns** | 1.1M ops/sec |

## Quick Start

### Deno (Recommended)

```typescript
import GMP from "https://deno.land/x/gmp_wasm/mod.ts"

const gmp = new GMP()
await gmp.initialize()

// Create arbitrary precision integers
const a = gmp.mpz()
const b = gmp.mpz()
const result = gmp.mpz()

a.setString("12345678901234567890123456789012345678901234567890")
b.setString("98765432109876543210987654321098765432109876543210")

result.multiply(a, b)
console.log(`Result: ${result.getString()}`)

// Clean up
a.clear()
b.clear()
result.clear()
gmp.cleanup()
```

### Browser/NPM

```bash
npm install @discere-os/gmp.wasm
```

```typescript
import GMP from '@discere-os/gmp.wasm'

const gmp = new GMP()
await gmp.initialize()
// ... same API as above
```

### Running the Demo

```bash
# Clone the repository
git clone https://github.com/discere-os/discere-nucleus
cd discere-nucleus/client/emscripten/gmp.wasm

# Run comprehensive demo
deno task demo

# Run simple demo
deno task demo:simple

# Run tests
deno task test

# Run benchmarks
deno task bench
```

## API Reference

### Initialization

```typescript
const gmp = new GMP({
  simdOptimizations: true,  // Enable SIMD (default: true)
  maxMemoryMB: 256,        // Maximum memory (default: 256MB)
  initialMemoryMB: 64      // Initial memory (default: 64MB)
})

await gmp.initialize()
```

### Integer Operations (MPZ)

#### Creation and Basic Operations

```typescript
const num = gmp.mpz()

// Set values
num.setUnsigned(42)
num.setSigned(-123)
num.setString("123456789012345678901234567890")
num.setString("DEADBEEF", 16)  // Hexadecimal

// Get values
const unsigned = num.getUnsigned()
const signed = num.getSigned()
const decimal = num.getString()     // Base 10
const hex = num.getString(16)       // Hexadecimal
const binary = num.getString(2)     // Binary

// Copy
const copy = gmp.mpz()
copy.set(num)

// Always clean up!
num.clear()
copy.clear()
```

#### Arithmetic Operations

```typescript
const a = gmp.mpz()
const b = gmp.mpz()
const result = gmp.mpz()

a.setString("999999999999999999999999999999")
b.setString("111111111111111111111111111111")

result.add(a, b)        // Addition
result.subtract(a, b)   // Subtraction
result.multiply(a, b)   // Multiplication
result.divide(a, b)     // Division (truncated)
result.remainder(a, b)  // Remainder

// Cleanup
a.clear()
b.clear()
result.clear()
```

#### Mathematical Functions

```typescript
const num = gmp.mpz()
const result = gmp.mpz()

num.setSigned(-42)
result.abs(num)         // Absolute value
result.negate(num)      // Negation

// GCD
const a = gmp.mpz()
const b = gmp.mpz()
a.setUnsigned(1071)
b.setUnsigned(462)
result.gcd(a, b)        // Result: 21

// Power
const base = gmp.mpz()
base.setUnsigned(2)
result.power(base, 100) // 2^100

// Cleanup
num.clear()
result.clear()
a.clear()
b.clear()
base.clear()
```

#### Bitwise Operations

```typescript
const a = gmp.mpz()
const b = gmp.mpz()
const result = gmp.mpz()

a.setUnsigned(0xAAAA)
b.setUnsigned(0x5555)

result.and(a, b)        // Bitwise AND
result.or(a, b)         // Bitwise OR
result.xor(a, b)        // Bitwise XOR

// Cleanup
a.clear()
b.clear()
result.clear()
```

#### Comparison Operations

```typescript
const a = gmp.mpz()
const b = gmp.mpz()

a.setString("123456789012345678901234567890")
b.setString("123456789012345678901234567891")

const cmp = a.compare(b)        // Returns -1, 0, or 1
const cmpUi = a.compareUnsigned(12345)
const cmpSi = a.compareSigned(-54321)

if (cmp < 0) console.log("a < b")
else if (cmp > 0) console.log("a > b")
else console.log("a = b")

// Cleanup
a.clear()
b.clear()
```

### Rational Operations (MPQ)

```typescript
const r1 = gmp.mpq()
const r2 = gmp.mpq()
const result = gmp.mpq()

result.add(r1, r2)      // Addition
result.multiply(r1, r2) // Multiplication
result.canonicalize()   // Reduce to lowest terms

// Cleanup
r1.clear()
r2.clear()
result.clear()
```

### Utility Functions

```typescript
// Check if initialized
if (gmp.isInitialized()) {
  console.log("Ready to compute!")
}

// Get version
console.log(`Version: ${gmp.version()}`)

// Performance measurement
const result = await gmp.timedOperation(() => {
  const a = gmp.mpz()
  a.setString("12345678901234567890")
  const str = a.getString()
  a.clear()
  return str
})

console.log(`Success: ${result.success}`)
console.log(`Time: ${result.executionTimeMs}ms`)
console.log(`Result: ${result.result}`)

// Convenience functions
const fib = await gmp.fibonacci(100)
const fact = await gmp.factorial(50)
```

## Building from Source

### Prerequisites

- [Deno](https://deno.land/) (latest stable)
- [Emscripten](https://emscripten.org/) 4.0.14+

### Build Commands

```bash
# Build both WASM modules
deno task build:wasm

# Build just SIDE_MODULE (production)
deno task build:side

# Build just MAIN_MODULE (testing)
deno task build:main

# Build NPM package
deno task build:npm

# Clean artifacts
deno task clean
```

### Development Commands

```bash
# Run demos
deno task demo
deno task demo:simple

# Run tests
deno task test
deno task test:basic

# Run benchmarks
deno task bench

# Format code
deno task fmt

# Lint code
deno task lint

# Type check
deno task check
```

## Architecture

### Dual Build System

**SIDE_MODULE (Production)**: `gmp-side.wasm` (76KB)
- Dynamically loaded by host applications
- Excludes system libraries (provided by host)
- Optimized for size and performance

**MAIN_MODULE (Testing/NPM)**: `gmp-main.js` + `gmp-main.wasm` (17KB + 42KB)
- Self-contained with all dependencies
- Used for testing, demos, and NPM distribution
- ES6 module with TypeScript bindings

### Mini-GMP Foundation

This port uses [mini-gmp](https://gmplib.org/mini-gmp.html), a lightweight subset of GMP that provides:

- All essential mpz (integer) functions
- Basic mpq (rational) functions
- Same API as full GMP
- Optimized for numbers up to a few hundred bits
- Perfect balance of features vs. size for WebAssembly

### Memory Management

```typescript
// Automatic tracking
const gmp = new GMP()
const num = gmp.mpz()  // Tracked automatically

// Manual cleanup (recommended)
num.clear()

// Batch cleanup
gmp.cleanup()  // Clears all tracked numbers
```

### Error Handling

```typescript
import { GMPError, GMPInitializationError, GMPArithmeticError } from '@discere-os/gmp.wasm'

try {
  const gmp = new GMP()
  await gmp.initialize()

  const num = gmp.mpz()
  num.setString("invalid", 10)  // Returns false for invalid input

} catch (error) {
  if (error instanceof GMPInitializationError) {
    console.error("Failed to initialize GMP:", error.message)
  } else if (error instanceof GMPArithmeticError) {
    console.error("Arithmetic error:", error.message)
  }
}
```

## Browser Compatibility

| Browser | Version | Support |
|---------|---------|---------|
| Chrome | 113+ | ✅ Full support |
| Edge | 113+ | ✅ Full support |
| Chrome Android | 139+ | ✅ Full support |
| Firefox | Latest | ⚠️ Requires WebGPU flag |
| Safari | Latest | ❌ No WebGPU support |

**Note**: This library targets modern browsers with WebGPU support. For maximum compatibility, use Chrome or Edge 113+.

## Performance Optimization Tips

### Memory Management
```typescript
// ❌ Avoid: Creating many temporary numbers
for (let i = 0; i < 1000; i++) {
  const temp = gmp.mpz()  // Creates and tracks 1000 numbers
  // ... operations
  // temp.clear() never called = memory leak
}

// ✅ Better: Reuse numbers
const temp = gmp.mpz()
for (let i = 0; i < 1000; i++) {
  temp.setUnsigned(i)
  // ... operations
}
temp.clear()
```

### String Operations
```typescript
// ❌ Avoid: Repeated string conversions
for (let i = 0; i < 100; i++) {
  const str = num.getString()  // Expensive
}

// ✅ Better: Convert once, reuse
const str = num.getString()
for (let i = 0; i < 100; i++) {
  // Use str
}
```

### Batch Operations
```typescript
// ✅ Group related operations
const a = gmp.mpz()
const b = gmp.mpz()
const result = gmp.mpz()

// Do all operations
result.multiply(a, b)
result.add(result, a)
result.power(result, 2)

// Clean up once
a.clear()
b.clear()
result.clear()
```

## Contributing

This project is part of the larger [Discere OS ecosystem](https://github.com/discere-os/discere-nucleus). Contributions welcome!

### Development Setup

```bash
git clone https://github.com/discere-os/discere-nucleus
cd discere-nucleus/client/emscripten/gmp.wasm

# Install Deno
curl -fsSL https://deno.land/install.sh | sh

# Install Emscripten
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
./emsdk install latest
./emsdk activate latest
source ./emsdk_env.sh

# Build and test
deno task build:wasm
deno task test
deno task demo
```

## License

**GNU MP Library**: LGPL-3.0 (allows dynamic linking)
**WebAssembly Port**: LGPL-3.0 (same as original)

Copyright (c) 1991-2022 Free Software Foundation, Inc.
Copyright (c) 2025 Superstruct Ltd, New Zealand

This library is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser General Public License as published by the Free Software Foundation; either version 3 of the License, or (at your option) any later version.

See [COPYING.LESSERv3](COPYING.LESSERv3) for complete license terms.

## Related Projects

- [GNU MP Library](https://gmplib.org/) - The original arbitrary precision arithmetic library
- [mini-gmp](https://gmplib.org/mini-gmp.html) - Lightweight subset used in this port
- [Discere OS](https://github.com/discere-os/discere-nucleus) - Browser-native learning operating system
- [Emscripten](https://emscripten.org/) - C/C++ to WebAssembly compiler