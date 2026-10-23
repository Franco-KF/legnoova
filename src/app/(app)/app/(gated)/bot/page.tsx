import { ShieldAlert, Monitor, Code2, ListChecks, Download, Terminal, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { siteConfig } from "@/config/site";

export const metadata = { title: "MT5 Setup Guide", robots: { index: false, follow: false } };

export default function BotPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        eyebrow="Step-by-step guide · MetaTrader 5"
        title="Connect your MT5 demo account"
        description="Follow these steps to link your own MT5 terminal to Legnoova. Your computer runs the free bridge; Legnoova never receives your broker password."
      />

      <div className="grid gap-4 md:grid-cols-3">
        {[
          [Monitor, "Keep MT5 running", "Your computer, MT5, and the Python bridge must stay on while automation is running."],
          [Code2, "No extra bridge server", "The bridge runs on your computer and uses Python's built-in tools."],
          [ShieldAlert, "Start on demo", "Both the dashboard and the EA start with trade execution turned off."],
        ].map(([Icon, title, detail]) => (
          <div key={title as string} className="glass-panel p-5">
            <Icon className="mb-3 h-5 w-5 text-emerald-400" />
            <h2 className="font-semibold">{title as string}</h2>
            <p className="mt-1 text-sm leading-5 text-muted-foreground">{detail as string}</p>
          </div>
        ))}
      </div>

      <section className="glass-panel space-y-5 p-5 sm:p-7">
        <Step number="1" title="Download and install MetaTrader 5 (MT5)">
          MT5 is free and made by MetaQuotes — your broker only provides the account. Download the desktop terminal from the official MetaTrader 5 download page. Run the installer, accept the licence, and wait for it to finish. MT5 needs a live internet connection to connect to a broker server.
          <br className="hidden sm:block" />
          <br className="hidden sm:block" />
          Supported systems:
          <ul className="mt-3 space-y-1 text-sm text-muted-foreground list-disc pl-5">
            <li>Windows 10 or later (64-bit)</li>
            <li>macOS Catalina (10.15.7) or later — Apple M1/M2/M3 or Intel</li>
            <li>iOS / Android mobile app (optional)</li>
            <li>WebTrader in a browser (no install, but the bridge needs the desktop terminal)</li>
          </ul>
        </Step>
      </section>

      <section className="glass-panel space-y-5 p-5 sm:p-7">
        <Step number="2" title="Open or log in to an MT5 demo account">
          Launch MT5. The first time it opens you see an account dialog. You need three things to log in — get these from your broker or from the demo account you create:
          <ul className="mt-3 space-y-1 text-sm text-muted-foreground list-disc pl-5">
            <li><strong>Login:</strong> your account number (a number, not your email)</li>
            <li><strong>Password:</strong> the master password that lets you trade</li>
            <li><strong>Server:</strong> your broker&apos;s trade server name, exactly as written</li>
          </ul>
          To create a demo account inside MT5: choose <strong>File → Open an Account</strong>, search for your broker&apos;s server, pick a <strong>Demo account</strong>, fill in your name, email and phone, set deposit and leverage, accept the terms, and click Finish. MT5 shows your new login, master password and investor password — write them down.
          <br className="hidden sm:block" />
          <br className="hidden sm:block" />
          To log in to an existing account: choose <strong>File → Login to Trade Account</strong> (or right-click Accounts in the Navigator → Login to Trade Account). Enter the login, password and server, tick <strong>Save password</strong> only on a computer you control, then click OK. A green connection bar appears at the bottom-right of MT5 when connected. Use the <strong>master</strong> password — the investor password is read-only and cannot trade.
          <div className="mt-3 rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 text-sm text-muted-foreground">
            <strong>Tip:</strong> the demo account uses virtual money at live prices. MT5 WebTrader or mobile cannot run the Python bridge — you must use the desktop terminal.
          </div>
        </Step>
      </section>

      <section className="glass-panel space-y-5 p-5 sm:p-7">
        <Step number="3" title="Check that Python 3.10 or later is installed">
          The Legnoova bridge is a Python script with no third-party dependencies, but it needs Python 3 installed.
          <br className="hidden sm:block" />
          <br className="hidden sm:block" />
          Open a terminal (Windows: PowerShell or Command Prompt; Linux/macOS: Terminal) and run:
          <div className="mt-2 rounded-lg bg-black/30 p-3 text-xs leading-5 text-emerald-100 overflow-x-auto">
            python --version
          </div>
          If it prints <code>Python 3.x.x</code> (3.10 or newer), you are ready. If it says <code>&apos;python&apos; is not recognized</code> or <code>&apos;command not found&apos;</code>, download and install Python from python.org. On Windows, during installation make sure to check <strong>Add Python to PATH</strong>. On Linux you can use your package manager, e.g. <code>sudo apt update && sudo apt install python3</code> on Ubuntu/Debian.
        </Step>
      </section>

      <section className="glass-panel space-y-5 p-5 sm:p-7">
        <Step number="4" title="Create your Legnoova device token">
          Sign in to Legnoova on a <strong>Broker plan</strong>. Open <Link className="text-emerald-300 underline" href="/app/automation">Broker Automation</Link> in the dashboard sidebar, then click <strong>Create bridge token</strong>. Copy the long token as soon as it appears — Legnoova stores only its hash and cannot show it again.
          <div className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.05] p-3 text-sm leading-5">
            <strong>Device token vs local bridge token — they are different.</strong><br />
            <span className="mt-1 text-muted-foreground text-xs">
              The <strong>Legnoova device token</strong> goes in the Python command below (Step 5) so the bridge can fetch your own signals.<br />
              The <strong>local bridge token</strong> is created by the bridge on first start and goes in the MT5 EA <code>LocalBridgeToken</code> input (Step 7). Never paste either token in a message, screenshot, or source file.
            </span>
          </div>
        </Step>
      </section>

      <section className="glass-panel space-y-5 p-5 sm:p-7">
        <Step number="5" title="Download the two files">
          Click both download buttons below. Your browser usually saves them in <strong>Downloads</strong>. You need <code>bridge.py</code> (the local connector) and <code>LegnoovaBridgeEA.mq5</code> (the MT5 Expert Advisor). No card or broker password is needed for these files.
        </Step>
        <div className="flex flex-wrap gap-3">
          <DownloadLink href="/api/automation/download/bridge" icon={Download}>Download Python bridge</DownloadLink>
          <DownloadLink href="/api/automation/download/ea" icon={Download}>Download MT5 Expert Advisor</DownloadLink>
          <DownloadLink href="/api/automation/download/guide" icon={ListChecks}>Download full guide</DownloadLink>
        </div>
      </section>

      <section className="glass-panel space-y-5 p-5 sm:p-7">
        <Step number="6" title="Start the Python bridge on your computer">
          Open PowerShell on Windows or Terminal on Linux/macOS, go to your Downloads folder, then run the commands below. Replace only <code>PASTE_DEVICE_TOKEN_HERE</code> with the token from Step 4. Keep the quotation marks already shown around the value; do not add extra ones.
        </Step>
        <div className="grid gap-4 lg:grid-cols-2">
          <CommandCard title="Windows · PowerShell" icon={Terminal} command={`Set-Location "$HOME\\Downloads"\n$env:LEGNOOVA_API_URL = "${siteConfig.url}"\n$env:LEGNOOVA_DEVICE_TOKEN = "PASTE_DEVICE_TOKEN_HERE"\npython .\\bridge.py`} />
          <CommandCard title="Linux / macOS · Terminal" icon={Terminal} command={`cd ~/Downloads\nexport LEGNOOVA_API_URL="${siteConfig.url}"\nexport LEGNOOVA_DEVICE_TOKEN="PASTE_DEVICE_TOKEN_HERE"\npython3 bridge.py`} />
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] p-4 text-sm">
          <p className="font-semibold text-emerald-200">Keep this terminal open.</p>
          <p className="mt-1 leading-6 text-muted-foreground">The bridge runs a local server at <code>http://127.0.0.1:8765</code>. When it starts for the first time, it creates a separate <strong>local bridge token</strong> and prints its file path. Copy that file&apos;s contents — you will paste them into the MT5 EA&apos;s <code>LocalBridgeToken</code> input in Step 8.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <code className="rounded-lg bg-black/30 p-3 text-xs text-emerald-100">{'Get-Content "$HOME\.legnoova\mt5-bridge-local-token"'}</code>
            <code className="rounded-lg bg-black/30 p-3 text-xs text-emerald-100">cat ~/.legnoova/mt5-bridge-local-token</code>
          </div>
        </div>
      </section>

      <section className="glass-panel space-y-5 p-5 sm:p-7">
        <Step number="7" title="Let MT5 talk to the local bridge">
          In MT5, open <strong>Tools → Options → Expert Advisors</strong> (or press Ctrl+O, then the Expert Advisors tab). Tick <strong>Allow WebRequest for listed URL</strong>, then add exactly <code>http://127.0.0.1:8765</code> to the URL list and click OK. MT5 matches the address exactly — no trailing slash, no typo. This address points to the bridge on your own computer. Do not open this port to the internet.
          <p className="rounded-lg bg-white/[0.03] p-3 text-sm text-muted-foreground">If requests fail, check the MT5 Journal/Experts tabs and make sure the Python bridge terminal is still running.</p>
        </Step>
      </section>

      <section className="glass-panel space-y-5 p-5 sm:p-7">
        <Step number="8" title="Install, compile, and attach the Legnoova Expert Advisor">
          In MT5 choose <strong>File → Open Data Folder</strong>. Open <code>MQL5</code>, then <code>Experts</code>. Copy <code>LegnoovaBridgeEA.mq5</code> from Downloads into that <code>Experts</code> folder. Back in MT5 press <strong>F4</strong> to open MetaEditor, find <code>LegnoovaBridgeEA</code> under Expert Advisors in the Navigator, open it, and press <strong>F7</strong> to compile. Check the bottom Errors panel says <strong>0 errors</strong>. This creates <code>LegnoovaBridgeEA.ex5</code>.
          <br className="hidden sm:block" />
          <br className="hidden sm:block" />
          Return to MT5, right-click Expert Advisors in the Navigator and choose <strong>Refresh</strong>, then drag <strong>LegnoovaBridgeEA</strong> onto the chart for the pair you want. An EA Properties window opens — set the inputs below, then click OK.
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
            <h3 className="font-semibold">EA Inputs to set</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><code>BridgeUrl</code> — leave as <code>http://127.0.0.1:8765</code>.</li>
              <li><code>LocalBridgeToken</code> — paste the local token file contents from Step 6.</li>
              <li><code>ExecutionEnabled</code> — keep <code>false</code> for your first connection check.</li>
              <li><code>AllowLiveAccount</code> — keep <code>false</code> while testing on demo.</li>
              <li>Leave the 0.5% risk cap and 0.10 maximum-lot limit unchanged while testing.</li>
            </ul>
            <p className="mt-3 text-xs text-amber-200/80">Do not enable live-account trading until you have reviewed the EA and completed demo testing. A successful compile alone does not validate trading behavior.</p>
          </div>
        </Step>
      </section>

      <section className="glass-panel space-y-5 p-5 sm:p-7">
        <Step number="9" title="Turn on Algo Trading in MT5">
          In the MT5 top toolbar click the <strong>Algo Trading</strong> button so it is green/enabled. On the chart where you attached LegnoovaBridgeEA, the small EA icon in the top-right corner should show a smiley face (not a &quot;no entry&quot; sign). If it shows &quot;no entry&quot;, click Algo Trading again. This lets the EA send orders. For your first test this stays off via <code>ExecutionEnabled=false</code> in the EA inputs, but Algo Trading itself must be enabled so the EA can run at all.
        </Step>
      </section>

      <section className="glass-panel space-y-5 p-5 sm:p-7">
        <Step number="10" title="Verify the heartbeat in Legnoova">
          Open <Link className="text-emerald-300 underline" href="/app/automation">Broker Automation</Link>. The dashboard shows the cloud-reported EA heartbeat, account safety, and trade permissions. A heartbeat means MT5, the bridge, and Legnoova are all connected. It updates while the bridge is running. If no heartbeat arrives, download and compile the latest EA (v0.6 or newer) and restart bridge.py.
        </Step>
      </section>

      <section className="glass-panel space-y-5 p-5 sm:p-7">
        <Step number="11" title="Choose a mode and activate demo automation">
          <strong>Normal automation:</strong> in Broker Automation confirm the demo heartbeat, then activate Normal. Choose <strong>Trend-Pullback Confluence</strong> on Chart Analysis to publish signals. MT5 receives new eligible signals only.
          <br className="hidden sm:block" />
          <br className="hidden sm:block" />
          <strong>M1 Scalping (Demo only):</strong> attach the EA to an M1 chart, set <code>ExecutionEnabled=true</code> while connected to demo, keep <code>AllowLiveAccount=false</code>, and activate <strong>M1 Scalping · Demo only</strong> in Broker Automation. No chart screenshot is needed — on each closed M1 candle the EA checks for a large directional body (at least 65% of candle range) closing near its high or low, then sets an ATR-based stop and 1.2R target. It enters once per new candle and waits for a fresh setup after a trade closes.
        </Step>
        <div className="flex items-start gap-3 rounded-xl border border-amber-400/25 bg-amber-400/[0.06] p-4">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
          <div><p className="font-semibold text-amber-100">Before enabling execution</p><p className="mt-1 text-sm leading-6 text-muted-foreground">Automation is off by default. After the setup is connected, use Broker Automation to arm it; set <code>ExecutionEnabled</code> in the EA only on demo. Normal mode allows up to 0.5% risk; autonomous scalping risks about $4 per entry on $8,000 equity (0.05%), allows at most 40 entries/day and 10 in two minutes, and has a 0.5% daily loss stop. The two-minute rate is a safety ceiling, not a trade target. Signals can be wrong; slippage can exceed the planned loss and no profit is promised.</p></div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
        <h2 className="font-semibold">If something does not work</h2>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li><strong>EA says WebRequest failed:</strong> check the allowed URL is exactly <code>http://127.0.0.1:8765</code> and Python is still running.</li>
          <li><strong>401 / unauthorized:</strong> the Legnoova device token belongs in the Python command; the local bridge token belongs in EA Inputs. Create a fresh device token if needed.</li>
          <li><strong>No signal appears:</strong> ensure dashboard automation is enabled and the chart was analyzed with Trend-Pullback Confluence and passed its filters.</li>
          <li><strong>Symbol unavailable:</strong> your broker may use a suffix or different symbol name (e.g. EURUSD.a). The EA stops on ambiguous names rather than guessing.</li>
          <li><strong>EA not showing a smiley face:</strong> click the Algo Trading button in MT5&apos;s top toolbar until it is green.</li>
        </ul>
      </section>

      <section className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 text-sm text-muted-foreground">
        <h2 className="mb-2 font-semibold text-foreground">Official MetaTrader references</h2>
        <ul className="space-y-1">
          <li><a className="text-emerald-300 underline" href="https://www.metatrader5.com/en/download" target="_blank" rel="noreferrer">MetaTrader 5 download</a></li>
          <li><a className="text-emerald-300 underline" href="https://www.metatrader5.com/en/terminal/help/startworking/settings" target="_blank" rel="noreferrer">MT5 Expert Advisors settings (WebRequest)</a></li>
          <li><a className="text-emerald-300 underline" href="https://www.mql5.com/en/docs/network/webrequest" target="_blank" rel="noreferrer">WebRequest allow-list rules</a></li>
          <li><a className="text-emerald-300 underline" href="https://www.metatrader5.com/en/terminal/help/algotrading/autotrading" target="_blank" rel="noreferrer">Create and run an Expert Advisor</a></li>
          <li><a className="text-emerald-300 underline" href="https://www.python.org/downloads/" target="_blank" rel="noreferrer">Download Python</a></li>
        </ul>
      </section>
    </div>
  );
}

function Step({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-sm font-bold text-emerald-300">{number}</span>
      <div>
        <h2 className="font-heading font-semibold">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{children}</p>
      </div>
    </div>
  );
}

function DownloadLink({ href, icon: Icon, children }: { href: string; icon: typeof Download; children: React.ReactNode }) {
  return (
    <a href={href} className="inline-flex h-10 items-center rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm font-medium hover:bg-white/[0.08]">
      <Icon className="mr-2 h-4 w-4" /> {children}
    </a>
  );
}

function CommandCard({ title, icon: Icon, command }: { title: string; icon: typeof Terminal; command: string }) {
  return (
    <div className="glass-panel min-w-0 p-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <Icon className="h-4 w-4 text-emerald-400" /> {title}
      </h3>
      <pre className="mt-3 overflow-x-auto rounded-lg bg-black/30 p-4 text-xs leading-6 text-emerald-100">{command}</pre>
    </div>
  );
}
