#!/usr/bin/env python3
"""
Simulates an interactive shell over a tty0tty virtual serial port.
Supports: ls, cat, echo, pwd, cd, clear, help, exit.

Setup (one-time):
    bash setup_virtual_serial.sh

Usage:
    python3 dummy_shell.py

Then open /dev/tnt1 in WebSerial (Chrome).
"""

import os
import sys
import time
import signal
import termios
import select

DEVICE = "/dev/tnt0"

# Fake filesystem
FILESYSTEM = {
    "/": {
        "type": "dir",
        "children": ["home", "etc", "var", "tmp"],
    },
    "/home": {
        "type": "dir",
        "children": ["user"],
    },
    "/home/user": {
        "type": "dir",
        "children": ["readme.txt", "notes.txt", "projects"],
    },
    "/home/user/readme.txt": {
        "type": "file",
        "content": "Welcome to the dummy shell!\r\nThis is a simulated environment running over a virtual serial port.\r\n",
    },
    "/home/user/notes.txt": {
        "type": "file",
        "content": "TODO:\r\n- Test WebSerial connection\r\n- Check baud rate settings\r\n- Write more tests\r\n",
    },
    "/home/user/projects": {
        "type": "dir",
        "children": ["bellog.conf", "data.csv"],
    },
    "/home/user/projects/bellog.conf": {
        "type": "file",
        "content": "baudRate=115200\r\ndataBits=8\r\nstopBits=1\r\nparity=none\r\n",
    },
    "/home/user/projects/data.csv": {
        "type": "file",
        "content": "timestamp,value,status\r\n1001,23.5,OK\r\n1002,24.1,OK\r\n1003,99.9,ERR\r\n1004,23.8,OK\r\n",
    },
    "/etc": {
        "type": "dir",
        "children": ["hostname", "motd"],
    },
    "/etc/hostname": {
        "type": "file",
        "content": "dummy-shell\r\n",
    },
    "/etc/motd": {
        "type": "file",
        "content": "*** Welcome to DummyShell v1.0 ***\r\n",
    },
    "/var": {
        "type": "dir",
        "children": ["log"],
    },
    "/var/log": {
        "type": "dir",
        "children": ["syslog"],
    },
    "/var/log/syslog": {
        "type": "file",
        "content": "[INFO] System booted successfully\r\n[INFO] Serial port initialized\r\n[WARN] Low memory: 42MB free\r\n[INFO] Network interface up\r\n",
    },
    "/tmp": {
        "type": "dir",
        "children": [],
    },
}


def normalize_path(cwd, path):
    """Resolve a path relative to cwd into an absolute path."""
    if not path.startswith("/"):
        path = cwd.rstrip("/") + "/" + path
    parts = []
    for p in path.split("/"):
        if p == "" or p == ".":
            continue
        elif p == "..":
            if parts:
                parts.pop()
        else:
            parts.append(p)
    return "/" + "/".join(parts)


def serial_write(fd, text):
    """Write text to serial, ignoring BlockingIOError."""
    try:
        os.write(fd, text.encode())
    except BlockingIOError:
        pass


def cmd_ls(fd, cwd, args):
    path = normalize_path(cwd, args[0]) if args else cwd
    entry = FILESYSTEM.get(path)
    if entry is None:
        serial_write(fd, f"ls: cannot access '{args[0] if args else path}': No such file or directory\r\n")
    elif entry["type"] == "file":
        serial_write(fd, f"{path.split('/')[-1]}\r\n")
    else:
        for child in sorted(entry["children"]):
            child_path = path.rstrip("/") + "/" + child
            child_entry = FILESYSTEM.get(child_path)
            if child_entry and child_entry["type"] == "dir":
                serial_write(fd, f"\033[1;34m{child}/\033[0m  ")
            else:
                serial_write(fd, f"{child}  ")
        serial_write(fd, "\r\n")


def cmd_cat(fd, cwd, args):
    if not args:
        serial_write(fd, "cat: missing operand\r\n")
        return
    for fname in args:
        path = normalize_path(cwd, fname)
        entry = FILESYSTEM.get(path)
        if entry is None:
            serial_write(fd, f"cat: {fname}: No such file or directory\r\n")
        elif entry["type"] == "dir":
            serial_write(fd, f"cat: {fname}: Is a directory\r\n")
        else:
            serial_write(fd, entry["content"])


def cmd_cd(cwd, args):
    if not args:
        return "/home/user"
    path = normalize_path(cwd, args[0])
    entry = FILESYSTEM.get(path)
    if entry is None:
        return None, f"cd: {args[0]}: No such file or directory"
    if entry["type"] != "dir":
        return None, f"cd: {args[0]}: Not a directory"
    return path, None


def cmd_echo(fd, args):
    serial_write(fd, " ".join(args) + "\r\n")


