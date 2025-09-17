#!/bin/bash
# build-dual.sh - Dual build system for gmp.wasm
#
# Copyright (c) 1991, 1996, 1999, 2000, 2007 Free Software Foundation, Inc.
# Copyright (c) 2025 Superstruct Ltd, New Zealand
# Licensed under LGPL-3.0

set -euo pipefail

VARIANT="${1:-all}"
BUILD_DIR="${BUILD_DIR:-./build-dual}"
INSTALL_PREFIX="${INSTALL_PREFIX:-./install}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check prerequisites
check_prerequisites() {
    log_info "Checking build prerequisites..."

    if ! command -v emcc &> /dev/null; then
        log_error "Emscripten not found. Please install and activate EMSDK."
        exit 1
    fi

    # Verify Emscripten version
    local emcc_version=$(emcc --version | head -n1 | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+')
    log_info "Using Emscripten version: $emcc_version"

    log_success "Prerequisites check completed"
}

# Build SIDE_MODULE (production) using mini-gmp
build_side_module() {
    log_info "Building gmp-side.wasm using mini-gmp for production..."
    mkdir -p "${BUILD_DIR}-side"
    cd "${BUILD_DIR}-side"

    # Core mini-gmp sources
    SOURCES="../mini-gmp/mini-gmp.c ../mini-gmp/mini-mpq.c"

    # WASM wrapper with exported functions
    cat > gmp_wasm_side.c << 'EOF'
/*
 * GMP WebAssembly SIDE_MODULE wrapper
 * Copyright (c) 2025 Superstruct Ltd, New Zealand
 * Licensed under LGPL-3.0
 */

#include "../mini-gmp/mini-gmp.h"
#include "../mini-gmp/mini-mpq.h"
#include <emscripten.h>
#include <stdlib.h>
#include <string.h>

// Memory management wrappers
EMSCRIPTEN_KEEPALIVE
void* gmp_malloc(size_t size) {
    return malloc(size);
}

EMSCRIPTEN_KEEPALIVE
void gmp_free(void* ptr) {
    free(ptr);
}

// String conversion helpers
EMSCRIPTEN_KEEPALIVE
char* gmp_mpz_get_str_wrapper(int base, mpz_t op) {
    return mpz_get_str(NULL, base, op);
}

EMSCRIPTEN_KEEPALIVE
int gmp_mpz_set_str_wrapper(mpz_t rop, const char* str, int base) {
    return mpz_set_str(rop, str, base);
}

// Export key functions with C-style names for dlsym
EMSCRIPTEN_KEEPALIVE void gmp_mpz_init(mpz_t x) { mpz_init(x); }
EMSCRIPTEN_KEEPALIVE void gmp_mpz_clear(mpz_t x) { mpz_clear(x); }
EMSCRIPTEN_KEEPALIVE void gmp_mpz_set(mpz_t rop, const mpz_t op) { mpz_set(rop, op); }
EMSCRIPTEN_KEEPALIVE void gmp_mpz_set_ui(mpz_t rop, unsigned long op) { mpz_set_ui(rop, op); }
EMSCRIPTEN_KEEPALIVE void gmp_mpz_set_si(mpz_t rop, signed long op) { mpz_set_si(rop, op); }

// Arithmetic operations
EMSCRIPTEN_KEEPALIVE void gmp_mpz_add(mpz_t rop, const mpz_t op1, const mpz_t op2) { mpz_add(rop, op1, op2); }
EMSCRIPTEN_KEEPALIVE void gmp_mpz_sub(mpz_t rop, const mpz_t op1, const mpz_t op2) { mpz_sub(rop, op1, op2); }
EMSCRIPTEN_KEEPALIVE void gmp_mpz_mul(mpz_t rop, const mpz_t op1, const mpz_t op2) { mpz_mul(rop, op1, op2); }
EMSCRIPTEN_KEEPALIVE void gmp_mpz_tdiv_q(mpz_t q, const mpz_t n, const mpz_t d) { mpz_tdiv_q(q, n, d); }
EMSCRIPTEN_KEEPALIVE void gmp_mpz_tdiv_r(mpz_t r, const mpz_t n, const mpz_t d) { mpz_tdiv_r(r, n, d); }

// Comparison operations
EMSCRIPTEN_KEEPALIVE int gmp_mpz_cmp(const mpz_t op1, const mpz_t op2) { return mpz_cmp(op1, op2); }
EMSCRIPTEN_KEEPALIVE int gmp_mpz_cmp_ui(const mpz_t op1, unsigned long op2) { return mpz_cmp_ui(op1, op2); }
EMSCRIPTEN_KEEPALIVE int gmp_mpz_cmp_si(const mpz_t op1, signed long op2) { return mpz_cmp_si(op1, op2); }

// Mathematical functions
EMSCRIPTEN_KEEPALIVE void gmp_mpz_abs(mpz_t rop, const mpz_t op) { mpz_abs(rop, op); }
EMSCRIPTEN_KEEPALIVE void gmp_mpz_neg(mpz_t rop, const mpz_t op) { mpz_neg(rop, op); }
EMSCRIPTEN_KEEPALIVE void gmp_mpz_gcd(mpz_t rop, const mpz_t op1, const mpz_t op2) { mpz_gcd(rop, op1, op2); }
EMSCRIPTEN_KEEPALIVE void gmp_mpz_pow_ui(mpz_t rop, const mpz_t base, unsigned long exp) { mpz_pow_ui(rop, base, exp); }

// Bitwise operations
EMSCRIPTEN_KEEPALIVE void gmp_mpz_and(mpz_t rop, const mpz_t op1, const mpz_t op2) { mpz_and(rop, op1, op2); }
EMSCRIPTEN_KEEPALIVE void gmp_mpz_ior(mpz_t rop, const mpz_t op1, const mpz_t op2) { mpz_ior(rop, op1, op2); }
EMSCRIPTEN_KEEPALIVE void gmp_mpz_xor(mpz_t rop, const mpz_t op1, const mpz_t op2) { mpz_xor(rop, op1, op2); }

// Size and conversion functions
EMSCRIPTEN_KEEPALIVE size_t gmp_mpz_size(const mpz_t op) { return mpz_size(op); }
EMSCRIPTEN_KEEPALIVE unsigned long gmp_mpz_get_ui(const mpz_t op) { return mpz_get_ui(op); }
EMSCRIPTEN_KEEPALIVE signed long gmp_mpz_get_si(const mpz_t op) { return mpz_get_si(op); }

// Rational number functions (mpq)
EMSCRIPTEN_KEEPALIVE void gmp_mpq_init(mpq_t x) { mpq_init(x); }
EMSCRIPTEN_KEEPALIVE void gmp_mpq_clear(mpq_t x) { mpq_clear(x); }
EMSCRIPTEN_KEEPALIVE void gmp_mpq_set(mpq_t rop, const mpq_t op) { mpq_set(rop, op); }
EMSCRIPTEN_KEEPALIVE void gmp_mpq_add(mpq_t rop, const mpq_t op1, const mpq_t op2) { mpq_add(rop, op1, op2); }
EMSCRIPTEN_KEEPALIVE void gmp_mpq_mul(mpq_t rop, const mpq_t op1, const mpq_t op2) { mpq_mul(rop, op1, op2); }
EMSCRIPTEN_KEEPALIVE void gmp_mpq_canonicalize(mpq_t op) { mpq_canonicalize(op); }
EOF

    # Build SIDE_MODULE with SIMD support
    emcc ${SOURCES} gmp_wasm_side.c ../src/wasm_simd.c \
        -I../mini-gmp -I../src \
        -O3 -flto -msimd128 \
        -sSIDE_MODULE=2 \
        -sSTANDALONE_WASM=1 \
        -DGMP_WASM_SIMD=1 \
        -sEXPORTED_FUNCTIONS='["_gmp_malloc","_gmp_free","_gmp_mpz_init","_gmp_mpz_clear","_gmp_mpz_set","_gmp_mpz_set_ui","_gmp_mpz_set_si","_gmp_mpz_add","_gmp_mpz_sub","_gmp_mpz_mul","_gmp_mpz_tdiv_q","_gmp_mpz_tdiv_r","_gmp_mpz_cmp","_gmp_mpz_cmp_ui","_gmp_mpz_cmp_si","_gmp_mpz_abs","_gmp_mpz_neg","_gmp_mpz_gcd","_gmp_mpz_pow_ui","_gmp_mpz_and","_gmp_mpz_ior","_gmp_mpz_xor","_gmp_mpz_size","_gmp_mpz_get_ui","_gmp_mpz_get_si","_gmp_mpz_get_str_wrapper","_gmp_mpz_set_str_wrapper","_gmp_mpq_init","_gmp_mpq_clear","_gmp_mpq_set","_gmp_mpq_add","_gmp_mpq_mul","_gmp_mpq_canonicalize","_gmp_simd_memcmp","_gmp_simd_memcpy","_gmp_simd_is_zero","_gmp_simd_find_char","_gmp_simd_validate_digits","_gmp_simd_test","_gmp_simd_info"]' \
        -o gmp-side.wasm

    # Install artifacts
    mkdir -p "${INSTALL_PREFIX}/wasm"
    cp gmp-side.wasm "${INSTALL_PREFIX}/wasm/"

    # Get file size
    local size=$(stat -f%z gmp-side.wasm 2>/dev/null || stat -c%s gmp-side.wasm)
    log_success "SIDE_MODULE: ${INSTALL_PREFIX}/wasm/gmp-side.wasm ($(numfmt --to=iec $size))"
    cd ..
}

# Build MAIN_MODULE (testing/NPM) using mini-gmp
build_main_module() {
    log_info "Building gmp-main.js using mini-gmp for testing..."
    mkdir -p "${BUILD_DIR}-main"
    cd "${BUILD_DIR}-main"

    # Core mini-gmp sources
    SOURCES="../mini-gmp/mini-gmp.c ../mini-gmp/mini-mpq.c"

    # WASM wrapper with exported functions for MAIN_MODULE
    cat > gmp_wasm_main.c << 'EOF'
/*
 * GMP WebAssembly MAIN_MODULE wrapper
 * Copyright (c) 2025 Superstruct Ltd, New Zealand
 * Licensed under LGPL-3.0
 */

#include "../mini-gmp/mini-gmp.h"
#include "../mini-gmp/mini-mpq.h"
#include <emscripten.h>
#include <stdlib.h>
#include <string.h>

// Version information
EMSCRIPTEN_KEEPALIVE
const char* gmp_version() {
    return "6.3.0-mini-wasm";
}

// Memory management wrappers
EMSCRIPTEN_KEEPALIVE
void* gmp_malloc(size_t size) {
    return malloc(size);
}

EMSCRIPTEN_KEEPALIVE
void gmp_free(void* ptr) {
    free(ptr);
}

// String conversion helpers
EMSCRIPTEN_KEEPALIVE
char* gmp_mpz_get_str_wrapper(int base, mpz_t op) {
    return mpz_get_str(NULL, base, op);
}

EMSCRIPTEN_KEEPALIVE
int gmp_mpz_set_str_wrapper(mpz_t rop, const char* str, int base) {
    return mpz_set_str(rop, str, base);
}

// Export all mini-gmp functions with direct access
EMSCRIPTEN_KEEPALIVE void gmp_mpz_init(mpz_t x) { mpz_init(x); }
EMSCRIPTEN_KEEPALIVE void gmp_mpz_clear(mpz_t x) { mpz_clear(x); }
EMSCRIPTEN_KEEPALIVE void gmp_mpz_set(mpz_t rop, const mpz_t op) { mpz_set(rop, op); }
EMSCRIPTEN_KEEPALIVE void gmp_mpz_set_ui(mpz_t rop, unsigned long op) { mpz_set_ui(rop, op); }
EMSCRIPTEN_KEEPALIVE void gmp_mpz_set_si(mpz_t rop, signed long op) { mpz_set_si(rop, op); }

// Arithmetic operations
EMSCRIPTEN_KEEPALIVE void gmp_mpz_add(mpz_t rop, const mpz_t op1, const mpz_t op2) { mpz_add(rop, op1, op2); }
EMSCRIPTEN_KEEPALIVE void gmp_mpz_sub(mpz_t rop, const mpz_t op1, const mpz_t op2) { mpz_sub(rop, op1, op2); }
EMSCRIPTEN_KEEPALIVE void gmp_mpz_mul(mpz_t rop, const mpz_t op1, const mpz_t op2) { mpz_mul(rop, op1, op2); }
EMSCRIPTEN_KEEPALIVE void gmp_mpz_tdiv_q(mpz_t q, const mpz_t n, const mpz_t d) { mpz_tdiv_q(q, n, d); }
EMSCRIPTEN_KEEPALIVE void gmp_mpz_tdiv_r(mpz_t r, const mpz_t n, const mpz_t d) { mpz_tdiv_r(r, n, d); }

// Comparison operations
EMSCRIPTEN_KEEPALIVE int gmp_mpz_cmp(const mpz_t op1, const mpz_t op2) { return mpz_cmp(op1, op2); }
EMSCRIPTEN_KEEPALIVE int gmp_mpz_cmp_ui(const mpz_t op1, unsigned long op2) { return mpz_cmp_ui(op1, op2); }
EMSCRIPTEN_KEEPALIVE int gmp_mpz_cmp_si(const mpz_t op1, signed long op2) { return mpz_cmp_si(op1, op2); }

// Mathematical functions
EMSCRIPTEN_KEEPALIVE void gmp_mpz_abs(mpz_t rop, const mpz_t op) { mpz_abs(rop, op); }
EMSCRIPTEN_KEEPALIVE void gmp_mpz_neg(mpz_t rop, const mpz_t op) { mpz_neg(rop, op); }
EMSCRIPTEN_KEEPALIVE void gmp_mpz_gcd(mpz_t rop, const mpz_t op1, const mpz_t op2) { mpz_gcd(rop, op1, op2); }
EMSCRIPTEN_KEEPALIVE void gmp_mpz_pow_ui(mpz_t rop, const mpz_t base, unsigned long exp) { mpz_pow_ui(rop, base, exp); }

// Bitwise operations
EMSCRIPTEN_KEEPALIVE void gmp_mpz_and(mpz_t rop, const mpz_t op1, const mpz_t op2) { mpz_and(rop, op1, op2); }
EMSCRIPTEN_KEEPALIVE void gmp_mpz_ior(mpz_t rop, const mpz_t op1, const mpz_t op2) { mpz_ior(rop, op1, op2); }
EMSCRIPTEN_KEEPALIVE void gmp_mpz_xor(mpz_t rop, const mpz_t op1, const mpz_t op2) { mpz_xor(rop, op1, op2); }

// Size and conversion functions
EMSCRIPTEN_KEEPALIVE size_t gmp_mpz_size(const mpz_t op) { return mpz_size(op); }
EMSCRIPTEN_KEEPALIVE unsigned long gmp_mpz_get_ui(const mpz_t op) { return mpz_get_ui(op); }
EMSCRIPTEN_KEEPALIVE signed long gmp_mpz_get_si(const mpz_t op) { return mpz_get_si(op); }

// Rational number functions (mpq)
EMSCRIPTEN_KEEPALIVE void gmp_mpq_init(mpq_t x) { mpq_init(x); }
EMSCRIPTEN_KEEPALIVE void gmp_mpq_clear(mpq_t x) { mpq_clear(x); }
EMSCRIPTEN_KEEPALIVE void gmp_mpq_set(mpq_t rop, const mpq_t op) { mpq_set(rop, op); }
EMSCRIPTEN_KEEPALIVE void gmp_mpq_add(mpq_t rop, const mpq_t op1, const mpq_t op2) { mpq_add(rop, op1, op2); }
EMSCRIPTEN_KEEPALIVE void gmp_mpq_mul(mpq_t rop, const mpq_t op1, const mpq_t op2) { mpq_mul(rop, op1, op2); }
EMSCRIPTEN_KEEPALIVE void gmp_mpq_canonicalize(mpq_t op) { mpq_canonicalize(op); }

// Advanced functions for demonstration
EMSCRIPTEN_KEEPALIVE
void gmp_demo_fibonacci(mpz_t result, unsigned long n) {
    if (n <= 1) {
        mpz_set_ui(result, n);
        return;
    }

    mpz_t a, b, temp;
    mpz_init_set_ui(a, 0);
    mpz_init_set_ui(b, 1);
    mpz_init(temp);

    for (unsigned long i = 2; i <= n; i++) {
        mpz_add(temp, a, b);
        mpz_set(a, b);
        mpz_set(b, temp);
    }

    mpz_set(result, b);
    mpz_clear(a);
    mpz_clear(b);
    mpz_clear(temp);
}

EMSCRIPTEN_KEEPALIVE
void gmp_demo_factorial(mpz_t result, unsigned long n) {
    mpz_set_ui(result, 1);
    for (unsigned long i = 2; i <= n; i++) {
        mpz_mul_ui(result, result, i);
    }
}

// Simple SIMD test function directly in main wrapper
EMSCRIPTEN_KEEPALIVE
int gmp_simd_test_inline() {
#ifdef __wasm_simd128__
    return 1; // SIMD supported at compile time
#else
    return 0; // No SIMD support
#endif
}
EOF

    # Build MAIN_MODULE with SIMD support
    emcc ${SOURCES} gmp_wasm_main.c ../src/wasm_simd.c \
        -I../mini-gmp -I../src \
        -O3 -flto -msimd128 \
        -sMODULARIZE=1 \
        -sEXPORT_ES6=1 \
        -sEXPORT_NAME="GMPModule" \
        -DGMP_WASM_SIMD=1 \
        -sEXPORTED_FUNCTIONS='["_gmp_version","_gmp_malloc","_gmp_free","_gmp_mpz_init","_gmp_mpz_clear","_gmp_mpz_set","_gmp_mpz_set_ui","_gmp_mpz_set_si","_gmp_mpz_add","_gmp_mpz_sub","_gmp_mpz_mul","_gmp_mpz_tdiv_q","_gmp_mpz_tdiv_r","_gmp_mpz_cmp","_gmp_mpz_cmp_ui","_gmp_mpz_cmp_si","_gmp_mpz_abs","_gmp_mpz_neg","_gmp_mpz_gcd","_gmp_mpz_pow_ui","_gmp_mpz_and","_gmp_mpz_ior","_gmp_mpz_xor","_gmp_mpz_size","_gmp_mpz_get_ui","_gmp_mpz_get_si","_gmp_mpz_get_str_wrapper","_gmp_mpz_set_str_wrapper","_gmp_mpq_init","_gmp_mpq_clear","_gmp_mpq_set","_gmp_mpq_add","_gmp_mpq_mul","_gmp_mpq_canonicalize","_gmp_demo_fibonacci","_gmp_demo_factorial","_gmp_simd_test_inline","_gmp_simd_memcmp","_gmp_simd_memcpy","_gmp_simd_is_zero","_gmp_simd_find_char","_gmp_simd_validate_digits","_gmp_simd_test","_gmp_simd_info","_malloc","_free"]' \
        -sEXPORTED_RUNTIME_METHODS='["cwrap","ccall","UTF8ToString","stringToUTF8","lengthBytesUTF8","HEAPU8","getValue","setValue"]' \
        -sALLOW_MEMORY_GROWTH=1 \
        -sINITIAL_MEMORY=67108864 \
        -sMAXIMUM_MEMORY=536870912 \
        -o gmp-main.js

    # Install artifacts
    mkdir -p "${INSTALL_PREFIX}/wasm"
    cp gmp-main.js "${INSTALL_PREFIX}/wasm/"
    cp gmp-main.wasm "${INSTALL_PREFIX}/wasm/"

    # Get file sizes
    local js_size=$(stat -f%z gmp-main.js 2>/dev/null || stat -c%s gmp-main.js)
    local wasm_size=$(stat -f%z gmp-main.wasm 2>/dev/null || stat -c%s gmp-main.wasm)
    log_success "MAIN_MODULE: ${INSTALL_PREFIX}/wasm/gmp-main.js ($(numfmt --to=iec $js_size)), gmp-main.wasm ($(numfmt --to=iec $wasm_size))"
    cd ..
}

# Clean build artifacts
clean_build() {
    log_info "Cleaning build artifacts..."
    rm -rf "${BUILD_DIR}"*
    rm -rf "${INSTALL_PREFIX}"
    log_success "Clean completed"
}

# Main execution
case "$VARIANT" in
    side)
        check_prerequisites
        build_side_module
        ;;
    main)
        check_prerequisites
        build_main_module
        ;;
    all)
        check_prerequisites
        build_side_module
        build_main_module
        ;;
    clean)
        clean_build
        ;;
    *)
        echo "Usage: $0 [side|main|all|clean]"
        echo ""
        echo "  side  - Build SIDE_MODULE for production (gmp-side.wasm)"
        echo "  main  - Build MAIN_MODULE for testing (gmp-main.js + gmp-main.wasm)"
        echo "  all   - Build both SIDE_MODULE and MAIN_MODULE"
        echo "  clean - Clean all build artifacts"
        exit 1
        ;;
esac

log_success "Build completed successfully!"