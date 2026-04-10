#!/usr/bin/env python
"""Simple server runner script"""
import sys
import os
import signal
import socket

# Add parent to path
sys.path.insert(0, os.path.dirname(__file__))

def get_local_ip():
    """Obtient l'adresse IP locale du réseau"""
    try:
        # Se connecter à un serveur externe pour déterminer l'IP locale
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "0.0.0.0"

if __name__ == "__main__":
    import uvicorn
    from app.main import app
    
    # Écouter sur l'IP locale du réseau pour les connexions ESP32 et autres appareils
    local_ip = os.getenv('SERVER_HOST') or get_local_ip()
    port = int(os.getenv('SERVER_PORT', 8000))
    
    print(f"\n Starting SmartWaste API Server")
    print(f"    Local IP: {local_ip}")
    print(f"    Port: {port}")
    print(f"    Access URL: http://{local_ip}:{port}")
    print(f"    For ESP32/Devices: http://{local_ip}:{port}")
    print(f"    Local: http://127.0.0.1:{port}\n")
    
    # Ignore signals that might cause shutdown
    def handle_signal(signum, frame):
        print(f"Received signal {signum}, ignoring")
    
    signal.signal(signal.SIGTERM, handle_signal)
    signal.signal(signal.SIGINT, handle_signal)
    
    try:
        config = uvicorn.Config(
            app,
            host=local_ip if local_ip != "0.0.0.0" else "0.0.0.0",
            port=port,
            log_level="info",
            access_log=True,
        )
        server = uvicorn.Server(config)
        print("Server initialized, starting...")
        server.run()
    except KeyboardInterrupt:
        print("\n Server stopped")
    except Exception as e:
        print(f" Server error: {e}")
        import traceback
        traceback.print_exc()


