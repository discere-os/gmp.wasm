# @discere-os/gmp.wasm

WebAssembly port of GMP (GNU Multiple Precision Arithmetic Library) - High-performance arbitrary precision arithmetic library with SIMD optimizations for integers, rationals, and floating-point numbers.

[![CI/CD](https://github.com/discere-os/discere-nucleus/actions/workflows/gmp-wasm-ci.yml/badge.svg)](https://github.com/discere-os/discere-nucleus/actions)
[![JSR](https://jsr.io/badges/@discere-os/gmp.wasm)](https://jsr.io/@discere-os/gmp.wasm)
[![npm version](https://badge.fury.io/js/@discere-os%2Fgmp.wasm.svg)](https://badge.fury.io/js/@discere-os%2Fgmp.wasm)
[![License](https://img.shields.io/badge/License-LGPL--3.0-blue.svg)](COPYING.LESSERv3)
[![Status](https://img.shields.io/badge/status-alpha-orange.svg)](https://github.com/discere-os/discere-nucleus)

## About GNU MP

GNU MP is a library for arbitrary precision arithmetic, operating on signed integers, rational numbers, and floating point numbers. It has a rich set of functions, and the functions have a regular interface.

GNU MP is designed to be as fast as possible, both for small operands and huge operands. The speed is achieved by using fullwords as the basic arithmetic type, by using fast algorithms, with carefully optimized assembly code for the most common inner loops for lots of CPUs, and by a general emphasis on speed (instead of simplicity or elegance).

GNU MP is believed to be faster than any other similar library. Its advantage increases with operand sizes for certain operations, since GNU MP in many cases has asymptotically faster algorithms.

## Overview of GNU MP

There are four classes of functions in GNU MP:

1. **Signed integer arithmetic functions (mpz)** - These functions are intended to be easy to use, with their regular interface. The associated type is `mpz_t`.

2. **Rational arithmetic functions (mpq)** - For now, just a small set of functions necessary for basic rational arithmetics. The associated type is `mpq_t`.

3. **Floating-point arithmetic functions (mpf)** - If the C type `double` doesn't give enough precision for your application, declare your variables as `mpf_t` instead, set the precision to any number desired, and call the functions in the mpf class for the arithmetic operations.

4. **Positive-integer, hard-to-use, very low overhead functions** - These are in the mpn class. No memory management is performed. The caller must ensure enough space is available for the results. The set of functions is not regular, nor is the calling interface.

## Features

- **Arbitrary Precision Arithmetic**: Work with numbers of any size, limited only by available memory
- **Multiple Number Types**: Integers (mpz), rationals (mpq), and floating-point (mpf)
- **WebAssembly Optimized**: Compiled with Emscripten for browser and Node.js compatibility
- **SIMD Enhanced**: Leverages WebAssembly SIMD for vectorized operations where applicable
- **TypeScript API**: Complete type-safe wrapper with modern async/await patterns
- **Memory Efficient**: Optimized memory management for web environments

## Quick Start

```bash
# Install via npm
npm install @discere-os/gmp.wasm

# Or use with Deno
import GMP from "https://deno.land/x/gmp_wasm/mod.ts"
```

## Usage

```typescript
import GMP from '@discere-os/gmp.wasm'

const gmp = new GMP()
await gmp.initialize()

// Create arbitrary precision integers
const a = gmp.mpz_init_set_str("12345678901234567890", 10)
const b = gmp.mpz_init_set_str("98765432109876543210", 10)
const result = gmp.mpz_init()

// Perform multiplication
gmp.mpz_mul(result, a, b)

// Get result as string
const resultString = gmp.mpz_get_str(null, 10, result)
console.log(`Result: ${resultString}`)

// Clean up memory
gmp.mpz_clear(a)
gmp.mpz_clear(b)
gmp.mpz_clear(result)
```

## API Categories

### Integer Functions (mpz)
- Basic arithmetic: add, subtract, multiply, divide
- Modular arithmetic: modular exponentiation, GCD, LCM
- Number theory: primality testing, factorization
- Bit operations: AND, OR, XOR, shifts

### Rational Functions (mpq)
- Rational number arithmetic with automatic simplification
- Conversion between rationals and other number types
- Comparison and ordering operations

### Floating Point Functions (mpf)
- Arbitrary precision floating-point arithmetic
- Configurable precision (default, or set to any desired level)
- Mathematical functions: square root, power, etc.

### Low-Level Functions (mpn)
- Direct limb manipulation for maximum performance
- Memory management handled by caller
- Optimized for specific use cases requiring minimal overhead

## Performance

This WebAssembly port maintains GMP's performance characteristics:
- **Asymptotically Fast Algorithms**: Karatsuba and Toom multiplication, FFT for very large numbers
- **SIMD Optimization**: Vectorized operations for array processing
- **Memory Efficient**: Minimal allocation overhead
- **Cache Friendly**: Algorithms optimized for modern CPU architectures

## License

GNU MP is free software and may be freely copied under the terms of either:
- The GNU Lesser General Public License as published by the Free Software Foundation; either version 3 of the License, or (at your option) any later version.
- The GNU General Public License as published by the Free Software Foundation; either version 2 of the License, or (at your option) any later version.

See the `COPYING*` files for complete license terms.

## 💖 Support This Work

This WebAssembly port is part of a larger effort to bring professional desktop applications to browsers with native performance.

**👨‍💻 About the Maintainer**: [Isaac Johnston (@superstructor)](https://github.com/superstructor) - Building foundational browser-native computing infrastructure through systematic C/C++ to WebAssembly porting.

**📊 Impact**: 70+ open source WASM libraries enabling professional applications like Blender, GIMP, and scientific computing tools to run natively in browsers.

**🚀 Your Support Enables**:
- Continued maintenance and updates
- Performance optimizations
- New library ports and integrations
- Documentation and tutorials
- Cross-browser compatibility testing

**[💖 Sponsor this work](https://github.com/sponsors/superstructor)** to help build the future of browser-native computing.