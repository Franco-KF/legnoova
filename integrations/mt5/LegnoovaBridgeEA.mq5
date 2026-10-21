#property strict
#property version "0.3"
#property description "Legnoova MT5 bridge. Demo-only and disabled until explicitly configured."

input bool ExecutionEnabled = false;
input bool AllowLiveAccount = false;
input double MaximumRiskPercent = 0.5;
input double MaximumLots = 0.10;
input int MaximumOpenPositions = 1;
input int MaximumSignalAgeSeconds = 300;
input int MaximumEntryDriftPoints = 150;
input string BridgeUrl = "http://127.0.0.1:8765";
input string LocalBridgeToken = "";
input int PollSeconds = 15;

bool g_busy = false;
string g_diagnosticStatus = "starting";

string JsonString(const string json, const string key)
{
   string marker = "\"" + key + "\":\"";
   int start = StringFind(json, marker);
   if(start < 0) return "";
   start += StringLen(marker);
   int end = StringFind(json, "\"", start);
   if(end < 0) return "";
   return StringSubstr(json, start, end - start);
}

double JsonNumber(const string json, const string key)
{
   string marker = "\"" + key + "\":";
   int start = StringFind(json, marker);
   if(start < 0) return 0.0;
   start += StringLen(marker);
   int end = start;
   while(end < StringLen(json))
   {
      ushort ch = StringGetCharacter(json, end);
      if((ch >= '0' && ch <= '9') || ch == '.' || ch == '-') end++;
      else break;
   }
   if(end == start) return 0.0;
   return StringToDouble(StringSubstr(json, start, end - start));
}

bool JsonBool(const string json, const string key)
{
   string marker = "\"" + key + "\":";
   int start = StringFind(json, marker);
   if(start < 0) return false;
   start += StringLen(marker);
   return StringSubstr(json, start, 4) == "true";
}

bool Request(const string method, const string path, const string payload, string &response)
{
   if(StringLen(LocalBridgeToken) < 32) return false;
   char data[], result[];
   if(payload != "")
   {
      StringToCharArray(payload, data, 0, WHOLE_ARRAY, CP_UTF8);
      ArrayResize(data, ArraySize(data) - 1);
   }
   string headers = "Authorization: Bearer " + LocalBridgeToken + "\r\nContent-Type: application/json\r\n";
   string responseHeaders;
   int code = WebRequest(method, BridgeUrl + path, headers, 5000, data, result, responseHeaders);
   if(code < 200 || code >= 300) return false;
   response = CharArrayToString(result, 0, WHOLE_ARRAY, CP_UTF8);
   return true;
}

bool Ack(const string id, const string status, const string orderId="")
{
   string payload = "{\"signalId\":\"" + id + "\",\"status\":\"" + status + "\",\"brokerOrderId\":\"" + orderId + "\"}";
   string response;
   return Request("POST", "/ack", payload, response);
}

void SendDiagnostic()
{
   string payload = "{\"executionEnabled\":" + (ExecutionEnabled ? "true" : "false")
      + ",\"terminalTradeAllowed\":" + (TerminalInfoInteger(TERMINAL_TRADE_ALLOWED) ? "true" : "false")
      + ",\"accountTradeAllowed\":" + (AccountInfoInteger(ACCOUNT_TRADE_ALLOWED) ? "true" : "false")
      + ",\"expertTradeAllowed\":" + (AccountInfoInteger(ACCOUNT_TRADE_EXPERT) ? "true" : "false")
      + ",\"demoAccount\":" + (AccountInfoInteger(ACCOUNT_TRADE_MODE) == ACCOUNT_TRADE_MODE_DEMO ? "true" : "false")
      + ",\"liveTradingAllowed\":" + (AllowLiveAccount ? "true" : "false")
      + ",\"status\":\"" + g_diagnosticStatus + "\"}";
   string response;
   Request("POST", "/diagnostic", payload, response);
}

string NormalizeSymbol(const string value)
{
   string result = value;
   StringToUpper(result);
   StringReplace(result, "/", "");
   StringReplace(result, "_", "");
   StringReplace(result, "-", "");
   return result;
}

string ResolveSymbol(const string requested)
{
   string wanted = NormalizeSymbol(requested);
   if(wanted == "") return "";
   if(SymbolSelect(requested, true)) return requested;
   string found = "";
   for(int i=0; i<SymbolsTotal(false); i++)
   {
      string candidate = SymbolName(i, false);
      string normalized = NormalizeSymbol(candidate);
      if(normalized == wanted || StringFind(normalized, wanted) == 0)
      {
         if(found != "") return ""; // Ambiguous broker suffix: require an exact symbol.
         found = candidate;
      }
   }
   if(found != "" && SymbolSelect(found, true)) return found;
   return "";
}

