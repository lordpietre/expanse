export const metadata = {
    title: "Terms and Conditions — Expanse",
    description: "Expanse Terms and Conditions — MIT License",
};

export default function TermsPage() {
    return (
        <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", background: "#07090f", minHeight: "100vh", color: "#e2e8f0" }}>
            <header style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(13,17,23,0.9)", position: "sticky", top: 0, zIndex: 100, backdropFilter: "blur(12px)" }}>
                <div style={{ maxWidth: 860, margin: "0 auto", padding: "1.25rem 2rem", display: "flex", alignItems: "center", gap: "1rem" }}>
                    <span style={{ fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", background: "linear-gradient(90deg,#1a96f8,#62beff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                        Expanse
                    </span>
                    <span style={{ color: "rgba(255,255,255,0.15)" }}>/</span>
                    <span style={{ fontSize: "0.8rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#64748b" }}>
                        Terms and Conditions
                    </span>
                </div>
            </header>

            <main style={{ maxWidth: 860, margin: "0 auto", padding: "4rem 2rem 6rem" }}>

                <div style={{ marginBottom: "3rem", paddingBottom: "2rem", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                    <h1 style={{ fontSize: "2.25rem", fontWeight: 800, color: "#f8fafc", letterSpacing: "-0.02em", marginBottom: "0.75rem" }}>
                        Terms and Conditions
                    </h1>
                    <p style={{ fontSize: "0.8rem", color: "#64748b", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                        Effective date: March 2025 &middot; Version 1.0
                    </p>
                    <span style={{ display: "inline-block", marginTop: "1rem", padding: "0.3rem 0.75rem", borderRadius: 4, border: "1px solid rgba(26,150,248,0.3)", background: "rgba(26,150,248,0.08)", color: "#1a96f8", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                        MIT License
                    </span>
                </div>

                <Section title="1. License">
                    <div style={{ fontFamily: "monospace", fontSize: "0.8rem", padding: "1.25rem 1.5rem", background: "#0d1117", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, color: "#1a96f8", marginBottom: "1.5rem", letterSpacing: "0.02em" }}>
                        SPDX-License-Identifier: MIT
                    </div>
                    <P>Expanse is free and open-source software distributed under the terms of the <strong>MIT License</strong>. The full license text is reproduced below.</P>
                    <P>Copyright &copy; 2025 Expanse Contributors</P>
                    <P>Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the &quot;Software&quot;), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:</P>
                    <P>The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.</P>
                    <div style={{ padding: "1.25rem 1.5rem", background: "rgba(26,150,248,0.05)", border: "1px solid rgba(26,150,248,0.2)", borderRadius: 8, fontSize: "0.875rem", lineHeight: 1.75 }}>
                        <strong style={{ color: "#f8fafc" }}>THE SOFTWARE IS PROVIDED &quot;AS IS&quot;, WITHOUT WARRANTY OF ANY KIND,</strong> EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
                    </div>
                </Section>

                <Section title="2. What this means for you">
                    <P>Under the MIT License you are free to:</P>
                    <ul style={{ listStyle: "none", paddingLeft: 0, marginBottom: "0.9rem" }}>
                        {[
                            "Use Expanse for any purpose, including commercial production workloads.",
                            "Modify the source code to suit your needs.",
                            "Distribute copies of the original or modified software.",
                            "Sublicense or sell your modifications.",
                        ].map((item) => (
                            <li key={item} style={{ position: "relative", paddingLeft: "1.25rem", fontSize: "0.935rem", marginBottom: "0.45rem" }}>
                                <span style={{ position: "absolute", left: 0, color: "#1a96f8", fontWeight: 700 }}>—</span>
                                {item}
                            </li>
                        ))}
                    </ul>
                    <P>The only requirement is that the copyright notice and this permission notice are retained in all distributed copies or substantial portions.</P>
                </Section>

                <Section title="3. Acceptance of Terms">
                    <P>By creating an account on this instance of Expanse, you acknowledge that you have read and understood these terms and agree to comply with them. If you do not agree, you must not access or use the service.</P>
                </Section>

                <Section title="4. User Responsibilities">
                    <ul style={{ listStyle: "none", paddingLeft: 0 }}>
                        {[
                            "You are solely responsible for the infrastructure, containers, and services you deploy through this application.",
                            "You must not use Expanse to deploy or orchestrate services that violate applicable law.",
                            "You are responsible for securing access credentials and any sensitive data configured within your projects.",
                        ].map((item) => (
                            <li key={item} style={{ position: "relative", paddingLeft: "1.25rem", fontSize: "0.935rem", marginBottom: "0.45rem" }}>
                                <span style={{ position: "absolute", left: 0, color: "#1a96f8", fontWeight: 700 }}>—</span>
                                {item}
                            </li>
                        ))}
                    </ul>
                </Section>

                <Section title="5. No Warranty">
                    <P>Expanse is provided on an &quot;as is&quot; basis. The authors and contributors make no representations or warranties of any kind, express or implied, regarding the correctness, reliability, or fitness of the software for any particular purpose. Use of this software is entirely at your own risk.</P>
                </Section>

                <Section title="6. Limitation of Liability">
                    <P>In no event shall the authors or copyright holders be liable for any direct, indirect, incidental, special, exemplary, or consequential damages arising out of or in connection with the use of this software, even if advised of the possibility of such damages.</P>
                </Section>

                <Section title="7. Source Code">
                    <P>
                        The complete source code for Expanse is publicly available. You can review, fork, and contribute to the project at{" "}
                        <a href="https://github.com/lordpietre/expanse" target="_blank" rel="noopener noreferrer" style={{ color: "#1a96f8" }}>
                            github.com/lordpietre/expanse
                        </a>.
                    </P>
                </Section>

            </main>

            <footer style={{ borderTop: "1px solid rgba(255,255,255,0.07)", padding: "2rem", textAlign: "center", fontSize: "0.75rem", color: "#64748b", letterSpacing: "0.05em" }}>
                Expanse — MIT License — 2025
            </footer>
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section style={{ marginBottom: "2.5rem" }}>
            <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#f8fafc", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "0.9rem", paddingBottom: "0.5rem", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                {title}
            </h2>
            {children}
        </section>
    );
}

function P({ children }: { children: React.ReactNode }) {
    return <p style={{ fontSize: "0.935rem", lineHeight: 1.75, marginBottom: "0.9rem", color: "#e2e8f0" }}>{children}</p>;
}
