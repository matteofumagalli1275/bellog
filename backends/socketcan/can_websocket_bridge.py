#!/usr/bin/env python3
"""
CAN ↔ WebSocket Bridge for Bellog
==================================

Bridges a Linux SocketCAN interface to a WebSocket server so that
Bellog's CAN Bus interface (socket transport) can receive and send
CAN frames from/to real or virtual CAN hardware.

Requirements:
    pip install python-can websockets

Usage:
    # With a real CAN adapter (e.g. can0):
    python can_websocket_bridge.py --channel can0 --port 8080 --token <your-token>

    # With a virtual CAN interface for testing:
    sudo modprobe vcan
    sudo ip link add dev vcan0 type vcan
    sudo ip link set up vcan0
    python can_websocket_bridge.py --channel vcan0 --port 8080 --token <your-token>

    # Then in Bellog, set the CAN interface to:
    #   Transport: socket
    #   WebSocket URL: ws://localhost:8080
    # The token is appended automatically by Bellog as ?token=<value>.
    # Copy the token from Bellog's Settings page and pass it via --token.

    # To test with virtual CAN, open another terminal:
    cansend vcan0 123#DEADBEEF
    candump vcan0
"""

import argparse
import asyncio
import json
import logging
import signal
from urllib.parse import urlparse, parse_qs
import can
import websockets

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("can-bridge")

clients: set[websockets.WebSocketServerProtocol] = set()


def can_msg_to_dict(msg: can.Message) -> dict:
    return {
        "id": msg.arbitration_id,
        "dlc": msg.dlc,
        "data": list(msg.data),
        "ext": msg.is_extended_id,
        "rtr": msg.is_remote_frame,
        "fd": msg.is_fd,
    }


def dict_to_can_msg(obj: dict) -> can.Message:
    return can.Message(
        arbitration_id=obj.get("id", 0),
        data=bytes(obj.get("data", [])),
        dlc=obj.get("dlc", len(obj.get("data", []))),
        is_extended_id=obj.get("ext", False),
        is_remote_frame=obj.get("rtr", False),
        is_fd=obj.get("fd", False),
    )


async def can_to_ws(bus: can.BusABC, loop: asyncio.AbstractEventLoop):
    """Read CAN frames and broadcast them to all connected WebSocket clients."""
    reader = can.AsyncBufferedReader()
    notifier = can.Notifier(bus, [reader], loop=loop)
    try:
        while True:
            msg = await reader.get_message()
            payload = json.dumps(can_msg_to_dict(msg))
            if clients:
                await asyncio.gather(
                    *(client.send(payload) for client in clients),
                    return_exceptions=True,
                )
    finally:
        notifier.stop()


async def ws_to_can(ws: websockets.WebSocketServerProtocol, bus: can.BusABC):
    """Receive CAN frames from a WebSocket client and send them on the bus."""
    async for raw in ws:
        try:
            obj = json.loads(raw)
            msg = dict_to_can_msg(obj)
            bus.send(msg)
            log.debug("WS→CAN: ID=0x%03X DLC=%d", msg.arbitration_id, msg.dlc)
        except Exception as e:
            log.warning("Failed to process WS message: %s", e)


def _get_token(ws: websockets.WebSocketServerProtocol) -> str | None:
    """Extract the ?token= query parameter from the WebSocket request path."""
    qs = parse_qs(urlparse(ws.path).query)
    values = qs.get("token", [])
    return values[0] if values else None


async def handler(ws: websockets.WebSocketServerProtocol, bus: can.BusABC, token: str | None):
    remote = ws.remote_address

    if token is not None:
        received = _get_token(ws)
        if received != token:
            log.warning("Rejected connection from %s: invalid or missing token", remote)
            await ws.close(4001, "Unauthorized")
            return

    clients.add(ws)
    log.info("Client connected: %s", remote)
    try:
        await ws_to_can(ws, bus)
    finally:
        clients.discard(ws)
        log.info("Client disconnected: %s", remote)


async def main(channel: str, bustype: str, bitrate: int, port: int, host: str, token: str | None):
    bus = can.interface.Bus(channel=channel, bustype=bustype, bitrate=bitrate)
    log.info("CAN bus opened: %s (%s) @ %d bps", channel, bustype, bitrate)

    if token:
        log.info("Token authentication enabled")
    else:
        log.warning("No token set — all connections accepted. Pass --token to restrict access.")

    loop = asyncio.get_event_loop()

    # Start CAN→WS broadcast task
    asyncio.create_task(can_to_ws(bus, loop))

    # Start WebSocket server
    async with websockets.serve(lambda ws, _path=None: handler(ws, bus, token), host, port):
        log.info("WebSocket server listening on ws://%s:%d", host, port)
        stop = asyncio.Future()
        loop.add_signal_handler(signal.SIGINT, stop.set_result, None)
        loop.add_signal_handler(signal.SIGTERM, stop.set_result, None)
        await stop

    bus.shutdown()
    log.info("Bridge stopped.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="CAN ↔ WebSocket bridge for Bellog")
    parser.add_argument("--channel", default="vcan0", help="SocketCAN interface (default: vcan0)")
    parser.add_argument("--bustype", default="socketcan", help="python-can bus type (default: socketcan)")
    parser.add_argument("--bitrate", type=int, default=500000, help="CAN bitrate (default: 500000)")
    parser.add_argument("--port", type=int, default=8080, help="WebSocket port (default: 8080)")
    parser.add_argument("--host", default="0.0.0.0", help="WebSocket bind address (default: 0.0.0.0)")
    parser.add_argument("--token", default=None, help="Expected token from Bellog (copy from Settings page)")
    args = parser.parse_args()

    asyncio.run(main(args.channel, args.bustype, args.bitrate, args.port, args.host, args.token))
