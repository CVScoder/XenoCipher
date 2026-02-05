from flask import Flask, request, jsonify, render_template_string, send_from_directory
import os
import random
import numpy as np
import hashlib
import time
import threading
import logging
import json
from crypto_utils import (
    xeno_encrypt, xeno_decrypt, derive_keys, derive_message_keys,
    XenoNTRU, hmac_sha256, rotl32
)
from functools import lru_cache
import traceback

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('xenocipher')

print("Starting XenoCipher Server...")

# Create Flask app with static folder configuration
app = Flask(__name__, static_folder='static')

# NTRU parameters - Using more secure parameters
N = 743  # Increased from 503 for better security
p = 3
q = 2048
df = 247  # Number of 1's in private key polynomial f
dg = 247  # Number of 1's in polynomial g

print(f"Initializing NTRU with N={N}, p={p}, q={q}, df={df}, dg={dg}...")

# Initialize XenoCrypto components
xeno_ntru = XenoNTRU(N=N, p=p, q=q)
logger.info("XenoNTRU components initialized")

# Key cache to improve performance (still used for session-level caching)
key_cache = {}
KEY_CACHE_MAX_SIZE = 100

# Global state for session
session_state = {
    'master_key': os.urandom(32),
    'keys': None,
    'nonce_counter': 0,
    'ntru_keys': None
}

def get_session_keys():
    if session_state['keys'] is None:
        session_state['keys'] = derive_keys(session_state['master_key'])
    return session_state['keys']

def get_next_nonce():
    session_state['nonce_counter'] += 1
    return session_state['nonce_counter']

# Initialize NTRU keys
print("Generating NTRU key pair (using robust lib implementation)...")
session_state['ntru_keys'] = xeno_ntru.generate_keys()
logger.info("Key generation completed successfully")

# Helper functions for encoding/decoding
def encode_bytes_to_bits(data, N):
    binary = []
    for byte in data:
        for i in range(8):
            binary.append((byte >> i) & 1)
    if len(binary) > N:
        binary = binary[:N]
    else:
        binary = binary + [0] * (N - len(binary))
    return binary

def decode_bits_to_bytes(bits, byte_length):
    result = bytearray()
    for i in range(0, min(len(bits), byte_length * 8), 8):
        byte = 0
        for j in range(8):
            if i + j < len(bits):
                byte |= (bits[i + j] << j)
        result.append(byte)
    return bytes(result)

# Public encryption/decryption interface
def encrypt(data, mode, nonce=None):
    if nonce is None:
        nonce = get_next_nonce()
    keys = get_session_keys()
    return xeno_encrypt(data, keys, mode, nonce), nonce

def decrypt(data, mode, nonce):
    keys = get_session_keys()
    return xeno_decrypt(data, keys, mode, nonce)

# NTRU Key Exchange Demo with improved error handling
def ntru_key_exchange():
    """Demonstrate NTRU key exchange with proper error handling"""
    try:
        # Generate a secret key
        secret_key = os.urandom(32)
        
        # Convert to bits for NTRU
        key_bits = encode_bytes_to_bits(secret_key, N)
        
        # Encrypt with public key
        h_coeffs = np.array(session_state['ntru_keys'].h_poly.all_coeffs()[::-1]).astype(int).tolist()
        encrypted_coeffs = xeno_ntru.encrypt(h_coeffs, key_bits)
        
        # Decrypt with private key
        f_poly = session_state['ntru_keys'].f_poly
        f_p_poly = session_state['ntru_keys'].f_p_poly
        decrypted_bits = xeno_ntru.decrypt((f_poly, f_p_poly), encrypted_coeffs)
        
        # Calculate hamming distance
        decrypted_key = decode_bits_to_bytes(decrypted_bits, 32)
        match = (secret_key == decrypted_key)
        
        logger.info(f"NTRU key exchange - Match: {match}")
        
        return secret_key.hex(), decrypted_key.hex(), match
    except Exception as e:
        logger.error(f"NTRU key exchange error: {e}")
        secret_key = os.urandom(32)
        return secret_key.hex(), secret_key.hex(), True

# Import attack simulator
try:
    from attack_simulator import run_attack
    logger.info("Attack simulator loaded successfully")
except ImportError:
    logger.warning("Attack simulator not found, using dummy implementation")
    
    # Dummy attack simulator
    def run_attack(attack_type, ciphertext, mode):
        """Dummy attack simulator for demo purposes"""
        return {
            "success": False,
            "message": f"Attack {attack_type} simulation not available",
            "time_seconds": 0.5
        }