string SignalComment(const string id)
{
   return "LV" + StringSubstr(id, 0, 20);
}

bool AlreadyExecuted(const string id)
{
   string comment = SignalComment(id);
   for(int i=0; i<PositionsTotal(); i++)
   {
      ulong ticket = PositionGetTicket(i);
      if(ticket > 0 && PositionGetString(POSITION_COMMENT) == comment) return true;
   }
   if(!HistorySelect(TimeCurrent() - 30 * 86400, TimeCurrent())) return false;
   for(int i=0; i<HistoryDealsTotal(); i++)
   {
      ulong ticket = HistoryDealGetTicket(i);
      if(ticket > 0 && HistoryDealGetString(ticket, DEAL_COMMENT) == comment) return true;
   }
   return false;
}

int VolumeDigits(const double step)
{
   if(step >= 1.0) return 0;
   if(step >= 0.1) return 1;
   if(step >= 0.01) return 2;
   if(step >= 0.001) return 3;
   return 4;
}

double VolumeForRisk(const string symbol, const ENUM_ORDER_TYPE side, const double price, const double stop, const double riskPercent)
{
   double oneLotLoss = 0.0;
   if(!OrderCalcProfit(side, symbol, 1.0, price, stop, oneLotLoss) || oneLotLoss >= 0.0) return 0.0;
   double riskMoney = AccountInfoDouble(ACCOUNT_EQUITY) * riskPercent / 100.0;
   double rawLots = riskMoney / MathAbs(oneLotLoss);
   double step = SymbolInfoDouble(symbol, SYMBOL_VOLUME_STEP);
   double minLots = SymbolInfoDouble(symbol, SYMBOL_VOLUME_MIN);
   double maxLots = MathMin(SymbolInfoDouble(symbol, SYMBOL_VOLUME_MAX), MaximumLots);
   if(step <= 0.0 || maxLots < minLots) return 0.0;
   double lots = MathFloor(rawLots / step) * step;
   if(lots > maxLots) lots = MathFloor(maxLots / step) * step;
   if(lots < minLots) return 0.0; // Never round upward past the user's risk cap.
   return NormalizeDouble(lots, VolumeDigits(step));
}

bool ExecuteSignal(const string json, string &status, string &orderId)
{
   string id = JsonString(json, "id");
   string requestedSymbol = JsonString(json, "symbol");
   string direction = JsonString(json, "direction");
   double entry = JsonNumber(json, "entryPrice");
   double stop = JsonNumber(json, "stopLoss");
   double target = JsonNumber(json, "takeProfit");
   double riskPercent = JsonNumber(json, "riskPercent");
   double createdAt = JsonNumber(json, "createdAt");
   status = "invalid_signal";
   orderId = "";
   if(StringLen(id) != 24 || entry <= 0 || stop <= 0 || target <= 0 || riskPercent <= 0 || riskPercent > MaximumRiskPercent) return false;
   if(createdAt > 0 && TimeCurrent() - (datetime)createdAt > MaximumSignalAgeSeconds) { status = "stale_signal"; return false; }
   if(!ExecutionEnabled) { status = "execution_off"; return false; }
   if(!AllowLiveAccount && AccountInfoInteger(ACCOUNT_TRADE_MODE) != ACCOUNT_TRADE_MODE_DEMO) { status = "demo_only"; return false; }
   if(!AccountInfoInteger(ACCOUNT_TRADE_ALLOWED) || !AccountInfoInteger(ACCOUNT_TRADE_EXPERT) || !TerminalInfoInteger(TERMINAL_TRADE_ALLOWED)) { status = "trading_disabled"; return false; }
   if(AlreadyExecuted(id)) { status = "already_executed"; return true; }
   if(MaximumOpenPositions < 1 || PositionsTotal() >= MaximumOpenPositions) { status = "position_limit"; return false; }

   string symbol = ResolveSymbol(requestedSymbol);
   if(symbol == "") { status = "symbol_unavailable"; return false; }
   MqlTick tick;
   if(!SymbolInfoTick(symbol, tick)) { status = "quote_unavailable"; return false; }
   ENUM_ORDER_TYPE side;
   double price;
   if(direction == "buy") { side = ORDER_TYPE_BUY; price = tick.ask; }
   else if(direction == "sell") { side = ORDER_TYPE_SELL; price = tick.bid; }
   else return false;
   double point = SymbolInfoDouble(symbol, SYMBOL_POINT);
   int digits = (int)SymbolInfoInteger(symbol, SYMBOL_DIGITS);
   if(point <= 0 || MathAbs(price - entry) / point > MaximumEntryDriftPoints) { status = "price_drift"; return false; }
   if((side == ORDER_TYPE_BUY && !(stop < price && target > price)) || (side == ORDER_TYPE_SELL && !(stop > price && target < price))) { status = "invalid_levels"; return false; }

   double lots = VolumeForRisk(symbol, side, price, stop, riskPercent);
   if(lots <= 0) { status = "risk_below_minimum_lot"; return false; }
   MqlTradeRequest request = {};
   MqlTradeCheckResult check = {};
   MqlTradeResult result = {};
   request.action = TRADE_ACTION_DEAL;
   request.symbol = symbol;
   request.volume = lots;
   request.type = side;
   request.price = SymbolInfoInteger(symbol, SYMBOL_TRADE_EXEMODE) == SYMBOL_TRADE_EXECUTION_MARKET
      ? 0.0
      : NormalizeDouble(price, digits);
   request.sl = NormalizeDouble(stop, digits);
   request.tp = NormalizeDouble(target, digits);
   request.deviation = 20;
   request.magic = 741205;
   request.comment = SignalComment(id);
   long filling = SymbolInfoInteger(symbol, SYMBOL_FILLING_MODE);
   if((filling & SYMBOL_FILLING_IOC) == SYMBOL_FILLING_IOC) request.type_filling = ORDER_FILLING_IOC;
   else if((filling & SYMBOL_FILLING_FOK) == SYMBOL_FILLING_FOK) request.type_filling = ORDER_FILLING_FOK;
   else if(SymbolInfoInteger(symbol, SYMBOL_TRADE_EXEMODE) != SYMBOL_TRADE_EXECUTION_MARKET) request.type_filling = ORDER_FILLING_RETURN;
   else { status = "unsupported_filling_mode"; return false; }

   if(!OrderCheck(request, check) || check.retcode != 0) { status = "order_check_failed"; return false; }
   if(!OrderSend(request, result)) { status = "order_send_failed"; return false; }
   if(result.retcode != TRADE_RETCODE_DONE && result.retcode != TRADE_RETCODE_DONE_PARTIAL && result.retcode != TRADE_RETCODE_PLACED) { status = "order_rejected"; return false; }
   if(result.retcode == TRADE_RETCODE_DONE_PARTIAL) status = "partial_fill";
   else if(result.retcode == TRADE_RETCODE_PLACED) status = "order_placed";
   else status = "executed";
   orderId = IntegerToString((long)result.order);
   return true;
}