def cmd_help(fd):
    serial_write(fd, "Available commands:\r\n")
    serial_write(fd, "  ls [path]        List directory contents\r\n")
    serial_write(fd, "  cat <file>...    Print file contents\r\n")
    serial_write(fd, "  cd [path]        Change directory\r\n")
    serial_write(fd, "  pwd              Print working directory\r\n")
    serial_write(fd, "  echo [text]      Print text\r\n")
    serial_write(fd, "  clear            Clear screen\r\n")
    serial_write(fd, "  help             Show this help\r\n")
    serial_write(fd, "  exit             Exit shell\r\n")


COMMANDS = ["ls", "cat", "cd", "pwd", "echo", "clear", "help", "exit"]


def tab_complete(fd, cwd, line_buf):
    """Return (completed_line, text_to_send_to_terminal)."""
    parts = line_buf.split()
    is_arg = len(parts) > 1 or (len(parts) == 1 and line_buf.endswith(" "))

    if not is_arg:
        # Complete command name
        prefix = parts[0] if parts else ""
        matches = [c for c in COMMANDS if c.startswith(prefix)]
    else:
        # Complete file/directory path
        cmd = parts[0]
        partial = parts[-1] if not line_buf.endswith(" ") else ""

        if "/" in partial:
            dir_part = partial.rsplit("/", 1)[0]
            name_prefix = partial.rsplit("/", 1)[1]
            search_dir = normalize_path(cwd, dir_part)
        else:
            dir_part = ""
            name_prefix = partial
            search_dir = cwd

        entry = FILESYSTEM.get(search_dir)
        if not entry or entry["type"] != "dir":
            return line_buf, ""

        candidates = []
        for child in entry["children"]:
            if child.startswith(name_prefix):
                child_path = search_dir.rstrip("/") + "/" + child
                child_entry = FILESYSTEM.get(child_path)
                suffix = "/" if child_entry and child_entry["type"] == "dir" else ""
                candidates.append(child + suffix)
        matches = candidates

    if len(matches) == 0:
        return line_buf, "\x07"  # bell
    elif len(matches) == 1:
        if is_arg:
            partial = parts[-1] if not line_buf.endswith(" ") else ""
            completion = matches[0][len(partial):]
            if not matches[0].endswith("/"):
                completion += " "
            new_line = line_buf + completion
        else:
            prefix = parts[0] if parts else ""
            completion = matches[0][len(prefix):] + " "
            new_line = line_buf + completion
        return new_line, completion
    else:
        # Find common prefix
        common = matches[0]
        for m in matches[1:]:
            while not m.startswith(common):
                common = common[:-1]
        if is_arg:
            partial = parts[-1] if not line_buf.endswith(" ") else ""
            added = common[len(partial):]
        else:
            prefix = parts[0] if parts else ""
            added = common[len(prefix):]
        # Show options
        output = "\r\n" + "  ".join(matches) + "\r\n"
        new_line = line_buf + added
        return new_line, added + output


def execute(fd, cwd, line):
    """Parse and execute a command line. Returns new cwd."""
    parts = line.strip().split()
    if not parts:
        return cwd

    cmd = parts[0]
    args = parts[1:]

    if cmd == "ls":
        cmd_ls(fd, cwd, args)
    elif cmd == "cat":
        cmd_cat(fd, cwd, args)
    elif cmd == "cd":
        result, err = cmd_cd(cwd, args)
        if err:
            serial_write(fd, err + "\r\n")
        else:
            cwd = result
    elif cmd == "pwd":
        serial_write(fd, cwd + "\r\n")
    elif cmd == "echo":
        cmd_echo(fd, args)
    elif cmd == "clear":
        serial_write(fd, "\033[2J\033[H")
    elif cmd == "help":
        cmd_help(fd)
    elif cmd == "exit":
        serial_write(fd, "logout\r\n")
        os.close(fd)
        sys.exit(0)
    else:
        serial_write(fd, f"{cmd}: command not found\r\n")

    return cwd


def redraw_line(fd, prompt, line_buf, cursor):
    """Redraw the current input line, placing cursor at position."""
    # Move to start of line, clear it, reprint prompt + buffer, then reposition cursor
    serial_write(fd, f"\r\033[K{prompt}{line_buf}")
    # Move cursor left from end to correct position
    move_left = len(line_buf) - cursor
    if move_left > 0:
        serial_write(fd, f"\033[{move_left}D")


