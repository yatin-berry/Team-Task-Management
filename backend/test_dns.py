import socket
try:
    host = "db.pxyopeidepatepczjvnu.supabase.co"
    print(f"Resolving {host}...")
    addr_info = socket.getaddrinfo(host, 5432)
    for res in addr_info:
        print(res)
except Exception as e:
    print(f"Error: {e}")
