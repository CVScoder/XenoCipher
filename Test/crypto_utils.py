import hashlib
import hmac
import struct
import math
import os
import sys
import numpy as np

# Add lib to path to import NTRU
sys.path.append(os.path.join(os.path.dirname(__file__), 'lib'))

from ntru.ntrucipher import NtruCipher
from ntru.mathutils import random_poly
from sympy import ZZ, Poly
from sympy.abc import x

# --- Constants from lib ---
KDF_SALT_COMMON = b"MPGeeks-HackersAreUnbeatableBoys"
KDF_LABEL_LFSR_SEED = b"xenocipher-lfsr-seed-v1"
KDF_LABEL_TINKERBELL = b"xenocipher-tinkerbell-v1"
KDF_LABEL_TRANSPOSITION = b"xenocipher-transposition-v1"
KDF_LABEL_HMAC = b"xenocipher-hmac-key-v1"
KDF_LABEL_CHACHA20 = b"xenocipher-chacha20-v1"
KDF_LABEL_SALSA20 = b"xenocipher-salsa20-v1"  # Custom label for Salsa20
KDF_LABEL_MESSAGE_BASE = b"xenocipher-message-keys-v1"

def rotl32(x, n):
    return ((x << n) & 0xFFFFFFFF) | (x >> (32 - n))

# --- HMAC & HKDF ---
def hmac_sha256(key, data):
    return hmac.new(key, data, hashlib.sha256).digest()

def hkdf_extract(salt, ikm):
    if not salt:
        salt = b"\x00" * 32
    return hmac_sha256(salt, ikm)

def hkdf_expand(prk, info, length):
    hash_len = 32
    n = math.ceil(length / hash_len)
    okm = b""
    t = b""
    for i in range(1, n + 1):
        t = hmac_sha256(prk, t + info + bytes([i]))
        okm += t
    return okm[:length]

# --- ChaCha20 Implementation ---
class ChaCha20:
    def __init__(self):
        self.state = [0] * 16
        self.keystream = b""
        self.keystream_pos = 64

    def init(self, key, nonce):
        # constants
        self.state[0] = 0x61707865
        self.state[1] = 0x3320646e
        self.state[2] = 0x79622d32
        self.state[3] = 0x6b206574
        # key
        for i in range(8):
            self.state[4 + i] = struct.unpack("<I", key[i*4:(i+1)*4])[0]
        # counter
        self.state[12] = 0
        # nonce
        for i in range(3):
            self.state[13 + i] = struct.unpack("<I", nonce[i*4:(i+1)*4])[0]
        self.keystream_pos = 64

    def _quarter_round(self, x, a, b, c, d):
        x[a] = (x[a] + x[b]) & 0xFFFFFFFF
        x[d] = rotl32(x[d] ^ x[a], 16)
        x[c] = (x[c] + x[d]) & 0xFFFFFFFF
        x[b] = rotl32(x[b] ^ x[c], 12)
        x[a] = (x[a] + x[b]) & 0xFFFFFFFF
        x[d] = rotl32(x[d] ^ x[a], 8)
        x[c] = (x[c] + x[d]) & 0xFFFFFFFF
        x[b] = rotl32(x[b] ^ x[c], 7)

    def _block(self):
        working = list(self.state)
        for _ in range(10):
            # Columns
            self._quarter_round(working, 0, 4, 8, 12)
            self._quarter_round(working, 1, 5, 9, 13)
            self._quarter_round(working, 2, 6, 10, 14)
            self._quarter_round(working, 3, 7, 11, 15)
            # Diagonals
            self._quarter_round(working, 0, 5, 10, 15)
            self._quarter_round(working, 1, 6, 11, 12)
            self._quarter_round(working, 2, 7, 8, 13)
            self._quarter_round(working, 3, 4, 9, 14)
        
        out = b""
        for i in range(16):
            val = (working[i] + self.state[i]) & 0xFFFFFFFF
            out += struct.pack("<I", val)
        
        self.state[12] = (self.state[12] + 1) & 0xFFFFFFFF
        self.keystream = out
        self.keystream_pos = 0

    def encrypt(self, data):
        result = bytearray()
        for b in data:
            if self.keystream_pos >= 64:
                self._block()
            result.append(b ^ self.keystream[self.keystream_pos])
            self.keystream_pos += 1
        return bytes(result)

    def decrypt(self, data):
        return self.encrypt(data)

