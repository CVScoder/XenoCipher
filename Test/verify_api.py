import json
import urllib.request
import time

def call_api(path, data=None):
    url = f"http://127.0.0.1:5000{path}"
    headers = {'Content-Type': 'application/json'}
    req_data = json.dumps(data).encode('utf-8') if data else None
    
    req = urllib.request.Request(url, data=req_data, headers=headers, method='POST' if data else 'GET')
    try:
        with urllib.request.urlopen(req) as f:
            return json.loads(f.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        print(f"HTTP Error {e.code}: {e.read().decode()}")
        raise

def test_encryption():
    print("Testing Normal Mode...")
    plain = "Hello XenoCipher API"
    enc_res = call_api('/encrypt', {'data': plain, 'mode': 'normal'})
    print(f"Encrypted: {enc_res['ciphertext'][:32]}...")
    
    dec_res = call_api('/decrypt', {
        'ciphertext': enc_res['ciphertext'],
        'mode': 'normal',
        'nonce': enc_res['nonce']
    })
    print(f"Decrypted: {dec_res['plaintext']}")
    assert dec_res['plaintext'] == plain
    print("Normal Mode Success!")

    print("\nTesting ZTM Mode...")
    enc_res_ztm = call_api('/encrypt', {'data': plain, 'mode': 'ztm'})
    print(f"Encrypted (ZTM): {enc_res_ztm['ciphertext'][:32]}...")
    
    dec_res_ztm = call_api('/decrypt', {
        'ciphertext': enc_res_ztm['ciphertext'],
        'mode': 'ztm',
        'nonce': enc_res_ztm['nonce']
    })
    print(f"Decrypted (ZTM): {dec_res_ztm['plaintext']}")
    assert dec_res_ztm['plaintext'] == plain
    print("ZTM Mode Success!")

def test_ntru():
    print("\nTesting NTRU Demo...")
    res = call_api('/ntru_demo')
    print(f"Original: {res['original_key'][:16]}...")
    print(f"Decrypted: {res['decrypted_key'][:16]}...")
    print(f"Match: {res['match']}")
    assert res['match'] == True
    print("NTRU Demo Success!")

if __name__ == "__main__":
    try:
        test_encryption()
        test_ntru()
        print("\nALL API TESTS PASSED!")
    except Exception as e:
        print(f"\nAPI TESTS FAILED: {e}")
        exit(1)
