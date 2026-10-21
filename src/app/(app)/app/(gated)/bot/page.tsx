import { ShieldAlert, Monitor, Code2, ListChecks, Download, Terminal } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { siteConfig } from "@/config/site";
import { Button } from "@/components/ui/button";

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
        <Step number="1" title="Open your MT5 demo account">
          Open the MetaTrader 5 desktop terminal and sign in to a <strong>demo account</strong>. Keep MT5 open while using the bridge. On Linux, MT5 runs in a Wine environment; the Python bridge itself runs directly with Python.
        </Step>

        <Step number="2" title="Create your Legnoova device token">
          In <Link className="text-emerald-300 underline" href="/app/automation">Broker Automation</Link>, click <strong>Create bridge token</strong>. Copy the long token as soon as it appears. This is your <strong>Legnoova device token</strong>: it lets the bridge fetch your own signals. You will paste it into the Python command in Step 4. It is shown only once; if you lose it, rotate it and update the bridge.
        </Step>
      </section>

      <div className="glass-panel flex flex-wrap items-center justify-between gap-4 p-5"><div><h2 className="font-semibold">Ready to activate or check connection?</h2><p className="mt-1 text-sm text-muted-foreground">Use the Broker Automation dashboard for live MT5 heartbeat, mode activation, signal queue, and trade results.</p></div><Button render={<Link href="/app/automation"/>} className="bg-emerald-500 text-emerald-950 hover:bg-emerald-400">Open Broker Automation</Button></div>

      <section className="glass-panel space-y-5 p-5 sm:p-7">
        <Step number="3" title="Download the two files">
          Click both download buttons below. Your browser will usually save the files in <strong>Downloads</strong>. You need <code>bridge.py</code> (the local connector) and <code>LegnoovaBridgeEA.mq5</code> (the MT5 robot). No card or broker password is needed for these files.
        </Step>
        <div className="flex flex-wrap gap-3">
          <DownloadLink href="/api/automation/download/bridge" icon={Download}>Download Python bridge</DownloadLink>
          <DownloadLink href="/api/automation/download/ea" icon={Download}>Download MT5 Expert Advisor</DownloadLink>
          <DownloadLink href="/api/automation/download/guide" icon={ListChecks}>Download full guide</DownloadLink>
        </div>
      </section>

      <section className="glass-panel space-y-5 p-5 sm:p-7">
        <Step number="4" title="Start the Python bridge on your computer">
          Install Python 3.10 or later if it is not already installed. Open PowerShell on Windows or Terminal on Linux, go to your Downloads folder, then run the commands for your system below. Replace only <code>PASTE_DEVICE_TOKEN_HERE</code> with the token from Step 2. Keep the quotation marks already shown around the value; do not add extra ones.
        </Step>
        <div className="grid gap-4 lg:grid-cols-2">
          <CommandCard title="Windows · PowerShell" icon={Terminal} command={`Set-Location "$HOME\\Downloads"\n$env:LEGNOOVA_API_URL = "${siteConfig.url}"\n$env:LEGNOOVA_DEVICE_TOKEN = "PASTE_DEVICE_TOKEN_HERE"\npython .\\bridge.py`} />
          <CommandCard title="Linux · Terminal" icon={Terminal} command={`cd ~/Downloads\nexport LEGNOOVA_API_URL="${siteConfig.url}"\nexport LEGNOOVA_DEVICE_TOKEN="PASTE_DEVICE_TOKEN_HERE"\npython3 bridge.py`} />
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] p-4 text-sm">
          <p className="font-semibold text-emerald-200">Where does the second token go?</p>
          <p className="mt-1 leading-6 text-muted-foreground">When the bridge starts for the first time, it creates a separate <strong>local bridge token</strong> and prints its file path. Keep the bridge terminal open. Later, copy the file contents with the command below and paste them into the MT5 EA&apos;s <code>LocalBridgeToken</code> input in Step 6.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <code className="rounded-lg bg-black/30 p-3 text-xs text-emerald-100">{'Get-Content "$HOME\.legnoova\mt5-bridge-local-token"'}</code>
            <code className="rounded-lg bg-black/30 p-3 text-xs text-emerald-100">cat ~/.legnoova/mt5-bridge-local-token</code>
          </div>
          <p className="mt-2 text-xs text-amber-200/80">The Legnoova device token goes in the Python command. The local bridge token goes in MT5. They are different—never post either one in a message, screenshot, or source file.</p>
        </div>
      </section>

      <section className="glass-panel space-y-5 p-5 sm:p-7">
        <Step number="5" title="Let MT5 talk to the local bridge">
          In MT5, open <strong>Tools → Options → Expert Advisors</strong>. Turn on <strong>Allow WebRequest for listed URL</strong>, add exactly <code>http://127.0.0.1:8765</code>, then click OK. This address points to the bridge on your own computer. Do not open this port to the internet.
        </Step>
        <p className="rounded-lg bg-white/[0.03] p-3 text-sm text-muted-foreground">If the option is unavailable or requests fail, check the MT5 Journal/Experts tabs and make sure the Python bridge terminal is still running.</p>
      </section>

      <section className="glass-panel space-y-5 p-5 sm:p-7">
        <Step number="6" title="Install and attach the Legnoova Expert Advisor">
          In MT5 choose <strong>File → Open Data Folder</strong>. Open <code>MQL5</code>, then <code>Experts</code>. Copy <code>LegnoovaBridgeEA.mq5</code> from Downloads into that folder. In MT5 press <strong>F4</strong> to open MetaEditor, find the file under Expert Advisors, open it, and press <strong>F7</strong> to compile. Check the bottom panel says <strong>0 errors</strong>. Return to MT5, right-click Expert Advisors in Navigator and choose Refresh, then drag LegnoovaBridgeEA onto the chart for the pair you want.
        </Step>
        <p className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.05] p-3 text-sm leading-6 text-muted-foreground">After attaching the EA and starting the bridge, open <Link className="text-emerald-300 underline" href="/app/automation">Broker Automation</Link>. A cloud-reported heartbeat confirms the bridge and EA inputs; it updates while the bridge is running. Download and compile the latest EA if the heartbeat does not arrive.</p>
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
          <h3 className="font-semibold">EA Inputs to set</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><code>BridgeUrl</code> — leave as <code>http://127.0.0.1:8765</code>.</li>
            <li><code>LocalBridgeToken</code> — paste the local token file contents from Step 4.</li>
            <li><code>ExecutionEnabled</code> — keep <code>false</code> for your first connection check.</li>
            <li><code>AllowLiveAccount</code> — keep <code>false</code> while testing on demo.</li>
            <li>Leave the 0.5% risk cap and 0.1 maximum-lot limit unchanged while testing.</li>
          </ul>
          <p className="mt-3 text-xs text-amber-200/80">Do not enable live-account trading until you have reviewed the EA and completed demo testing. A successful compile alone does not validate trading behavior.</p>
        </div>
      </section>

      <section className="glass-panel space-y-4 p-5 sm:p-7">
        <Step number="7" title="Select a mode, strategy, and test on demo">
          For normal automation, open <Link className="text-emerald-300 underline" href="/app/automation">Broker Automation</Link>, confirm the demo heartbeat, and activate Normal. Then choose <strong>Trend-Pullback Confluence</strong> on Chart Analysis to publish signals. For autonomous scalping, attach the EA to an M1 chart, set <code>ExecutionEnabled=true</code> while connected to demo, keep <code>AllowLiveAccount=false</code>, and activate <strong>M1 Scalping · Demo only</strong> in Broker Automation. No chart screenshot is needed: on each closed M1 candle the EA checks for a large directional body (at least 65% of candle range) closing near its high or low, then sets an ATR-based stop and 1.2R target. It only enters once per new candle and waits for a fresh setup after a trade closes.
        </Step>
        <div className="flex items-start gap-3 rounded-xl border border-amber-400/25 bg-amber-400/[0.06] p-4">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
          <div><p className="font-semibold text-amber-100">Before enabling execution</p><p className="mt-1 text-sm leading-6 text-muted-foreground">Automation is off by default. After the setup is connected, use Broker Automation to arm it; set <code>ExecutionEnabled</code> in the EA only on demo. Normal mode allows up to 0.5% risk; autonomous scalping risks about $4 per entry on $8,000 equity (0.05%), allows at most 40 entries/day and 10 in two minutes, and has a 0.5% daily loss stop. The two-minute rate is a safety ceiling, not a trade target. Signals can be wrong; slippage can exceed the planned loss and no profit is promised.</p></div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
        <h2 className="font-semibold">If something does not work</h2>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li><strong>EA says WebRequest failed:</strong> check the allowed URL is exactly <code>http://127.0.0.1:8765</code> and Python is still running.</li>
          <li><strong>401 / unauthorized:</strong> the Legnoova device token belongs in the Python command; the local bridge token belongs in EA Inputs. Create a fresh device token if needed.</li>
          <li><strong>No signal appears:</strong> ensure dashboard automation is enabled and the chart was analyzed with Trend-Pullback Confluence and passed its filters.</li>
          <li><strong>Symbol unavailable:</strong> your broker may use a suffix or different symbol name. The EA stops on ambiguous names rather than guessing.</li>
        </ul>
      </section>

      <section className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 text-sm text-muted-foreground">
        <h2 className="mb-2 font-semibold text-foreground">Official MetaTrader references</h2>
        <ul className="space-y-1"><li><a className="text-emerald-300 underline" href="https://www.mql5.com/en/articles/625" target="_blank" rel="noreferrer">MetaTrader 5 on Linux (Wine)</a></li><li><a className="text-emerald-300 underline" href="https://www.mql5.com/en/docs/network/webrequest" target="_blank" rel="noreferrer">WebRequest allow-list rules</a></li><li><a className="text-emerald-300 underline" href="https://www.metatrader5.com/en/terminal/help/algotrading/testing" target="_blank" rel="noreferrer">Test an Expert Advisor on demo/history</a></li><li><a className="text-emerald-300 underline" href="https://www.mql5.com/en/docs/trading/ordercheck" target="_blank" rel="noreferrer">OrderCheck</a> · <a className="text-emerald-300 underline" href="https://www.mql5.com/en/docs/trading/ordersend" target="_blank" rel="noreferrer">OrderSend</a></li></ul>
      </section>
    </div>
  );
}

function Step({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return <div className="flex gap-4"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-sm font-bold text-emerald-300">{number}</span><div><h2 className="font-heading font-semibold">{title}</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">{children}</p></div></div>;
}

function DownloadLink({ href, icon: Icon, children }: { href: string; icon: typeof Download; children: React.ReactNode }) {
  return <a href={href} className="inline-flex h-10 items-center rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm font-medium hover:bg-white/[0.08]"><Icon className="mr-2 h-4 w-4"/>{children}</a>;
}

function CommandCard({ title, icon: Icon, command }: { title: string; icon: typeof Terminal; command: string }) {
  return <div className="glass-panel min-w-0 p-4"><h3 className="flex items-center gap-2 text-sm font-semibold"><Icon className="h-4 w-4 text-emerald-400"/>{title}</h3><pre className="mt-3 overflow-x-auto rounded-lg bg-black/30 p-4 text-xs leading-6 text-emerald-100">{command}</pre></div>;
}