# --- Salsa20 Implementation ---
class Salsa20:
    def __init__(self):
        self.state = [0] * 16
        self.keystream = b""
        self.keystream_pos = 64

    def init(self, key, nonce):
        # constants
        self.state[0] = 0x61707865
        self.state[5] = 0x3320646e
        self.state[10] = 0x79622d32
        self.state[15] = 0x6b206574
        # key
        for i in range(8):
            idx = (1 + i) if i < 4 else (11 + (i - 4))
            self.state[idx] = struct.unpack("<I", key[i*4:(i+1)*4])[0]
        # nonce
        self.state[6] = struct.unpack("<I", nonce[0:4])[0]
        self.state[7] = struct.unpack("<I", nonce[4:8])[0]
        # counter
        self.state[8] = 0
        self.state[9] = 0
        self.keystream_pos = 64

    def _block(self):
        working = list(self.state)
        for _ in range(10):
            # Column rounds
            working[4] ^= rotl32((working[0] + working[12]) & 0xFFFFFFFF, 7)
            working[8] ^= rotl32((working[4] + working[0]) & 0xFFFFFFFF, 9)
            working[12] ^= rotl32((working[8] + working[4]) & 0xFFFFFFFF, 13)
            working[0] ^= rotl32((working[12] + working[8]) & 0xFFFFFFFF, 18)

            working[9] ^= rotl32((working[5] + working[1]) & 0xFFFFFFFF, 7)
            working[13] ^= rotl32((working[9] + working[5]) & 0xFFFFFFFF, 9)
            working[1] ^= rotl32((working[13] + working[9]) & 0xFFFFFFFF, 13)
            working[5] ^= rotl32((working[1] + working[13]) & 0xFFFFFFFF, 18)

            working[14] ^= rotl32((working[10] + working[6]) & 0xFFFFFFFF, 7)
            working[2] ^= rotl32((working[14] + working[10]) & 0xFFFFFFFF, 9)
            working[6] ^= rotl32((working[2] + working[14]) & 0xFFFFFFFF, 13)
            working[10] ^= rotl32((working[6] + working[2]) & 0xFFFFFFFF, 18)

            working[3] ^= rotl32((working[15] + working[11]) & 0xFFFFFFFF, 7)
            working[7] ^= rotl32((working[3] + working[15]) & 0xFFFFFFFF, 9)
            working[11] ^= rotl32((working[7] + working[3]) & 0xFFFFFFFF, 13)
            working[15] ^= rotl32((working[11] + working[7]) & 0xFFFFFFFF, 18)

        out = b""
        for i in range(16):
            val = (working[i] + self.state[i]) & 0xFFFFFFFF
            out += struct.pack("<I", val)
        
        self.state[8] = (self.state[8] + 1) & 0xFFFFFFFF
        if self.state[8] == 0:
            self.state[9] = (self.state[9] + 1) & 0xFFFFFFFF
        
        self.keystream = out
        self.keystream_pos = 0

    def encrypt(self, data):
        result = bytearray()
        for b in data:
            if self.keystream_pos >= 64:
                self._block()
            result.append(b ^ self.keystream[self.keystream_pos])
            self.keystream_pos += 1
        return bytes(result)

    def decrypt(self, data):
        return self.encrypt(data)

# --- LFSR (HMAC-based) Implementation ---
class ChaoticLFSR32:
    def __init__(self, seed, chaos_key):
        self.seed = seed if seed != 0 else 0xACE1
        self.chaos_key = chaos_key
        # big-endian seed for label consistency with ESP32
        self.seed_be = struct.pack(">I", self.seed)
        self.block = b""
        self.block_index = 32
        self.block_counter = 0

    def _generate_block(self):
        label = b"XENO-LFSR"
        msg = label + self.seed_be + struct.pack(">I", self.block_counter)
        self.block = hmac_sha256(self.chaos_key, msg)
        self.block_counter += 1
        self.block_index = 0

    def next_byte(self):
        if self.block_index >= 32:
            self._generate_block()
        val = self.block[self.block_index]
        self.block_index += 1
        return val

    def xor_bitwise(self, data):
        return bytes(b ^ self.next_byte() for b in data)

