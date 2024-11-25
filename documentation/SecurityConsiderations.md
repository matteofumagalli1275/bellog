# Security Considerations

## Data Privacy

Bellog processes all data locally in your browser — no telemetry, analytics, or stream data is sent to external servers.

## Importing External Profiles & Libraries

Bellog profiles (`.bll` files) and libraries may contain JavaScript code that is executed inside your browser session via runtime evaluation (`eval` / `new Function`).

A malicious profile could attempt to:

- Display fake UI elements to phish for credentials or payments.
- Read or manipulate data visible in the current browser tab.
- Exploit browser vulnerabilities to access system resources.

### Mitigations

A Content-Security-Policy (CSP) header is set to block cross-origin network requests:

```html
<meta http-equiv="Content-Security-Policy"
      content="default-src ws: localhost:* 'self' 'unsafe-inline' 'unsafe-eval'">
```

This prevents scripts from loading external resources or exfiltrating data to third-party servers.

### Limitations

This is **not** a complete protection. The `unsafe-eval` and `unsafe-inline` directives are required for Bellog's core functionality and still allow a malicious profile to:

- Inject deceptive pop-ups or overlays that impersonate Bellog UI.
- Link to external sites (the user must click, but social-engineering is possible).
- Abuse local browser APIs exposed to the page.

**Only import profiles and libraries from sources you trust.**

## Hardware & Network Interfaces

### WebSerial / CAN Bus

WebSerial and CAN Bus (via slcan) request access to physical serial ports. Granting access allows the profile's code to read from and write to the device. A malicious profile could send unexpected commands to the connected hardware.

### WebSocket / SocketCAN Bridge

The CAN WebSocket transport connects to a local bridge process (e.g. `backends/can_websocket_bridge.py`). Any page in the browser can potentially connect to a WebSocket on `localhost`. Make sure the bridge only listens on `127.0.0.1` and consider adding authentication if running in a shared environment.

### TCP via Websockify

The TCP driver uses Websockify to proxy TCP connections through a WebSocket. The same localhost-exposure risk applies. Review the [Websockify guide](Websockify.md) before enabling this interface.

## Recommendations

1. **Only import `.bll` files from trusted sources.**
2. Review custom scripts and layers inside a profile before running it.
3. Do not grant serial-port access to untrusted profiles.
4. Bind WebSocket bridges to `127.0.0.1` only.
5. Keep your browser up to date to benefit from the latest security patches.