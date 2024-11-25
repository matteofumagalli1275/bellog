pip install python-can websockets

# Virtual CAN for testing:
sudo modprobe vcan && sudo ip link add vcan0 type vcan && sudo ip link set up vcan0
python backends/can_websocket_bridge.py --channel vcan0

# Real adapter:
python backends/can_websocket_bridge.py --channel can0 --bitrate 500000