# --- Tinkerbell (Chaos Map) Implementation ---
class Tinkerbell:
    def __init__(self, chaos_key):
        # Port from lib/Tinkerbell/src/tinkerbell.cpp
        v0 = (chaos_key[0] << 8) | chaos_key[1]
        v1 = (chaos_key[2] << 8) | chaos_key[3]
        v2 = (chaos_key[4] << 8) | chaos_key[5]
        v3 = (chaos_key[6] << 8) | chaos_key[7]

        # Use 32-bit float simulation for consistency if possible, 
        # but Python floats are fine for now. We might need rounding.
        self.a = self._map_range(v0, -1.2, -0.3)
        self.b = self._map_range(v1, -1.0, -0.2)
        self.c = self._map_range(v2, 1.5, 2.5)
        self.d = self._map_range(v3, 0.3, 1.3)

        self.x = self._frac_from_16b(chaos_key[8], chaos_key[9])
        self.y = self._frac_from_16b(chaos_key[10], chaos_key[11])

        ctrl = chaos_key[12]
        self.alpha = self._map_byte(chaos_key[13], -2.0, 2.0)
        self.beta = self._map_byte(chaos_key[14], -2.0, 2.0)
        self.gamma = self._map_byte(ctrl ^ chaos_key[13], -4.0, 4.0)
        self.delta = self._map_byte((~ctrl & 0xFF) ^ chaos_key[14], -4.0, 4.0)
        self.eps = self._map_byte(chaos_key[15], -4.0, 4.0)
        self.zeta = self._map_byte((ctrl + chaos_key[15]) & 0xFF, -8.0, 8.0)
        self.eta = self._map_byte(ctrl ^ (chaos_key[15] >> 1), -8.0, 8.0)

        # Whitening state
        self.s = (chaos_key[0] << 24 | chaos_key[1] << 16 | chaos_key[2] << 8 | chaos_key[3])
        if self.s == 0: self.s = 0x9E3779B9
        self.inc = 0x6a09e667 ^ (chaos_key[4] << 16 | chaos_key[5])
        self.rot1 = 1 + (chaos_key[6] & 31)
        self.rot2 = 1 + (chaos_key[7] & 31)

        # Burn-in
        for _ in range(128):
            self.next_byte()

    def _map_range(self, v, lo, hi):
        return lo + (float(v) / 65535.0) * (hi - lo)

    def _map_byte(self, b, lo, hi):
        return lo + (float(b) / 255.0) * (hi - lo)

    def _frac_from_16b(self, hi, lo):
        u = (hi << 8) | lo
        f = (float(u) + 1.0) / 65536.0
        if f >= 1.0: f = 0.999984741
        return f

    def _xorshift32_mix(self):
        self.s = (self.s + self.inc) & 0xFFFFFFFF
        z = (self.s + 0x9e3779b9) & 0xFFFFFFFF
        z = ((z ^ (z >> 30)) * 0xbf58476d1ce4e5b9) & 0xFFFFFFFF
        z = ((z ^ (z >> 27)) * 0x94d049bb133111eb) & 0xFFFFFFFF
        z = (z ^ (z >> 31)) & 0xFFFFFFFF
        return z

    def next_bit(self):
        xn, yn = self.x, self.y
        x1 = xn*xn - yn*yn + self.a * xn + self.b * yn
        y1 = 2.0 * xn * yn + self.c * xn + self.d * yn
        
        # Robustness: Check for divergence
        if not math.isfinite(x1) or abs(x1) > 1e6:
            x1 = (self.a + 1.0) * 0.5 # Reset to semi-stable area
        if not math.isfinite(y1) or abs(y1) > 1e6:
            y1 = (self.b + 1.0) * 0.5
            
        self.x, self.y = x1, y1

        # Polynomial mixing
        xx, yy = x1*x1, y1*y1
        xxx, yyy = xx*x1, yy*y1
        pp = self.alpha*x1 + self.beta*y1 + self.gamma*xx + self.delta*yy + self.eps*(x1*y1) + self.zeta*xxx + self.eta*yyy

        # Clamp and convert to int for bitwise ops
        # Equivalent to (uint32_t)(fabsf(x1) * 4294967295.0f)
        def to_u32(f):
            if not math.isfinite(f): return 0
            return int(abs(f) * 4294967295.0) & 0xFFFFFFFF

        ux = to_u32(x1)
        uy = to_u32(y1)
        up = to_u32(pp)

        xs = self._xorshift32_mix()
        mix = ux ^ rotl32(uy, self.rot1) ^ rotl32(up, self.rot2) ^ xs
        mix = (mix * 0xA3B1C2D3) & 0xFFFFFFFF
        mix ^= (mix >> 16)
        return mix & 1

    def next_byte(self):
        b = 0
        for i in range(8):
            b |= (self.next_bit() << i)
        return b

    def xor_bitwise(self, data):
        return bytes(b ^ self.next_byte() for b in data)

