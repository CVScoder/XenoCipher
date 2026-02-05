import unittest
import os
import sys
from crypto_utils import ChaCha20, Salsa20, ChaoticLFSR32, Tinkerbell, Transposition, derive_keys, derive_message_keys, xeno_encrypt, xeno_decrypt

class TestCryptoUtils(unittest.TestCase):
    def test_chacha20(self):
        key = b"01234567890123456789012345678901"
        nonce = b"abcdefghijkl"
        data = b"Hello, ChaCha20!"
        
        c1 = ChaCha20()
        c1.init(key, nonce)
        encrypted = c1.encrypt(data)
        
        c2 = ChaCha20()
        c2.init(key, nonce)
        decrypted = c2.decrypt(encrypted)
        
        self.assertEqual(data, decrypted)
        self.assertNotEqual(data, encrypted)

    def test_salsa20(self):
        key = b"01234567890123456789012345678901"
        nonce = b"abcdefgh"
        data = b"Hello, Salsa20!"
        
        s1 = Salsa20()
        s1.init(key, nonce)
        encrypted = s1.encrypt(data)
        
        s2 = Salsa20()
        s2.init(key, nonce)
        decrypted = s2.decrypt(encrypted)
        
        self.assertEqual(data, decrypted)
        self.assertNotEqual(data, encrypted)

    def test_lfsr(self):
        seed = 0x12345678
        key = b"chaos_key_for_lfsr_16bytes"
        data = b"Keystream test"
        
        l1 = ChaoticLFSR32(seed, key)
        encrypted = l1.xor_bitwise(data)
        
        l2 = ChaoticLFSR32(seed, key)
        decrypted = l2.xor_bitwise(encrypted)
        
        self.assertEqual(data, decrypted)

    def test_tinkerbell(self):
        key = b"tinker_key_16b!!"
        data = b"Tinkerbell chaos test"
        
        t1 = Tinkerbell(key)
        encrypted = t1.xor_bitwise(data)
        
        t2 = Tinkerbell(key)
        decrypted = t2.xor_bitwise(encrypted)
        
        self.assertEqual(data, decrypted)

    def test_transposition(self):
        key = b"trans_k8"
        data = b"Transposition testing for long enough string"
        
        encrypted = Transposition.apply(data, key, 'forward')
        decrypted = Transposition.apply(encrypted, key, 'inverse')
        
        self.assertEqual(data, decrypted)
        self.assertNotEqual(data, encrypted)

    def test_full_pipeline(self):
        master_secret = b"very_secure_master_secret_32_bytes!!"
        keys = derive_keys(master_secret)
        data = b"Full pipeline test message"
        
        # Test Normal Mode
        enc_normal = xeno_encrypt(data, keys, mode='normal')
        dec_normal = xeno_decrypt(enc_normal, keys, mode='normal')
        self.assertEqual(data, dec_normal)
        
        # Test ZTM Mode
        nonce = 12345
        enc_ztm = xeno_encrypt(data, keys, mode='ztm', nonce=nonce)
        dec_ztm = xeno_decrypt(enc_ztm, keys, mode='ztm', nonce=nonce)
        self.assertEqual(data, dec_ztm)

if __name__ == "__main__":
    unittest.main()
