"""Grade the engines' past calls in agent/briefs/ against what the prices did next.

    cd agent && ../envs/fingpt/bin/python review.py

Every call is scored on the close-to-close return over HORIZON trading days from the brief's as_of
(the brief's last complete session), so a brief can be graded once HORIZON more sessions have closed.
- FinGPT: the direction of `Up/Down by X-Y%`, and whether the move landed inside X-Y%.
- FinRL: each agent's BUY/SELL (HOLD abstains), and each basket's majority vote of its five agents.
Each line also shows two baselines on the same rows — "always Up", and the same mix of Up/Down calls
shuffled at random — plus the mean return of following the calls (long on Up/BUY, short on Down/SELL):
a hit rate means nothing without the base rate beside it. `fixed` is the share of tickers whose call
never changed: most FinRL agents give each stock one direction for weeks, and for those the hit rate
is a static stock pick (did NVDA fall over the period?), not timing, worth a few samples, not n.
"""
import re
import sys
from collections import defaultdict
from pathlib import Path

HORIZON = 5  # FinGPT forecasts the coming week
HEADLINES_ONLY_FROM = "2026-10-08"  # yf.Search has no summary field; FinGPT's input changed that day
OLD_FINRL_BASKET = "DOW 30 · 2014"  # briefs before Phase 17 carried this basket alone, unwrapped

_PRED = re.compile(r"(Up|Down) by (\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)%")


def parse_prediction(text):
    """'Down by 2-3%' -> (-1, -3.0, -2.0): direction and the predicted range in signed percent."""
    m = _PRED.search(text or "")
    if not m:
        return None
    sign = 1 if m[1] == "Up" else -1
    lo, hi = sorted((sign * float(m[2]), sign * float(m[3])))
    return sign, lo, hi


def forward_return(closes, as_of, horizon=HORIZON):
    """Percent change from the close on as_of to the close `horizon` sessions later; None if either
    is missing. `closes` is {date: close} for one ticker."""
    dates = sorted(closes)
    if as_of not in closes:
        return None
    i = dates.index(as_of)
    if i + horizon >= len(dates):
        return None
    return 100 * (closes[dates[i + horizon]] / closes[as_of] - 1)


def collect(briefs):
    """Flatten the briefs into one record per call: {as_of, ticker, group, call, range}.
    `group` is the line the call is reported under; `call` is +1 / -1."""
    out = []
    for b in briefs:
        as_of = b["as_of"]
        for item in b["items"]:
            t = item["ticker"]
            g = item.get("fingpt") or {}
            p = None if g.get("error") else parse_prediction(g.get("prediction"))
            if p:
                era = "headlines only" if as_of >= HEADLINES_ONLY_FROM else "headlines + summaries"
                out.append({"as_of": as_of, "ticker": t, "group": ("FinGPT", era), "call": p[0], "range": p[1:]})
            f = item.get("finrl") or {}
            baskets = f.get("baskets") or ([{"basket": OLD_FINRL_BASKET, **f}] if f.get("signals") else [])
            for bk in baskets:
                votes = 0
                for s in bk["signals"]:
                    call = {"BUY": 1, "SELL": -1}.get(s["action"])
                    if call:
                        votes += call
                        out.append({"as_of": as_of, "ticker": t, "group": ("FinRL", bk["basket"], s["agent"]), "call": call})
                if votes:  # a tie (or all HOLD) is no call
                    out.append({"as_of": as_of, "ticker": t, "group": ("FinRL", bk["basket"], "vote"), "call": 1 if votes > 0 else -1})
    return out


def score(records, closes):
    """Group the gradable records. Returns {group: {n, hit, always_up, shuffled, follow, fixed, in_range}},
    rates in percent; `in_range` only for groups whose calls carry a range. `closes` is {ticker: {date: close}}."""
    acc = defaultdict(list)
    for r in records:
        ret = forward_return(closes.get(r["ticker"], {}), r["as_of"])
        if ret is not None:
            acc[r["group"]].append((r, ret))
    out = {}
    for group, rows in acc.items():
        n = len(rows)
        up = sum(ret > 0 for _, ret in rows) / n
        says_up = sum(r["call"] > 0 for r, _ in rows) / n
        calls = defaultdict(set)
        for r, _ in rows:
            calls[r["ticker"]].add(r["call"])
        s = {
            "n": n,
            "hit": 100 * sum(r["call"] * ret > 0 for r, ret in rows) / n,
            "always_up": 100 * up,
            "shuffled": 100 * (says_up * up + (1 - says_up) * (1 - up)),
            "follow": sum(r["call"] * ret for r, ret in rows) / n,
            "fixed": f"{sum(len(c) == 1 for c in calls.values())}/{len(calls)}",
        }
        if all("range" in r for r, _ in rows):
            s["in_range"] = 100 * sum(r["range"][0] <= ret <= r["range"][1] for r, ret in rows) / n
        out[group] = s
    return out


def _closes(tickers, start):
    from tools.fingpt_tool import _get, last_complete_session  # same fetch (with retries) the forecasts used

    cutoff = last_complete_session().isoformat()  # never grade against an in-progress bar
    return {t: {row["date"]: row["close"] for row in _get("equity/price/historical", symbol=t, start_date=start)
                if row["close"] is not None and row["date"] <= cutoff} for t in tickers}


def main(brief_dir):
    import json

    briefs = [json.loads(p.read_text()) for p in sorted(brief_dir.glob("????-??-??.json"))]
    records = collect(briefs)
    closes = _closes(sorted({r["ticker"] for r in records}), min(r["as_of"] for r in records))
    scores = score(records, closes)
    graded = {r["as_of"] for r in records if forward_return(closes.get(r["ticker"], {}), r["as_of"]) is not None}
    print(f"graded briefs: {min(graded)} .. {max(graded)} ({len(graded)} days) · horizon {HORIZON} sessions\n")
    print(f"{'':36}{'n':>5}{'hit%':>7}{'up%':>7}{'rand%':>7}{'follow%':>9}{'fixed':>7}{'range%':>8}")
    for group in sorted(scores):
        s = scores[group]
        rng = f"{s['in_range']:>8.1f}" if "in_range" in s else ""
        print(f"{' · '.join(group):36}{s['n']:>5}{s['hit']:>7.1f}{s['always_up']:>7.1f}{s['shuffled']:>7.1f}{s['follow']:>+9.2f}{s['fixed']:>7}{rng}")
    print("\nhit% = direction right · up% = 'always Up' · rand% = same call mix at random · follow% = mean"
          "\n5-day return of following the call (short on Down/SELL) · fixed = tickers whose call never changed"
          "\n· range% = move landed inside FinGPT's X-Y%. Daily calls on 5-day windows overlap, and the tickers"
          "\nmove together: the independent sample is far smaller than n.")


if __name__ == "__main__":
    main(Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).parent / "briefs")