def main():
    if not os.path.exists(DEVICE):
        print(f"Error: {DEVICE} not found.")
        print("Run: bash setup_virtual_serial.sh")
        sys.exit(1)

    fd = os.open(DEVICE, os.O_RDWR | os.O_NOCTTY | os.O_NONBLOCK)

    # Set raw mode, disable flow control
    attrs = termios.tcgetattr(fd)
    attrs[0] = 0
    attrs[1] = 0
    attrs[2] &= ~termios.CRTSCTS
    attrs[3] = 0
    termios.tcsetattr(fd, termios.TCSANOW, attrs)

    print(f"Shell on {DEVICE} (connect WebSerial to /dev/tnt1)")
    print("Press Ctrl+C to stop.\n")

    signal.signal(signal.SIGINT, lambda *_: (os.close(fd), sys.exit(0)))

    cwd = "/home/user"
    line_buf = ""
    cursor = 0          # cursor position within line_buf
    history = []        # command history
    hist_idx = -1       # -1 = current input, 0..n-1 = history entries (newest first)
    saved_line = ""     # saves current input when browsing history

    # Escape sequence state machine: None | 'ESC' | 'CSI'
    esc_state = None

    # Send banner + first prompt
    serial_write(fd, "\r\n*** DummyShell v1.0 ***\r\nType 'help' for commands.\r\n\r\n")
    prompt = f"\033[1;32muser@dummy\033[0m:\033[1;34m{cwd}\033[0m$ "
    serial_write(fd, prompt)

    poll = select.poll()
    poll.register(fd, select.POLLIN)

    try:
        while True:
            events = poll.poll(50)  # 50ms timeout
            if not events:
                continue

            try:
                data = os.read(fd, 256)
            except BlockingIOError:
                continue

            for byte in data:
                ch = chr(byte)

                # ── Escape sequence state machine ──────────────────────────
                if esc_state == 'ESC':
                    if byte == 0x5B:  # '[' → enter CSI
                        esc_state = 'CSI'
                    else:
                        esc_state = None  # unknown sequence, discard
                    continue

                if esc_state == 'CSI':
                    esc_state = None
                    if byte == 0x41:  # Up arrow → history back
                        if hist_idx == -1:
                            saved_line = line_buf
                        if history and hist_idx < len(history) - 1:
                            hist_idx += 1
                            line_buf = history[hist_idx]
                            cursor = len(line_buf)
                            redraw_line(fd, prompt, line_buf, cursor)
                    elif byte == 0x42:  # Down arrow → history forward
                        if hist_idx > 0:
                            hist_idx -= 1
                            line_buf = history[hist_idx]
                        elif hist_idx == 0:
                            hist_idx = -1
                            line_buf = saved_line
                        cursor = len(line_buf)
                        redraw_line(fd, prompt, line_buf, cursor)
                    elif byte == 0x43:  # Right arrow → cursor right
                        if cursor < len(line_buf):
                            cursor += 1
                            serial_write(fd, "\033[C")
                    elif byte == 0x44:  # Left arrow → cursor left
                        if cursor > 0:
                            cursor -= 1
                            serial_write(fd, "\033[D")
                    # Ignore other CSI sequences (F1, Home, End, etc.)
                    continue

                # ── Normal byte handling ───────────────────────────────────
                if byte == 0x1B:  # ESC
                    esc_state = 'ESC'

                elif ch == "\r" or ch == "\n":
                    serial_write(fd, "\r\n")
                    print(f"$ {line_buf}")
                    if line_buf.strip():
                        history.insert(0, line_buf)
                    hist_idx = -1
                    saved_line = ""
                    cwd = execute(fd, cwd, line_buf)
                    line_buf = ""
                    cursor = 0
                    prompt = f"\033[1;32muser@dummy\033[0m:\033[1;34m{cwd}\033[0m$ "
                    serial_write(fd, prompt)

                elif byte == 0x09:  # Tab
                    line_buf, output = tab_complete(fd, cwd, line_buf)
                    cursor = len(line_buf)
                    if output:
                        serial_write(fd, output)
                        # Redraw prompt + line if options were shown
                        if "\r\n" in output:
                            prompt = f"\033[1;32muser@dummy\033[0m:\033[1;34m{cwd}\033[0m$ "
                            serial_write(fd, prompt + line_buf)

                elif byte == 0x7F or byte == 0x08:  # Backspace / DEL
                    if cursor > 0:
                        line_buf = line_buf[:cursor - 1] + line_buf[cursor:]
                        cursor -= 1
                        redraw_line(fd, prompt, line_buf, cursor)

                elif byte == 0x03:  # Ctrl+C
                    serial_write(fd, "^C\r\n")
                    line_buf = ""
                    cursor = 0
                    hist_idx = -1
                    prompt = f"\033[1;32muser@dummy\033[0m:\033[1;34m{cwd}\033[0m$ "
                    serial_write(fd, prompt)

                elif byte == 0x15:  # Ctrl+U - clear line
                    line_buf = ""
                    cursor = 0
                    serial_write(fd, "\r\033[K")
                    prompt = f"\033[1;32muser@dummy\033[0m:\033[1;34m{cwd}\033[0m$ "
                    serial_write(fd, prompt)

                elif 32 <= byte < 127:  # Printable — insert at cursor
                    line_buf = line_buf[:cursor] + ch + line_buf[cursor:]
                    cursor += 1
                    if cursor == len(line_buf):
                        # Cursor at end — simple echo
                        serial_write(fd, ch)
                    else:
                        # Inserted in middle — redraw
                        redraw_line(fd, prompt, line_buf, cursor)

    except OSError as e:
        print(f"\nError: {e}")
    finally:
        os.close(fd)


if __name__ == "__main__":
    main()
