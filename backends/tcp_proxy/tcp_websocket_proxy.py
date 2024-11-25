#!/usr/bin/env python3
"""
TCP <-> WebSocket Proxy for Bellog
===================================

A WebSocket server that proxies bidirectional traffic between
browser WebSocket clients and TCP servers.

The TCP target is specified per-connection via query parameters,
so a single proxy instance can serve connections to different targets.
Each WebSocket connection gets its own dedicated TCP socket.

Authentication:
    Clients must provide a valid token as a query parameter.

Query parameters (set by Bellog automatically):
    token     – authentication token (required, must match --token)
    tcp_host  – TCP target host (required)
    tcp_port  – TCP target port (required)
    ssl       – if "true", wrap the TCP connection with SSL/TLS

Requirements:
    pip install websockets

Usage:
    python tcp_websocket_proxy.py --token <YOUR_BELLOG_WEBSOCKET_TOKEN>

    # Custom listen port:
    python tcp_websocket_proxy.py --token mysecrettoken --port 9000

    # Then in Bellog, configure a TCP Socket interface:
    #   TCP Target IP:        192.168.1.10
    #   TCP Target Port:      5555
    #   TCP SSL/TLS:          No (or Yes for TLS-wrapped TCP)
    #   WebSocket Proxy Port: 8765 (or 9000 if changed above)
"""

import argparse
import asyncio
import logging
import signal
import ssl as ssl_module
from urllib.parse import urlparse, parse_qs

import websockets

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("tcp-ws-proxy")


async def proxy_ws_to_tcp(ws, tcp_writer: asyncio.StreamWriter):
    """Forward binary messages from WebSocket to TCP."""
    try:
        async for message in ws:
            if isinstance(message, str):
                message = message.encode("utf-8")
            tcp_writer.write(message)
            await tcp_writer.drain()
    except websockets.ConnectionClosed:
        pass
    finally:
        tcp_writer.close()
        await tcp_writer.wait_closed()


async def proxy_tcp_to_ws(tcp_reader: asyncio.StreamReader, ws):
    """Forward data from TCP to WebSocket as binary frames."""
    try:
        while True:
            data = await tcp_reader.read(4096)
            if not data:
                break
            await ws.send(data)
    except (websockets.ConnectionClosed, ConnectionResetError):
        pass


async def handle_client(ws, token: str):
    """Handle a single WebSocket client: authenticate, open TCP, proxy."""
    path = ws.request.path if hasattr(ws.request, "path") else ws.path
    params = parse_qs(urlparse(path).query)

    # Authenticate
    client_token = params.get("token", [None])[0]
    if client_token != token:
        log.warning("Rejected client %s: invalid token", ws.remote_address)
        await ws.close(4001, "Invalid token")
        return

    # Read TCP target from query params
    tcp_host = params.get("tcp_host", [None])[0]
    tcp_port_str = params.get("tcp_port", [None])[0]
    use_ssl = params.get("ssl", ["false"])[0].lower() == "true"

    if not tcp_host or not tcp_port_str:
        log.warning("Rejected client %s: missing tcp_host or tcp_port", ws.remote_address)
        await ws.close(4003, "Missing tcp_host or tcp_port")
        return

    try:
        tcp_port = int(tcp_port_str)
    except ValueError:
        await ws.close(4003, "Invalid tcp_port")
        return

    remote = ws.remote_address
    log.info("Client %s -> TCP %s:%d (ssl=%s)", remote, tcp_host, tcp_port, use_ssl)

    # Open TCP connection, optionally with SSL/TLS
    try:
        ssl_ctx = ssl_module.create_default_context() if use_ssl else None
        tcp_reader, tcp_writer = await asyncio.open_connection(tcp_host, tcp_port, ssl=ssl_ctx)
    except (OSError, ConnectionRefusedError) as e:
        log.error("Cannot connect to TCP %s:%d: %s", tcp_host, tcp_port, e)
        await ws.close(4002, f"TCP connection failed: {e}")
        return

    try:
        ws_to_tcp = asyncio.create_task(proxy_ws_to_tcp(ws, tcp_writer))
        tcp_to_ws = asyncio.create_task(proxy_tcp_to_ws(tcp_reader, ws))
        done, pending = await asyncio.wait(
            [ws_to_tcp, tcp_to_ws],
            return_when=asyncio.FIRST_COMPLETED,
        )
        for task in pending:
            task.cancel()
    finally:
        if not tcp_writer.is_closing():
            tcp_writer.close()
        log.info("Client disconnected: %s", remote)


async def main(token: str, host: str, port: int):
    handler = lambda ws, _path=None: handle_client(ws, token)

    async with websockets.serve(handler, host, port):
        log.info("WebSocket proxy listening on ws://%s:%d", host, port)
        stop = asyncio.Future()
        loop = asyncio.get_event_loop()
        for sig in (signal.SIGINT, signal.SIGTERM):
            try:
                loop.add_signal_handler(sig, stop.set_result, None)
            except NotImplementedError:
                pass  # Windows
        await stop

    log.info("Proxy stopped.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="TCP <-> WebSocket proxy for Bellog")
    parser.add_argument("--token", required=True, help="Authentication token (must match Bellog's WebSocket Token setting)")
    parser.add_argument("--port", type=int, default=8765, help="WebSocket listen port (default: 8765)")
    parser.add_argument("--host", default="0.0.0.0", help="WebSocket bind address (default: 0.0.0.0)")
    args = parser.parse_args()

    asyncio.run(main(args.token, args.host, args.port))
