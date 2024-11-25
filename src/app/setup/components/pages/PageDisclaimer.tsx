import * as React from "react";

export const PageDisclaimer = (props) => {

    const [modalIsOpen, setModalIsOpen] = React.useState(true);

    return (
        <div className={`modal ${modalIsOpen ? "is-active" : ""}`}>
        <div className="modal-background"></div>
        <div className="modal-card" style={{maxWidth: "640px"}}>
            <header className="modal-card-head">
                <p className="modal-card-title">Security &amp; Risk Disclaimer</p>
                <button className="delete" aria-label="close"
                    onClick={() => setModalIsOpen(false)}></button>
            </header>
            <section className="modal-card-body content">
                <p>
                    Bellog processes all data locally in your browser &mdash; no telemetry or
                    data is sent to external servers.
                </p>

                <h6>Importing External Profiles &amp; Libraries</h6>
                <p>
                    Bellog profiles (<strong>.bll</strong> files) and libraries may contain
                    JavaScript code that runs inside your browser session via runtime evaluation.
                    A malicious profile could attempt to:
                </p>
                <ul>
                    <li>Display fake UI elements to phish for credentials or payments.</li>
                    <li>Read or manipulate data visible in the current browser tab.</li>
                    <li>Exploit browser vulnerabilities to access system resources.</li>
                </ul>
                <p>
                    A Content-Security-Policy header blocks cross-origin network requests, but
                    this <strong>does not fully prevent</strong> all attack vectors.&nbsp;
                    <strong>Only import profiles and libraries from sources you trust.</strong>
                </p>

                <h6>Hardware &amp; Network Interfaces</h6>
                <p>
                    WebSerial, CAN Bus, and WebSocket interfaces interact directly with hardware
                    or local network services.
                    Misconfiguration or use of untrusted bridge software may expose your devices to unintended access.
                    Review the&nbsp;
                    <a href="https://github.com/bel-log/bellog/blob/master/documentation/SecurityConsiderations.md"
                       target="_blank" rel="noopener noreferrer">
                        full Security Considerations
                    </a> before enabling these interfaces.
                </p>

                <h6>Acceptance</h6>
                <p>
                    By clicking <strong>Accept</strong> you acknowledge that you have read and
                    understood the above, and that you use Bellog at your own risk.
                    The authors are not liable for any damage caused by bugs, security
                    vulnerabilities, or misuse of third-party profiles.
                </p>
            </section>
            <footer className="modal-card-foot">
                <button className="button is-success"
                    onClick={() => {
                        props.onDisclaimer(true);
                        setModalIsOpen(false);
                    }}>
                    Accept
                </button>
                <button className="button"
                    onClick={() => setModalIsOpen(false)}>
                    Cancel
                </button>
            </footer>
        </div>
    </div>

    );
}

export default PageDisclaimer;