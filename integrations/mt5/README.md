# Legnoova MT5 bridge (customer-hosted)

The Python relay and MT5 Expert Advisor run on the customer's own computer. The relay uses only Python's standard library, so it works on Windows and Linux. MT5 itself must also be installed and signed in: MetaQuotes' Python MT5 package is Windows-only, so this bridge deliberately uses an Expert Advisor for terminal access and order execution.

No separate bridge server or paid VPS is required. The computer, Python relay and MT5 terminal must stay on and connected; automation pauses when they stop. Linux users need an MT5 terminal that works in their environment (commonly through Wine); MetaQuotes does not provide a native Linux Python MT5 wheel.

## 1. Create a private device token

1. Sign in to a Legnoova **Broker** plan.
2. Open **Broker Automation** in the dashboard sidebar.
3. Create an MT5 device token. Copy it immediately; Legnoova stores only its hash and cannot show it again.
4. Keep the token private. If it is exposed, revoke it in the dashboard and create another.

Automation starts **off**. The bridge only receives the signed-in user's own published chart signals. It does not read or upload broker passwords.

## 2. Run the Python relay

Use Python 3.10 or newer. The bridge has no third-party Python dependencies.

Windows PowerShell:

```powershell
$env:LEGNOOVA_API_URL = "https://legnoova.com"
$env:LEGNOOVA_DEVICE_TOKEN = "PASTE_YOUR_DEVICE_TOKEN_LOCALLY"
python integrations/mt5/bridge.py
```

Linux shell:

```sh
export LEGNOOVA_API_URL="https://legnoova.com"
export LEGNOOVA_DEVICE_TOKEN="PASTE_YOUR_DEVICE_TOKEN_LOCALLY"
python3 integrations/mt5/bridge.py
```

On first run, the bridge creates a separate local token in your user profile and prints its file path. It reuses that token on future runs. Read the file contents and paste them into the EA's `LocalBridgeToken` input (PowerShell: `Get-Content "$HOME\.legnoova\mt5-bridge-local-token"`; Linux: `cat ~/.legnoova/mt5-bridge-local-token`). Do not put either token in source files, screenshots, chat, or logs.

## 3. Install the Expert Advisor

1. Open MT5 and sign in to the trading account on which you want the EA to run.
2. In **Tools → Options → Expert Advisors**, add exactly `http://127.0.0.1:8765` to the allowed WebRequest URLs. MT5 blocks WebRequest unless the user adds the URL.
3. Open `integrations/mt5/LegnoovaBridgeEA.mq5` in MetaEditor and compile it.
4. Attach **LegnoovaBridgeEA** to a chart. Set `BridgeUrl` to `http://127.0.0.1:8765` and `LocalBridgeToken` to the local bridge token from step 2. The default poll interval is 15 seconds to limit app requests; reduce it only after checking hosting quotas and considering request load.
5. Leave `ExecutionEnabled=false` and `AllowLiveAccount=false` for the first test. Confirm the terminal is a demo account, Algo Trading is enabled, polling works, and the signal/symbol/risk checks behave as expected.
6. Automation must be enabled in the Legnoova dashboard and in the EA input. The first version caps risk at 0.5% of account equity per trade; the EA also has a local maximum-risk cap, maximum-lot cap, maximum-entry-drift limit and one-open-position default. Use a demo account until you have reviewed the code and independently tested it.
7. From the dashboard, click **Check MT5 connection**. The read-only check verifies cloud access, the current eligible signal queue, the local bridge, a recent EA heartbeat, and MT5 execution/trading-permission inputs. If the EA heartbeat is missing, download and compile the latest EA. A healthy connection does not mean a trade is due: only new signals passing all automation filters are sent, and broker rejections are possible.

## Optional M1 scalping demo test

This is a bounded **demo-only test mode**, not a live-price scalper and not a hundreds-of-orders feature. Chart analysis is still a manual screenshot upload; it does not continuously watch candles or create repeated entries. Pause automation, choose **M1 Scalping · Demo only** in Broker Automation, save the mode (this skips older queued signals), then explicitly re-enable it. On Chart Analysis, choose **M1 Scalping (Demo)**, upload a chart that visibly shows M1, and analyze a new setup. The API only queues signals that pass the M1-specific evidence gate and match the saved mode.

The EA independently refuses scalping signals outside demo accounts or off an M1 chart. Hard limits are one open position, 0.25% maximum risk per entry, 30 points maximum spread, 120-second signal age, three EA entries per broker-server day, and a 1% daily loss stop. M1 scalping signals require a visible target at 1.2R or better before costs; spread, commission, slippage, and execution can still make an outcome negative. This mode will not make hundreds of trades. Test first in Strategy Tester and then on demo; do not use these settings as evidence of profitability or readiness for live trading.

## Signal and execution rules

- The API only queues the authenticated user's own published, active BUY/SELL signals made with **Trend-Pullback Confluence**; it does not trade neutral or shared market-feed signals.
- A signal must have a model-provided visible target, score at least 75/100, target at 1.5R or better, four of six checklist items confirmed, at least two aligned strategy assessments, and no strong opposing assessment. This score is not a win probability; no 85% win-rate claim is made.
- One signal is leased at a time and acknowledged by its signal ID. The EA checks its trade history for the signal marker before retrying, to reduce duplicate orders after a lost response.
- The EA rejects stale signals, missing/incorrect stop or target levels, ambiguous broker symbols, excessive entry drift, disabled Algo Trading, and risk volumes below the broker minimum.
- The EA calculates volume from account equity, configured risk percent and the stop distance, checks symbol volume rules, calls `OrderCheck`, then checks the MT5 trade-server return code from `OrderSend`.
- `OrderSend` acceptance is not by itself proof of a completed trade. Check the EA result/status and MT5 account history.
- This integration is early-stage. Broker execution, symbol naming, slippage, market hours, stop-distance rules, network outages and MT5 builds vary. Do not assume profitability or unattended safety.

## Official references

- MetaQuotes: [MetaTrader 5 on Linux](https://www.mql5.com/en/articles/625)
- MetaQuotes: [WebRequest](https://www.mql5.com/en/docs/network/webrequest) (allowed URLs; EA/script context)
- MetaQuotes: [OrderCheck](https://www.mql5.com/en/docs/trading/ordercheck)
- MetaQuotes: [OrderSend](https://www.mql5.com/en/docs/trading/ordersend) (inspect trade-server return codes)
- MetaQuotes: [Python integration](https://www.mql5.com/en/docs/python_metatrader5) and [published package wheels](https://pypi.org/project/MetaTrader5/#files) (Windows x86-64 only; not used by this cross-platform bridge)
