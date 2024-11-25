#!/usr/bin/env python3
"""
Writes numbered lines to a tty0tty virtual serial port at 50ms intervals.

Setup (one-time):
    bash setup_virtual_serial.sh

Usage:
    python3 dummy_serial.py

Then open /dev/tnt1 in WebSerial (Chrome).
Data is written to /dev/tnt0, and arrives on /dev/tnt1.
"""

import os
import sys
import time
import signal
import termios

DEVICE = "/dev/tnt0"
DELAY_S = 0.05  # 50ms


def main():
    if not os.path.exists(DEVICE):
        print(f"Error: {DEVICE} not found.")
        print("Run: bash setup_virtual_serial.sh")
        sys.exit(1)

    fd = os.open(DEVICE, os.O_RDWR | os.O_NOCTTY | os.O_NONBLOCK)

    # Set raw mode, disable flow control so writes never block
    attrs = termios.tcgetattr(fd)
    attrs[0] = 0        # iflag: no input processing
    attrs[1] = 0        # oflag: no output processing
    attrs[2] &= ~termios.CRTSCTS  # cflag: no hardware flow control
    attrs[3] = 0        # lflag: no canonical mode, no echo
    termios.tcsetattr(fd, termios.TCSANOW, attrs)

    print(f"Writing to {DEVICE} every 50ms (connect WebSerial to /dev/tnt1)")
    print("Press Ctrl+C to stop.\n")

    signal.signal(signal.SIGINT, lambda *_: (os.close(fd), sys.exit(0)))

    line_num = 1
    try:
        while True:
            data = f"Line {line_num}\r\n".encode()
            try:
                os.write(fd, data)
            except BlockingIOError:
                pass  # No reader yet, discard and keep going
            print(f"-> Line {line_num}", end="\r")
            line_num += 1
            time.sleep(DELAY_S)
    except OSError as e:
        print(f"\nWrite error: {e}")
    finally:
        os.close(fd)


if __name__ == "__main__":
    main()