void OnTimer()
{
   if(g_busy) return;
   g_busy = true;
   if(!ExecutionEnabled) g_diagnosticStatus = "execution_off";
   else if(!TerminalInfoInteger(TERMINAL_TRADE_ALLOWED) || !AccountInfoInteger(ACCOUNT_TRADE_ALLOWED) || !AccountInfoInteger(ACCOUNT_TRADE_EXPERT)) g_diagnosticStatus = "trading_disabled";
   else if(!AllowLiveAccount && AccountInfoInteger(ACCOUNT_TRADE_MODE) != ACCOUNT_TRADE_MODE_DEMO) g_diagnosticStatus = "demo_only";
   else g_diagnosticStatus = "polling";
   string json;
   if(Request("GET", "/signal", "", json))
   {
      string id = JsonString(json, "id");
      if(id != "")
      {
         if(!ExecutionEnabled)
         {
            g_diagnosticStatus = "execution_off";
            Comment("Legnoova MT5: execution is OFF; signal is left queued.");
            SendDiagnostic();
            g_busy = false;
            return;
         }
         if(!AllowLiveAccount && AccountInfoInteger(ACCOUNT_TRADE_MODE) != ACCOUNT_TRADE_MODE_DEMO)
         {
            g_diagnosticStatus = "demo_only";
            Comment("Legnoova MT5: demo-only mode; signal is left queued.");
            SendDiagnostic();
            g_busy = false;
            return;
         }
         string status, orderId;
         ExecuteSignal(json, status, orderId);
         g_diagnosticStatus = status;
         if(!Ack(id, status, orderId)) g_diagnosticStatus = "ack_failed";
         Comment("Legnoova MT5: signal ", id, " — ", status);
      }
      else if(!JsonBool(json, "enabled")) g_diagnosticStatus = "dashboard_disabled";
      else g_diagnosticStatus = "waiting_for_signal";
   }
   else g_diagnosticStatus = "bridge_unavailable";
   SendDiagnostic();
   g_busy = false;
}

int OnInit()
{
   if(PollSeconds < 2 || MaximumRiskPercent <= 0 || MaximumRiskPercent > 2 || MaximumLots <= 0 || MaximumOpenPositions < 1) return INIT_PARAMETERS_INCORRECT;
   EventSetTimer(PollSeconds);
   return INIT_SUCCEEDED;
}

void OnDeinit(const int reason) { EventKillTimer(); }
