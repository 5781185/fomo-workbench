# 專案簡報：FOMO Workbench（本機金融智能工作台）

> 這份檔案命名為 `CLAUDE.md` 並非偶然——把它放在專案根目錄，Claude Code 每次啟動時會自動讀取，不需要每次重新解釋這個專案的來龍去脈。

## 專案背景與目標

這是一個受 [God's Eye View](https://github.com/bilawalsidhu/gods-eye-view)（把多個即時開放資料源整合進單一 3D 視覺化「駕駛艙」的開源專案）啟發的**金融版整合工作台**，做為 FinTech 碩士開學前的個人作品集專案，與現有的 RegTech 監理雷達專案（另一個獨立作品）分開。

核心精神跟 God's Eye View 一樣：把原本分散的資料源／能力整合進「同一個看板」，但套用到金融研究情境。經過比較 OpenBB、OpenTerminalUI、BLMTRM、Pulsar、QuantBrief、AI4Finance Foundation（FinRL/FinGPT）六個開源專案後，決定採用**簡化為兩層的架構**（原因見下方「架構決策」），但 UI 層的落地方式因為下方「近況更新」提到的原因有調整。

## 架構決策：為什麼是這兩層，不是更多

| 層 | 選用 | 角色 |
|---|---|---|
| 資料層 | **OpenBB Open Data Platform (ODP)** | 資料整合（不含 Workspace，原因見「近況更新」） |
| 智能層 | **AI4Finance Foundation**（FinRL + FinGPT） | 量化訊號（FinRL）+ 財經文本洞見（FinGPT） |
| UI 層 | **自建 Web Dashboard**（React + Vite + Tailwind + TradingView Lightweight Charts，見 Phase 6） | 暫代原本規劃的 OpenBB Workspace，視覺走 OKX / Robinhood 那種深色科技感 |

**明確不採用的東西，以及原因**（避免之後又被拉回去重新評估）：

- **OpenTerminalUI / BLMTRM**：這兩個專案有明顯的「AI 快速生成、多帳號近乎原樣 fork」的紅旗，原創性與長期維護狀況存疑，只值得參考單一功能點子（如情緒指標小工具），不值得整包安裝——**這個結論在下方「近況更新」發生之後依然不變**：Workspace 現況不確定不代表 OpenTerminalUI/BLMTRM 的既有問題（來源不明、維護狀況存疑）就消失了，兩個獨立的風險不能互相抵銷,不要因為 Workspace 現況變動就把它們拉回來。
- **QuantBrief**：資料抓取管線是寫死的，跟 OpenBB 沒有現成橋接。它的「排程式洞見簡報」*模式*值得保留，但改用 FinGPT（金融領域微調過的模型）實作，而不是照抄 QuantBrief 的程式碼本體。
- **Pulsar**：沒有直接借用的程式碼，但它的策略教訓（深耕一個窄領域，而非橫向覆蓋所有資產類別）保留為之後選擇「這個工作台要重點服務哪個市場/主題」時的參考原則。

**選擇 OpenBB + AI4Finance 而非其他組合的關鍵理由**：這兩個是六個專案裡唯一有正式治理結構、長期維護紀錄的。AI4Finance 是 2024 年 IRS 認證的 501(c)(3) 非營利基金會，這個判斷不受下方近況更新影響。OpenBB 原本的判斷是「公司化維運」，但這一點在 2026 年 8 月之後有變化，請見下一節。兩者的架構設計本身仍然偏向「可重組」——OpenBB ODP 有官方的 custom-backend / MCP 擴充機制，FinRL-Meta 把市場環境設計成可替換的抽象層,FinGPT 也支援換不同基礎模型/供應商。這代表串接它們架構上仍然合理，工程量可控。

## 近況更新（2026 年 9 月）：OpenBB Workspace 現況與因應

**發生了什麼事**：OpenBB Inc.（開發並商業化維運 OpenBB 的公司）在 2026 年 8 月宣布逐步結束公司營運（"sunset"），並承諾把整個產品線（Workspace、ODP、Copilot、Excel Add-in）用寬鬆授權開源釋出。但官方原文明講「我們會陸續公布各項釋出的順序與時程，同時決定合適的長期治理結構」——也就是說，**開源釋出的具體時程與後續維護方式,在宣布當下都還沒定案**。目前已知：
- `pro.openbb.co`（Workspace 的官方託管服務）的新帳號註冊已關閉，這跟公司收攤的時程一致，你自己也已經遇到「Registration is disabled」。
- FINOS（金融業開源基金會）目前有一個**提案中**（尚未定案）要接手 Workspace 的程式碼，但提案原文明講這會是「公司收攤前的最後快照，用於歷史留存」（"a final snapshot for historical purposes"），不是保證有人接手持續開發。

**這對這個專案的影響，以及為什麼不要現在拉 OpenTerminalUI/BLMTRM 進來**：
1. **資料層（ODP）不受影響，繼續用**：`openbb`／`openbb-api`／`openbb-mcp` 這幾個套件本身是獨立的開源函式庫，不需要 Workspace 帳號就能跑（`openbb-api` 本來就是純本機服務），公司收攤不影響你能不能繼續 `pip install` 這些套件、繼續拿到已經發布的版本。
2. **Workspace（UI 層）現階段不可靠，不值得等，也不值得用 OpenTerminalUI/BLMTRM 取代**：等 Workspace 真的開源、且確認有人（例如 FINOS）長期維護，時程未知，可能要等很久，也可能最後只是一份不會再更新的歷史快照——不值得把這個專案卡在這個不確定性上。但 OpenTerminalUI/BLMTRM 原本就有的問題（來源不明、可能是 AI 快速生成的 fork、維護狀況存疑）並沒有因為這件事而消失，把它們拉進來是拿一個新的不確定性去換舊的不確定性，不是真的解決問題。
3. **真正的解法：跳過 Workspace，自己寫一個輕量 dashboard，直接呼叫 ODP 的 REST API**。這條路完全不依賴 Workspace 帳號或它的開源時程，用 React + Vite + Tailwind 做一個單頁 dashboard（見 Phase 6）就能做，而且 Phase 4、5 做的自訂 API/agent 本體完全不用改——換的只是「誰來呼叫它」，從「Workspace 的 widget 系統」換成「自己寫的網頁」。如果之後 FINOS 真的把 Workspace 養起來、確認有穩定的自架方式,再把這些端點另外接進去也不遲，屆時是加一個新的呼叫方，不是砍掉重練。

## 範疇守則（Non-Goals）

執行以下步驟時，請嚴格遵守，不要自行擴大範疇：

1. **不要**安裝或整合 OpenTerminalUI、BLMTRM、QuantBrief 的程式碼本體。
2. **不要**現階段嘗試做 3D 地球儀視覺化（God's Eye View 的美術風格），先把架構基礎打穩。
3. **不要**一次把所有可能的 widget / agent 工具都做出來——先做一個最小可行的垂直切片（一個 FinRL 訊號端點 + 一個 FinGPT 洞見 agent 工具 + 一個能同時顯示兩者的 dashboard 單頁），確認整條路徑通了，再逐步擴充。
4. **不要**把 OpenBB / FinRL / FinGPT 的原始碼 fork 下來修改內部邏輯——一律當成透過 `pip install` / `git clone` 取得的**依賴套件**使用，這樣才能持續吃到上游社群的維護與更新（細節見「延伸與維護原則」一節）。
5. **不要**因為 Workspace 現況不確定就倒退去拉 OpenTerminalUI/BLMTRM 進來，理由見上方「近況更新」第 2 點。

## 目前狀態（2026-10-08）

Phase 1–17 全部完成。Phase 1–16 的逐步決策紀錄在 `docs/phases.md`；Phase 17（FinRL 三個模型籃）與 10 月的幾次修復只記在本檔的「已知的坑」與 git log 裡。給人看的英文說明在 `README.md`（含截圖）。2026-10-31 起有引擎評分（`agent/review.py`，見「已知的坑」的〈引擎評分〉）。

**四個服務**（日常用 ODP Desktop 的 Backends 畫面啟動，順序 API → MCP → backend → agent；Claude Code session 用 `.claude/launch.json`，同一組指令）：

| 埠 | 服務 | 環境 | 指令 |
|---|---|---|---|
| 6900 | `openbb-api`（OpenBB Platform REST，**3 個 worker**） | ODP conda env（`~/OpenBB/conda/envs/openbb`）或 `envs/openbb` | `uvicorn openbb_platform_api.main:app --host 127.0.0.1 --port 6900 --workers 3` |
| 8005 | `openbb-mcp`（給 agent 的 MCP 工具源） | 同上 | `openbb-mcp --transport streamable-http --host 127.0.0.1 --port 8005 --allowed-categories equity,news,index --default-categories equity,news,index` |
| 8001 | `openbb-backend/`（FinRL 訊號、EPS 趨勢、13F、Yahoo 即時 SSE；**同時 serve `ui/dist`，`http://localhost:8001/` 就是 dashboard**） | `envs/finrl` | `envs/finrl/bin/uvicorn main:app --port 8001 --app-dir openbb-backend` |
| 8010 | `agent/`（Gemini tool-use 迴圈 + `fingpt_forecast`） | `envs/fingpt` | `envs/fingpt/bin/uvicorn main:app --port 8010 --app-dir agent` |

**改完程式要做什麼**：
- 改 `openbb-backend/` 或 `agent/` → 在 ODP Desktop 把該服務 **Stop → Start**（沒有 auto-reload）。agent 重啟後第一次 FinGPT 呼叫多 8 秒載模型。
- 改 `ui/` → `cd ui && npm run build`（8001 直接 serve 新的 `ui/dist`）。開發時 `npm run dev`（5173）打同一組後端。
- 改了 venv 的套件 → `uv pip freeze` 更新 `requirements/<env>.lock.txt`（安裝時用 `--no-deps`，見 README）。
- **測試**（純函式，不需要服務）：`cd ui && npx vitest run`；`cd agent && ../envs/fingpt/bin/python -m pytest`；`cd openbb-backend && ../envs/finrl/bin/python -m pytest`。改了這些純函式要跑：`applyTick`／`rrg.ts`／`squarify.ts`／`darkpool.ts`／`market/brief.ts`（`failures`／`covered`／`weekdaysBehind`）／`widgets/news.py` 的 `to_items`／`finrl_signal.py` 的 `complete_sessions`／`brief.py` 的 `_finrl_tallies`／`_summary_input`／`tools/http.py`／`_gemini_schema`／`last_complete_session`／`review.py` 的 `parse_prediction`／`forward_return`／`collect`／`score`。純邏輯放在元件旁的 `.ts` 檔（不是元件檔內），測試才 import 得到。

**程式碼位置**（自寫的膠水層約 3.4k 行，另有 510 行測試）：
- `openbb-backend/main.py` + `widgets/{finrl_signal,eps_trend,institutional,live_quote,news}.py`，`baskets.json`（FinRL 模型籃定義，Phase 17），`widgets.json`（OpenBB Workspace 規格，目前沒有消費端）
- `training/train_basket.py`：依 `baskets.json` 訓練一組籃子的 5 個 agent（`cd training && ../envs/finrl/bin/python train_basket.py tech30`，約 10–20 分鐘）
- `agent/main.py`（SSE 端點 + `/watchlist`、`/brief`、`/brief/run`）、`loop.py`（Gemini 迴圈）、`brief.py`（每日簡報 + 排程）、`resummarize.py`（補回缺失的摘要）、`review.py`（引擎評分）、`tools/{fingpt_tool,finrl_tool,http}.py`（`http.py` 是對本機服務 GET 的共用重試層）；金鑰在 `agent/.env`，watchlist 在 `agent/watchlist.json`，簡報在 `agent/briefs/<as_of>.json`（三者都 gitignore）
- `ui/src/App.tsx`（版面、`view: market|stock`、六個分頁、共用 state）、`api.ts`（所有 fetch）、`i18n.ts`（EN／繁中）、`components/{market,fundamentals,technical,news,ownership,financials}/` 一卡一檔
- gitignore 的：`FinRL/`、`FinGPT/`（上游 clone，當依賴用）、`envs/`、`finrl-work/`（訓練好的 5 個模型）

**外部相依**：Gemini API（唯一的雲端依賴，`GEMINI_MODEL` 預設 `gemini-3.6-flash`）；HF cache 裡的 Llama-2-7b + FinGPT LoRA（13 GB）；其餘全部免金鑰（yfinance／SEC／FINRA／finviz 經 openbb-api）。

## 已知的坑（改程式前先看）

**時間與盤中**
- 這台機器的系統時區不一定是台灣（實測過 BST）。**判斷盤中／收盤一律用 ET**（`zoneinfo` `America/New_York`），不要用本地時間。
- 美股盤中 yfinance 的日 K 會多一根**當天未完成**的 K 棒。FinRL 與 FinGPT 的輸入都截在「最後一個已收盤交易日」（ET 16:00 前 = 前一日；`last_complete_session()` 在兩個檔各有一份，不同 venv 不能互相 import）；FinGPT 的新聞窗口則照上游用日曆週到今天為止，兩者要分開，否則當天新聞會被切光（yfinance 新聞常常 10 則全是當天）。
- 分鐘 K 的時間戳是 ET 牆鐘字串，UI 把它當 UTC 丟給 Lightweight Charts，軸上才會顯示美東時間。

**openbb-api / yfinance**
- 一律走 openbb-api，provider 固定 `yfinance`（agent 端注入、不讓 LLM 選到付費供應商）。只有四個 widget 例外直接用 `yfinance` 套件：`eps_trend`（openbb 的 EPS 歷史／預估只有付費 provider）、`institutional`（13F 只有 fmp）、`live_quote`（openbb 沒有串流；Yahoo 非官方 WebSocket，壞了 UI 自動退回 60 秒輪詢）、`news`（見下一條）。
- **公司新聞不要走 `news/company`（2026-10 起壞掉）**：openbb 的 yfinance provider 走 `Ticker.news`，而 Yahoo 在 2026-10 初把它清空了——回 0 筆 → openbb 回 **204 No Content** → 消費端 `r.json()` 炸在空 body 上。症狀是簡報裡每天 8 個 `Expecting value: line 1 column 1`、消息面分頁顯示 no data，而且**完全沒有其他跡象**（實際無聲壞了 9 天）。升級 yfinance 沒用（1.7.0 的 `Ticker.news` 一樣是 0 筆）。`yf.Search(ticker, news_count=N).news` 仍然有資料，所以 `openbb-backend/widgets/news.py` 直接用它，UI 與 FinGPT 都改打 `8001/news/{ticker}`。Search 是文字搜尋，因此用 `relatedTickers` 含該代號當相關性過濾；時間戳是 epoch，輸出成帶 `Z` 的 UTC（openbb 原本給的是 naive 字串，瀏覽器會當成本地時間，等於每則都位移了時區差）。
- `yfinance` 釘 **0.2.66**：1.x 拿掉 `proxy` 參數會弄壞 FinRL 的 `YahooDownloader`（守則 #4 不改上游）；0.2.58 的財報資料停在 2025-05。`pip install -e FinRL` 帶依賴會把它降回 0.2.58，所以要 `--no-deps`。
- finviz provider（screener／sector groups）是同步阻塞、約 10 秒，會卡住整個 openbb-api——這是 6900 開 **3 個 worker** 的原因（`openbb-api` 啟動器的 `--workers` 有 bug，要直接起 uvicorn）。
- yfinance 偶爾會回傳「有 open/high/low/volume 但 `close` 是 `null`」的 K 棒（2026-09-23 實際遇到，那天的 09-22 就是這樣；帶 `adjustment=splits_and_dividends` 的查詢則是整根消失）。`api.ts` 的 `fetchHistory` 會過濾掉 `close == null` 的棒——在源頭擋掉，否則 TopBar 的 `last.toFixed()` 會讓整棵 React 樹崩成空白頁。
- 歷史價格也會被併發擠掉：一次 FinGPT 呼叫自己就打 4 個 openbb-api 請求，同時開個股頁會讓 `fetchHistory` 失敗、K 線**永久空白且不顯示錯誤**（2026-09-25 實際遇到，同時頂欄的公司名也消失）。`fetchHistory` 因此失敗或回空陣列時會等 1.5 秒重試一次。
- 頁面同時打多個 yfinance 請求時，`equity/profile`／`fundamental/metrics`／`share_statistics` 偶爾回缺欄位的結果；`api.ts` 的 `firstResult()` 關鍵欄位缺就等 1.5 秒重抓一次。`equity/price/quote` 欄位每次不一致，只拿公司名稱，價格一律由日 K 算。
- 欄位語意：`dividend_yield` **已是百分比**；yfinance metrics 沒有 EPS，EPS TTM = 近四季 `diluted_earnings_per_share` 加總；`capital_expenditure` 是負數（FCF = OCF + capex）；年報 `limit=5` 實際只有 4 年完整；`ownership/share_statistics` 的 `short_percent_of_float` 是小數；13F 的 `pct_held`／`pct_change` 是小數；finviz `Change %` 是小數。
- FINRA `darkpool/otc` 的 `update_date` 是**發布日**（openbb 丟掉了 `weekStartDate`）；T1 ATS 的資料週 = 發布日往前 21 天所在週的週一。
- 不能用／不要用的端點：`index/price/historical` 多 symbol 逐檔抓（6 檔 12 秒，改用 `equity/price/historical` 批次）；`shorts/fails_to_deliver`（SEC 站連不上）；`shorts/short_volume`（stockgrid 回空）；`ownership/major_holders`、`ownership/institutional`、`estimates/forward_eps`、`historical_eps` 只有付費 provider；`sec` provider 的 `insider_trading` 不理 `limit`（UI 端切）。
- 技術指標用 openbb-api `POST /technical/{sma,stoch,macd,bbands}`（body = bars），欄位名像 `close_SMA_20`、`STOCHk_14_3_3`、`close_MACD_12_26_9`、`close_BBU_20_2.0`。

**FinRL（`openbb-backend/widgets/finrl_signal.py`、`openbb-backend/baskets.json`、`training/train_basket.py`）**
- **三個模型籃**（Phase 17，`baskets.json`）：`dow30`（道瓊 30 · 2014–2025，Phase 2 原始，未固定種子）、`dow30-2019`（同成分、2019-07 起）、`tech30`（科技 30、2019-07 起，種子 2026）。後兩者成對出現是為了把「訓練期間差異」與「成分差異」分開歸因；7 檔重疊（AAPL AMZN CRM CSCO IBM MSFT NVDA）是可直接比較的樣本。
- 每個籃子的 5 個模型是**對該籃 30 檔一起決策**的（action_space=30），端點取出該 ticker 那一欄；`/finrl/signal/{ticker}` 回傳**所有包含該代號的籃子**（`{ticker, baskets:[...]}`），都不包含才 404。另有 `/finrl/baskets` 列出籃子定義。
- `baskets.json` 的 ticker 清單是**凍結的副本**，不再讀上游 `config_tickers`——模型的 action space 綁死在訓練時的那份清單與順序上，上游若更新成分股會造成無聲錯位。
- 推論用的價格窗口只取決於**成分股清單**（與訓練窗口無關），所以 `dow30` 與 `dow30-2019` 共用同一份窗口；快取是 `_windows[(as_of, 清單)]` + `_signals[(as_of, 籃子)]`，換日才清（**不要**在遇到新清單時 `clear()`，同一天兩個籃子會互相洗掉對方）。
- 新增一個籃子：`baskets.json` 加一段 → 跑 `train_basket.py <id>` → 重啟 backend（模型在 import 時載入）。模型檔不存在的籃子會被跳過並印警告，服務照常啟動。
- 資料要用 `adjustment=splits_and_dividends`（與訓練資料一致），跟 K 線圖的未還原價只有最新一天相同。
- `shares` = 模型今天的**原始意圖**（`predict × hmax`，未被現金／持股裁切），`position` = 從現金起算模擬 `EPISODE_DAYS=60` 天後的持股。agent 幾乎都在 episode 開頭建倉後長抱，所以單看「今天的 action」多半是 0；改 `EPISODE_DAYS` 會改變訊號。沒有呼叫上游 `DRL_prediction`（跑完 VecEnv 會 reset、持倉消失），自己寫了 8 行迴圈。
- 每列另有 `equity`（該 agent 60 天模擬的**整個籃子**總資產，60 個點，同一 agent 每檔相同）與 `return_pct`；UI 的「60 日模擬」欄畫成 sparkline，用來判斷五個 agent 近期誰比較可信（2026-09-21 加）。
- **`clean_data` 的隱形陷阱，訓練與推論都會中（Phase 17 實測）**：上游 `FeatureEngineer.clean_data` 會把 close 樞紐成 date×tic 後 `dropna(axis=1)`，**任何在窗口內有缺日的成分股會被整檔刪掉、不報錯**——用 2014 起點訓練 tech30 會 30 檔進、28 檔出（CRWD、UBER 消失），你還以為訓練了 30 檔。`train_basket.py` 因此把「有成分股被刪」與「網格有缺格」都改成硬錯誤。（script 1 後面那個 `fillna(0)` 作用在已清洗的資料上，實際是空操作，不是這個問題的來源。）
- **推論端同一個陷阱（2026-09-24 實際發生）**：yfinance 會發布「只有部分成分股」的交易日（09-22 那天道瓊 30 只有 11 檔有資料），`clean_data` 於是刪掉其餘 19 檔 → `state_space` 變 111 → 模型報 `Unexpected observation shape`、端點 500。`build_window` 現在先用 `complete_sessions()` **丟掉不完整的「交易日」而不是不完整的「成分股」**（60 天回放少一天影響很小，少 19 欄則直接壞掉），並在 30 檔沒湊齊時回 503。`close` 是 null 的列也在這裡一併濾掉。
- 所有籃子都是 `total_timesteps=20000`、**單一種子、單次訓練、無驗證集**：籃子之間的差異只能說明「這幾次訓練跑出來的結果」，不能當成「科技股籃比道瓊籃好／壞」的結論。這句話要留在 UI 與 README 裡。
- **多數 agent 對同一檔的方向好幾週都不變**（2026-10-31 評分時發現）：例如 DOW·2014 五個 agent 裡有四個連續 26 個交易日對 NVDA 都是 SELL、對 JPM 都是 BUY；DOW·2019 的 ddpg 從沒喊過 BUY；DOW·2014 的 a2c 與 td3、Tech·2019 的 ddpg 與 td3 每一筆都相同。ddpg／td3 的 `shares` 常是 ±100（= `hmax`，看起來是動作飽和），但成因沒有深究。意思是這些 agent 的輸出比較像「固定的多空選股」而不是每日擇時——讀 FinRL 面板與評分時都要記得這點。
- 每個交易日第一次呼叫約 4 秒，之後快取 6 ms。

**FinGPT（`agent/tools/fingpt_tool.py`）**
- 上游 `app.py` 一 import 就載 gated 模型、`prompt.py` 的 helper 吃 Finnhub 資料列，兩者都不能 import；系統提示與 `[INST]`／`<<SYS>>` 標記是從 `app.py` **原樣複製**（檔頭註明）。基礎模型用 `NousResearch/Llama-2-7b-chat-hf`（非 gated 鏡像）。
- MPS fp16 約 6 tok/s，單次 60–90 秒；`_lock` 讓同時兩個請求排隊而不是搶 MPS。`do_sample=True`（上游預設）每次輸出不同；模型只在 DOW 30 上微調過。
- 輸出格式 `[Positive Developments]:` / `[Potential Concerns]:` / `[Prediction & Analysis]`，`Prediction: Up/Down by X-Y%` 一行可用正則抓。
- prompt 的新聞段落**從 2026-10-08 起只有 `[Headline]`、沒有 `[Summary]`**（上游格式兩者都有）：新的來源 `yf.Search` 不提供摘要。等於 FinGPT 的輸入比 9 月那幾天少了一層資訊，品質可能略降。

**Agent（`agent/loop.py`）**
- **對本機服務的 GET 一律走 `tools/http.py`**（2026-10-08 加）：3 次嘗試、退避 2/5 秒，重試 400/408/429/5xx 與連線錯誤。400 也在重試名單裡，因為 yfinance provider 自己抖動時就回 400（我們的參數是固定字串）。`passthrough=(404,)` 讓 FinRL 的「不在任何籃子」直接回傳、不重試。沒有這層時，09-28～30 三天有 30 檔的引擎輸出被暫時性的 400/500 吃掉，而同一時間 dashboard 沒事——因為 `fetchHistory`／`firstResult` 早就有重試。
- `fingpt_tool._get` 另外會在 body 為空時丟出可讀的錯誤（`... returned no content (HTTP 204)`），而不是 `Expecting value: line 1 column 1`——後者讓新聞那次故障多花了不少時間才定位。
- 給 Gemini 的工具有 7 個：openbb-mcp 的 `equity_profile / equity_price_quote / equity_price_historical / news_company / equity_fundamental_metrics`（schema 去掉 `provider`）+ 本機 `fingpt_forecast` + `finrl_signal`（2026-09-21 加，`tools/finrl_tool.py`，打 8001 的端點；docstring 就是給模型的工具說明，`shares`／`position` 語意寫在裡面，模型才不會誤讀）。加工具的模式：`tools/` 新增一檔 + `loop.py` 一個 `FunctionDeclaration` + `call_tool` 一個分支。無對話記憶、無狀態。Gemini 免費層偶發 429/503，`_generate` 有 4 次退避重試；但**每日配額**的 429（訊息含 `PerDay`）直接放棄不重試。**`gemini-3.6-flash` 免費層每天只有 20 次 generate**：簡報固定 1 次、每個聊天問題 2–3 次，測試時很容易在下午就用完（2026-09-21 實際發生），用完後聊天完全不能用直到太平洋時間午夜重置；換模型用 `agent/.env` 的 `GEMINI_MODEL`。
- SSE 事件：`tool_call` / `tool_stream`（FinGPT 生成中的 token，2026-09-21 加）/ `tool_result`（preview 300 字）/ `text` / `error`。FinGPT 串流用 `TextIteratorStreamer`，`forecast(ticker, on_token=None)` 的回呼在 worker thread 被呼叫，`loop.py` 用 `call_soon_threadsafe` + `asyncio.Queue` 轉回事件迴圈；**`torch.no_grad()` 是 thread-local，必須在生成執行緒內進入**。

**每日簡報（`agent/brief.py`，2026-09-21）**
- 排程規則只有一條：每分鐘檢查，`last_complete_session()` 是平日且該日期沒有**完成的**簡報（檔案不存在或 `generated_at` 為 null）就跑。這同時涵蓋收盤後自動跑（ET 16:00 key 切到今天）與機器關機後的補跑；**agent 一啟動如果當天還沒跑就會立刻開始**（8 檔約 12 分鐘，與聊天共用 `_lock`，聊天的 FinGPT 呼叫會排在當前那檔之後）。
- 每檔 FinRL（秒）+ FinGPT（1.5 分）逐檔存檔（進度給 UI），跑完**一次** Gemini 呼叫（`response_mime_type=application/json`）產生 EN／繁中的 overview + 每檔一句；Gemini 失敗時 `summary` 為 null，引擎輸出仍在，UI 只是少了摘要文字（不會壞）。
- Gemini 當掉或額度用完時簡報會存成 `summary: null`（引擎資料完整）。事後補：`cd agent && ../envs/fingpt/bin/python resummarize.py`（不帶參數 = 補所有缺摘要的；可指定日期），每份一次呼叫、第一次失敗就停。
- **`gemini-3.6-flash` 的 503 是間歇性的，跟 payload 大小無關**。我在 2026-09-25 曾推論「大請求才會 503」，2026-10-08 的實測推翻了它：同一分鐘內「極小的 JSON 模式請求」503、「3k 的 JSON 模式請求」成功，而先前失敗的 6.8k 請求重試第 3 次就過了。**正確的應對是重試，不是縮小 prompt。**
- `_summary_input()` 仍把分析文字總量壓在 `ANALYSIS_BUDGET=4500` 字元內（每檔至少 300，`prediction` 不裁）——保留的理由是「避免 prompt 隨 watchlist 線性膨脹」（15 檔原本會到 30k+），**不是**為了解決 503。
- 夜間簡報的摘要失敗時，**直接重跑 `resummarize.py` 就好**（`_summarize` 內部已退避重試 3 次，一次執行最多 3 次呼叫）。間歇性 503 多試幾輪就會過。
- **不要在 `_summarize` 外面再包重試**：它內部已經退避重試 3 次，外層再跑 N 輪就是 3N 次呼叫，一天 20 次的額度幾分鐘就沒了（2026-09-24 實際踩到）。它與 `loop.py` 一樣，遇到含 `PerDay` 的 429 直接放棄。
- 測試時**不要**讓臨時 agent 寫到 `agent/briefs/`（正式排程會以為當天做完）；把 `brief.BRIEF_DIR`／`WATCHLIST_FILE` 指到 scratchpad，並把 `brief.scheduler` 換成空迴圈（做法見 git log 的 brief commit）。
- 非 DOW 30 的代號允許進 watchlist：FinGPT 照跑，FinRL 那欄記 error、UI 顯示 `—`。上限 15 檔。

**引擎評分（`agent/review.py`，2026-10-31）**
- `cd agent && ../envs/fingpt/bin/python review.py`：讀 `agent/briefs/`，每筆 FinGPT 方向與 FinRL 的 BUY/SELL（HOLD 視為棄權）＋每籃五個 agent 的多數決，對 as_of 收盤起算 **5 個交易日**後的收盤價評分。要等 5 個交易日收完才評得到；價格走 `fingpt_tool._get`（openbb-api，有重試），且截在 `last_complete_session()`。
- 每列除命中率外一定要並列基準：`up%`（永遠喊漲）、`rand%`（同樣的漲跌比例隨機打亂）、`follow%`（照著做的 5 日平均報酬）、`fixed`（方向從沒變過的代號數）。**單看命中率沒有意義**；`fixed` 滿的 agent 命中率只是「這段期間那幾檔剛好漲或跌」，有效樣本是幾檔 × 幾週，不是 n。
- FinGPT 9 月（標題＋摘要）與 10-08 起（只有標題）**分開算、不要合併**；09-28～10-07 幾乎全空。每天一筆 5 日窗口會重疊、各檔也會一起動，所以 n 高估了獨立樣本。
- 第一次結果（briefs 09-21～10-23）：**兩個引擎都看不出勝過基準**。FinGPT 10 月 51.0%（隨機 49.5%、永遠喊漲 52.1%，n=96），落在預測區間內的只有約 8%。最高的 sac（63–65%）是固定選股。數字會隨簡報累積變動，**不要把這次的數字寫死在 UI 裡**；要不要加 dashboard 評分卡等資料多幾週再決定。

**UI**
- FinRL 面板（`FinrlSignals.tsx`）有籃子切換鈕（短標籤 `DOW·14` / `DOW·19` / `TECH·19`，全名與說明在 tooltip），選擇存 `localStorage.basket` 且跨代號沿用，該代號沒有該籃時退回第一個。表格下方兩行灰字：該籃的 `note`（**`baskets.json` 的 note 是給 UI 看的，維持一句話；完整理由寫在 README／本檔，不要塞回設定檔**）＋ 固定的訓練限制警語（`basketCaveat`）＋ 免責聲明。改了 `baskets.json` 要重啟 backend（note 在 import 時讀入）。
- 六個分頁與市場總覽都**保持掛載、用 `hidden` 切換**（不是條件渲染），聊天紀錄與圖才不會消失；個股面板在第一次開啟某檔後才掛載（`stockOpened`）。
- Lightweight Charts 在 `display:none` 容器裡建立時 `fitContent` 算到寬度 0，每張圖都有 `ResizeObserver → fitContent()`。切換區間時 bars 與它所屬的 `ticker:range` key 要放在**同一個 state**，並用 `alive` 旗標丟掉過期 fetch。
- 頂欄的代號輸入框永遠帶著現在的代號，所以打字應該是**取代**而不是插入：`onFocus` 全選，送出後再全選一次（焦點會留在框內，不然下一次打字會接在後面變成 `AAPLAAPL`）。
- 頂欄價格用獨立的 1Y 日 K（`daily`）算，不隨區間變；技術面分頁共用同一份。`metrics` 在 `App.tsx` 抓一次，基本面與技術面共用。
- 首頁第一張卡是每日簡報（`market/DailyBrief.tsx`，純邏輯在隔壁 `market/brief.ts`），每 30 秒輪詢 `/brief`，watchlist 增刪直接 `PUT /watchlist`；`Market` 多接一個 `lang` prop 以選摘要語言。
- **簡報過期要看得見**（2026-10-08 加）：`/brief` 多回一個 `expected_as_of`（`brief.expected_session()`：最後一個已收盤交易日，週末往前走到週五），UI 的 `weekdaysBehind()` 算差幾個工作日，**≥3 才顯示**灰色提示。門檻不是 1 是因為 `last_complete_session()` 不知道美股假日，單日假期會讓它永遠落後 1 天——會誤報的警示等於沒有警示。
- **引擎失敗要看得見**（2026-10-08 加）：簡報卡上方有紅色橫幅顯示「FinGPT 失敗 n/N · FinRL 失敗 n/N」，列上用紅色 `✕` 標該檔、tooltip 是原始錯誤。這是因為 FinGPT 曾經無聲掛掉 9 天（卡片只是留白，沒有任何提示）。**「這檔不在任何籃子」不算失敗**，顯示灰色 `—`：`finrl_tool` 的 404 分支會標 `not_covered: true`，`brief.ts` 的 `covered()` 另外用錯誤訊息比對當 fallback，這樣舊的簡報檔不會誤報——警示系統只要開始誤報就沒人看了。
- 聊天面板有兩顆快捷鈕：「FinGPT → 代號」與「FinRL × FinGPT → 代號」（後者送出比較問題，讓模型同時呼叫兩個工具並指出分歧）。回答用 `react-markdown` + `remark-gfm` 渲染（模型比較五個 agent 時會出表格，沒有 gfm 會變成一串 `|`）。
- 版權：新聞只顯示標題／日期／來源／連結，`NewsItem` 型別刻意不宣告 `summary`／`text`。
- 分組長條圖（財務報表）是自畫 SVG（`BarChart.tsx`），Lightweight Charts 畫不出同一年份一組多條；沒有引 Recharts。
- RRG（`market/rrg.ts`）是公開近似算法，不是 JdK 原版；球體大小 = 成交金額 ÷ 20 日平均（盤中改用前一日），卡片下方已註明不是資金流。

## 延伸與維護原則（給未來的你，或未來的 Claude Code session）

- **新增能力 = 新增檔案，不是修改既有檔案**。想加新的資料源，就在 `openbb-backend/widgets/` 加一個新檔案；想加新的 agent 工具，就在 `agent/tools/` 加一個新檔案；想在 dashboard 加新的顯示區塊，就在 `ui/src/components/` 加一個新的元件檔。不要為了加新功能去動已經跑通的舊檔案。
- **保持 OpenBB / FinRL / FinGPT 為未修改的依賴套件**。更新方式：`pip install --upgrade openbb`、以及對 FinRL/FinGPT 的 repo 執行 `git pull`。這樣才能持續免費拿到上游社群/基金會的維護與更新，不需要自己扛維護那兩個引擎本體的成本。真正需要你長期維護的，只有 `openbb-backend/`、`agent/`、`ui/` 這三個薄膠水層。
- **不是自動更新**：上面這些 `pip install --upgrade` / `git pull` 指令需要你自己不定期執行，不會像手機 App 一樣背景自動更新；ODP Desktop 本身的版本更新也一樣，要留意 GitHub Releases 頁面手動更新。
- **授權提醒**：OpenBB 核心是 AGPLv3（copyleft）授權。純本機個人使用沒有問題；但如果之後想把這個專案公開部署到一個網址（像先前的 RegTech 專案部署在 Streamlit Community Cloud 那樣），AGPL 的「網路服務等同散布」條款可能要求連同你自己寫的部分一起公開原始碼——屆時請先重新確認授權細節,再決定部署方式。2026 年 8 月的公告承諾改為寬鬆授權，但截至 2026-09-17 repo 的 `LICENSE` 檔仍是 AGPLv3——等 LICENSE 檔實際改版再放寬這條。
- **關注 Workspace 後續發展，但不要主動等它**：FINOS 是否正式接手 Workspace、是否有人長期維護,目前都還不確定。如果之後確認有穩定的自架方式,可以把 Phase 4 的 `widgets.json` 接進去，多一個消費端，Phase 6 的自建 dashboard 不需要因此拆掉——兩者可以並存。
- **把確認能用的 ODP 版本釘死**：每個 venv 驗證能跑後用 `uv pip freeze` 存到 `requirements/<env>.lock.txt`（目前已有 `requirements/openbb.lock.txt`），不要每次都裝最新版。這樣即使上游因為公司收攤而更新變得不穩定，你已經跑通的環境不會被動被打亂，升不升級變成你自己選的時間點。這不是因為 ODP 本身有問題,是任何依賴外部套件的專案都該有的習慣。
- **資料層真的壞掉時，只修壞的那一小塊**：Phase 4 把每個資料源獨立成一個檔案的設計,就是為了這種情況準備的——如果將來某個 ODP 串接的資料項目因為上游 API 改版而失效，直接在對應的那個檔案裡換一個更直接的呼叫方式（例如直接用 `yfinance` 抓價格），不需要重建整個資料層。