# --- Transposition Implementation ---
class DeterministicPRNG:
    def __init__(self, key16):
        s0 = struct.unpack(">Q", key16[0:8])[0]
        s1 = struct.unpack(">Q", key16[8:16])[0]
        self.state = (s0 ^ (s1 + 0x9E3779B97F4A7C15)) & 0xFFFFFFFFFFFFFFFF
        if self.state == 0: self.state = 0xCAFEBABEDEADBEEF

    def next64(self):
        self.state = (self.state + 0x9E3779B97F4A7C15) & 0xFFFFFFFFFFFFFFFF
        z = self.state
        z = (z ^ (z >> 30)) * 0xBF58476D1CE4E5B9 & 0xFFFFFFFFFFFFFFFF
        z = (z ^ (z >> 27)) * 0x94D049BB133111EB & 0xFFFFFFFFFFFFFFFF
        return z ^ (z >> 31)

    def next32(self):
        return self.next64() & 0xFFFFFFFF

class Transposition:
    @staticmethod
    def apply(data, key8, mode='forward'):
        n = len(data)
        if n <= 1: return data

        # Expand 8-byte key to 16 bytes
        key16 = bytearray(key8)
        for i in range(8):
            a = key8[i]
            b = key8[(i + 3) & 7]
            val = (((a << 3) | (a >> 5)) ^ ((b << 1) | (b >> 7)) ^ 0xA5 ^ i) & 0xFF
            key16.append(val)
        
        prng = DeterministicPRNG(bytes(key16))
        
        # Build permutation
        perm = list(range(n))
        for i in range(n - 1, 0, -1):
            j = prng.next32() % (i + 1)
            perm[i], perm[j] = perm[j], perm[i]
        
        if mode == 'forward':
            out = bytearray(n)
            for i in range(n):
                out[i] = data[perm[i]]
            return bytes(out)
        else:
            # Build inverse permutation
            inv = [0] * n
            for i in range(n):
                inv[perm[i]] = i
            out = bytearray(n)
            for i in range(n):
                out[i] = data[inv[i]]
            return bytes(out)

# --- High-level Key Derivation ---
def derive_keys(master_secret):
    prk = hkdf_extract(KDF_SALT_COMMON, master_secret)
    
    lfsr_seed_buf = hkdf_expand(prk, KDF_LABEL_LFSR_SEED, 4)
    lfsr_seed = struct.unpack(">I", lfsr_seed_buf)[0]
    if lfsr_seed == 0: lfsr_seed = 0xACE1
    
    tinkerbell_key = hkdf_expand(prk, KDF_LABEL_TINKERBELL, 16)
    transposition_key = hkdf_expand(prk, KDF_LABEL_TRANSPOSITION, 16)
    hmac_key = hkdf_expand(prk, KDF_LABEL_HMAC, 32)
    chacha_key = hkdf_expand(prk, KDF_LABEL_CHACHA20, 32)
    salsa_key = hkdf_expand(prk, KDF_LABEL_SALSA20, 32)
    
    return {
        'lfsr_seed': lfsr_seed,
        'tinkerbell_key': tinkerbell_key,
        'transposition_key': transposition_key,
        'hmac_key': hmac_key,
        'chacha_key': chacha_key,
        'salsa_key': salsa_key,
        'prk': prk
    }

def derive_message_keys(base_hmac_key, nonce):
    prk = hkdf_extract(None, base_hmac_key)
    context = KDF_LABEL_MESSAGE_BASE + struct.pack(">I", nonce)
    okm = hkdf_expand(prk, context, 36)
    
    lfsr_seed = struct.unpack(">I", okm[0:4])[0]
    if lfsr_seed == 0: lfsr_seed = 0xACE1
    
    return {
        'lfsr_seed': lfsr_seed,
        'tinkerbell_key': okm[4:20],
        'transposition_key': okm[20:36]
    }