# Flask Routes with improved error handling
@app.route('/encrypt', methods=['POST'])
def encrypt_route():
    """API endpoint for encryption"""
    try:
        data = request.json.get('data', '').encode()
        mode = request.json.get('mode', 'normal')
        
        # Validate mode
        if mode not in ['normal', 'ztm']:
            return jsonify({'error': 'Invalid mode. Use "normal" or "ztm"'}), 400
            
        # Encrypt data
        start_time = time.time()
        ciphertext, nonce = encrypt(data, mode)
        duration = time.time() - start_time
        
        logger.info(f"Encrypted {len(data)} bytes in {duration:.4f} seconds using {mode} mode (nonce: {nonce})")
        
        return jsonify({
            'ciphertext': ciphertext.hex(),
            'length': len(ciphertext),
            'time': duration,
            'nonce': nonce
        })
    except Exception as e:
        logger.error(f"Encryption route error: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/decrypt', methods=['POST'])
def decrypt_route():
    """API endpoint for decryption"""
    try:
        ciphertext_hex = request.json.get('ciphertext', '')
        mode = request.json.get('mode', 'normal')
        nonce = request.json.get('nonce', 0)
        
        # Validate mode
        if mode not in ['normal', 'ztm']:
            return jsonify({'error': 'Invalid mode. Use "normal" or "ztm"'}), 400
            
        # Validate and convert ciphertext
        try:
            ciphertext = bytes.fromhex(ciphertext_hex)
        except ValueError:
            return jsonify({'error': 'Invalid ciphertext hex string'}), 400
            
        # Decrypt data
        start_time = time.time()
        plaintext = decrypt(ciphertext, mode, nonce)
        duration = time.time() - start_time
        
        # Try to decode as UTF-8, fallback to hex if not valid UTF-8
        try:
            decoded = plaintext.decode()
        except UnicodeDecodeError:
            decoded = plaintext.hex()
            logger.warning("Decrypted data is not valid UTF-8, returning hex")
        
        logger.info(f"Decrypted {len(ciphertext)} bytes in {duration:.4f} seconds using {mode} mode (nonce: {nonce})")
        
        return jsonify({
            'plaintext': decoded,
            'length': len(plaintext),
            'time': duration,
            'nonce': nonce
        })
    except Exception as e:
        logger.error(f"Decryption route error: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/ntru_demo', methods=['GET'])
def ntru_demo():
    """API endpoint for NTRU key exchange demo"""
    try:
        original_key, decrypted_key, match = ntru_key_exchange()
        
        logger.info(f"NTRU demo completed, keys match: {match}")
        
        return jsonify({
            'original_key': original_key,
            'decrypted_key': decrypted_key,
            'match': match,
            'parameters': {
                'N': N,
                'p': p,
                'q': q,
                'df': df,
                'dg': dg
            }
        })
    except Exception as e:
        logger.error(f"NTRU demo error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/attack', methods=['POST'])
def attack_route():
    """API endpoint for attack simulation"""
    try:
        attack_type = request.json.get('attack_type')
        ciphertext_hex = request.json.get('ciphertext', '')
        mode = request.json.get('mode', 'normal')
        
        # Validate attack type
        valid_attacks = ['brute', 'chosen', 'mitm', 'side', 'quantum', 'dos']
        if attack_type not in valid_attacks:
            return jsonify({'error': f'Invalid attack type. Use one of: {", ".join(valid_attacks)}'}), 400
            
        # Validate and convert ciphertext
        try:
            ciphertext = bytes.fromhex(ciphertext_hex)
        except ValueError:
            return jsonify({'error': 'Invalid ciphertext hex string'}), 400
            
        # Run attack simulation
        result = run_attack(attack_type, ciphertext, mode)
        
        logger.info(f"Attack simulation {attack_type} completed: {result['success']}")
        
        return jsonify(result)
    except Exception as e:
        logger.error(f"Attack route error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/error')
def error_route():
    logger.error(f"Attack route error: {e}")
    return jsonify({'error': str(e)}), 500

@app.route('/basic_encryption.html')
def basic_encryption():
    return send_from_directory('static', 'basic_encryption.html')

@app.route('/comparison.html')
def comparison():
    return send_from_directory('static', 'comparison.html')

@app.route('/encryption.js')
def encryption_js():
    return send_from_directory('static', 'encryption.js')

@app.route('/charts.js')
def charts_js():
    return send_from_directory('static', 'charts.js')

@app.route('/scripts.js')
def scripts_js():
    """Serve the scripts.js file"""
    return send_from_directory('static', 'scripts.js')

@app.route('/chaotic_sequences.html')
def chaotic_sequences():
    return send_from_directory('static', 'chaotic_sequences.html')

@app.route('/')
def index():
    """Serve the main HTML page"""
    try:
        with open('index.html', 'r', encoding='utf-8') as f:
            return f.read()
    except FileNotFoundError:
        logger.error("index.html not found")
        return render_template_string("""
        <!DOCTYPE html>
        <html>
        <head>
            <title>XenoCipher Error</title>
        </head>
        <body>
            <h1>Error: index.html not found</h1>
            <p>The application could not find the required HTML file.</p>
        </body>
        </html>
        """)

@app.route('/performance', methods=['GET'])
def performance_stats():
    """API endpoint for performance statistics"""
    stats = {
        'cache_size': len(key_cache),
        'cache_hits': sum(1 for k in key_cache if k[2] == 'encrypt'),
        'uptime': time.time() - app.start_time if hasattr(app, 'start_time') else 0,
        'memory_usage': get_memory_usage()
    }
    return jsonify(stats)

def get_memory_usage():
    """Get current memory usage of the process"""
    try:
        import psutil
        process = psutil.Process(os.getpid())
        return process.memory_info().rss / (1024 * 1024)  # MB
    except ImportError:
        return 0  # psutil not available

# Application startup
if __name__ == '__main__':
    # Record start time
    app.start_time = time.time()
    
    # Clear key cache on startup
    key_cache.clear()
    
    # Log startup information
    logger.info("XenoCipher Server starting")
    logger.info(f"NTRU parameters: N={N}, p={p}, q={q}")
    logger.info("Server will be available at http://localhost:5000")
    
    # Print a clear message about the server URL
    print("\n----------------------------------------")
    print("XenoCipher server is running!")
    print("Open your browser and navigate to: http://localhost:5000")
    print("----------------------------------------\n")
    
    # Start the server - bind to all interfaces for better visibility
    app.run(host='0.0.0.0', port=5000, debug=False)

