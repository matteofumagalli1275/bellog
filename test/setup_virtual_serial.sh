#!/bin/bash
# Builds and installs the tty0tty kernel module to create virtual serial port pairs.
# Creates /dev/tnt0 <-> /dev/tnt1 (and tnt2<->tnt3, etc.)
# These show up in Chrome's WebSerial device picker.

set -e

TTY0TTY_DIR="/tmp/tty0tty"

echo "=== Installing tty0tty virtual serial port module ==="

# Dependencies
if ! dpkg -s build-essential &>/dev/null; then
    echo "Installing build-essential..."
    sudo apt-get install -y build-essential
fi

# Clone and build
if [ -d "$TTY0TTY_DIR" ]; then
    rm -rf "$TTY0TTY_DIR"
fi

echo "Cloning tty0tty..."
git clone https://github.com/freemed/tty0tty.git "$TTY0TTY_DIR"

echo "Building kernel module..."
cd "$TTY0TTY_DIR/module"
make

echo "Loading module..."
sudo insmod tty0tty.ko

# Set permissions so Chrome/non-root can access the devices
sudo chmod 666 /dev/tnt*

echo ""
echo "=== Done! ==="
echo "Virtual serial port pairs created:"
echo "  /dev/tnt0 <-> /dev/tnt1"
echo "  /dev/tnt2 <-> /dev/tnt3"
echo "  /dev/tnt4 <-> /dev/tnt5"
echo "  /dev/tnt6 <-> /dev/tnt7"
echo ""
echo "Run: python3 dummy_serial.py"
echo "Then connect WebSerial to /dev/tnt1"