# --- NTRU Wrapper ---
class XenoNTRU:
    def __init__(self, N=743, p=3, q=2048):
        self.N = N
        self.p = p
        self.q = q
        self.cipher = NtruCipher(N, p, q)

    def generate_keys(self):
        self.cipher.generate_random_keys()
        # Extract components to match the manual structure in app.py if needed, 
        # but better to just use the object.
        return self.cipher

    def encrypt(self, pub_key_coeffs, message_bits):
        # pub_key_coeffs is h_poly coeffs
        self.cipher.h_poly = Poly(pub_key_coeffs[::-1], x).set_domain(ZZ)
        msg_poly = Poly(message_bits[::-1], x).set_domain(ZZ)
        # random poly for encryption as in lib/ntru.py
        r_poly = random_poly(self.N, int(math.sqrt(self.q)))
        enc_poly = self.cipher.encrypt(msg_poly, r_poly)
        return enc_poly.all_coeffs()[::-1]

    def decrypt(self, priv_key, ciphertext_coeffs):
        # priv_key should be (f_poly, f_p_poly)
        f_poly, f_p_poly = priv_key
        self.cipher.f_poly = f_poly
        self.cipher.f_p_poly = f_p_poly
        ct_poly = Poly(ciphertext_coeffs[::-1], x).set_domain(ZZ)
        dec_poly = self.cipher.decrypt(ct_poly)
        return dec_poly.all_coeffs()[::-1]

# --- Pipeline ---
def xeno_encrypt(data, keys, mode='ztm', nonce=0):
    if mode == 'normal':
        # Normal mode: LFSR + Tinkerbell + Transposition
        lfsr = ChaoticLFSR32(keys['lfsr_seed'], keys['prk'])
        data = lfsr.xor_bitwise(data)
        
        tinker = Tinkerbell(keys['tinkerbell_key'])
        data = tinker.xor_bitwise(data)
        
        data = Transposition.apply(data, keys['transposition_key'][:8], 'forward')
        return data
    else:
        # ZTM mode: ChaCha20 -> LFSR -> Tinkerbell -> Transposition -> Salsa20
        # For ZTM, we use per-message keys if nonce is provided
        m_keys = derive_message_keys(keys['hmac_key'], nonce)
        
        # 1. ChaCha20 (uses a fixed nonce derived from the session/master)
        chacha = ChaCha20()
        chacha_nonce = hashlib.sha256(struct.pack(">I", nonce)).digest()[:12]
        chacha.init(keys['chacha_key'], chacha_nonce)
        data = chacha.encrypt(data)
        
        # 2. LFSR
        lfsr = ChaoticLFSR32(m_keys['lfsr_seed'], keys['prk'])
        data = lfsr.xor_bitwise(data)
        
        # 3. Tinkerbell
        tinker = Tinkerbell(m_keys['tinkerbell_key'])
        data = tinker.xor_bitwise(data)
        
        # 4. Transposition
        data = Transposition.apply(data, m_keys['transposition_key'][:8], 'forward')
        
        # 5. Salsa20
        salsa = Salsa20()
        salsa_nonce = hashlib.sha256(struct.pack(">I", nonce) + b"SALSA").digest()[:8]
        salsa.init(keys['salsa_key'], salsa_nonce)
        data = salsa.encrypt(data)
        
        return data

def xeno_decrypt(data, keys, mode='ztm', nonce=0):
    if mode == 'normal':
        # Reverse order
        data = Transposition.apply(data, keys['transposition_key'][:8], 'inverse')
        
        tinker = Tinkerbell(keys['tinkerbell_key'])
        data = tinker.xor_bitwise(data)
        
        lfsr = ChaoticLFSR32(keys['lfsr_seed'], keys['prk'])
        data = lfsr.xor_bitwise(data)
        return data
    else:
        # ZTM reversed: Salsa20 -> Transposition -> Tinkerbell -> LFSR -> ChaCha20
        m_keys = derive_message_keys(keys['hmac_key'], nonce)
        
        # 1. Salsa20
        salsa = Salsa20()
        salsa_nonce = hashlib.sha256(struct.pack(">I", nonce) + b"SALSA").digest()[:8]
        salsa.init(keys['salsa_key'], salsa_nonce)
        data = salsa.decrypt(data)
        
        # 2. Transposition
        data = Transposition.apply(data, m_keys['transposition_key'][:8], 'inverse')
        
        # 3. Tinkerbell
        tinker = Tinkerbell(m_keys['tinkerbell_key'])
        data = tinker.xor_bitwise(data)
        
        # 4. LFSR
        lfsr = ChaoticLFSR32(m_keys['lfsr_seed'], keys['prk'])
        data = lfsr.xor_bitwise(data)
        
        # 5. ChaCha20
        chacha = ChaCha20()
        chacha_nonce = hashlib.sha256(struct.pack(">I", nonce)).digest()[:12]
        chacha.init(keys['chacha_key'], chacha_nonce)
        data = chacha.decrypt(data)
        
        return data
