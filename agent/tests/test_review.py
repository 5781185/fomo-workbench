"""Pure-function tests for review.py. Run from agent/: ../envs/fingpt/bin/python -m pytest"""
import pytest

from review import collect, forward_return, parse_prediction, score


def test_parse_prediction_gives_direction_and_signed_range():
    assert parse_prediction("Up by 2-3%") == (1, 2.0, 3.0)
    assert parse_prediction("Down by 0-1%") == (-1, -1.0, -0.0)
    assert parse_prediction("Prediction: Down by 5-7%\nAnalysis: ...") == (-1, -7.0, -5.0)
    assert parse_prediction("no idea") is None
    assert parse_prediction(None) is None


CLOSES = {"2026-10-01": 100, "2026-10-02": 101, "2026-10-05": 102, "2026-10-06": 103, "2026-10-07": 104, "2026-10-08": 110}


def test_forward_return_counts_sessions_not_calendar_days():
    assert forward_return(CLOSES, "2026-10-01") == pytest.approx(10.0)  # 5 sessions on is 10-08, across a weekend
    assert forward_return(CLOSES, "2026-10-02") is None  # 5 sessions on hasn't happened yet
    assert forward_return(CLOSES, "2026-09-30") is None  # no close on as_of


def _sig(agent, action):
    return {"agent": agent, "action": action}


def test_collect_reads_both_finrl_shapes_votes_and_fingpt_eras():
    briefs = [
        {"as_of": "2026-09-22", "items": [{
            "ticker": "JPM",
            "fingpt": {"prediction": "Up by 1-2%"},
            "finrl": {"ticker": "JPM", "as_of": "2026-09-22", "signals": [_sig("a2c", "BUY"), _sig("ppo", "HOLD")]},  # pre-Phase-17 shape
        }, {"ticker": "CRWD", "fingpt": {"error": "boom"}, "finrl": {"error": "not in any basket"}}]},
        {"as_of": "2026-10-08", "items": [{
            "ticker": "JPM",
            "fingpt": {"prediction": "Down by 0-1%"},
            "finrl": {"ticker": "JPM", "baskets": [{"basket": "DOW 30 · 2019", "signals": [_sig("a2c", "BUY"), _sig("ddpg", "SELL")]}]},
        }]},
    ]
    got = {(r["as_of"], r["group"]): r["call"] for r in collect(briefs)}
    assert got == {
        ("2026-09-22", ("FinGPT", "headlines + summaries")): 1,
        ("2026-09-22", ("FinRL", "DOW 30 · 2014", "a2c")): 1,   # HOLD abstains
        ("2026-09-22", ("FinRL", "DOW 30 · 2014", "vote")): 1,
        ("2026-10-08", ("FinGPT", "headlines only")): -1,
        ("2026-10-08", ("FinRL", "DOW 30 · 2019", "a2c")): 1,
        ("2026-10-08", ("FinRL", "DOW 30 · 2019", "ddpg")): -1,  # 1-1 tie: no vote record
    }


def test_score_reports_hit_rate_beside_always_up_and_following_return():
    closes = {"A": CLOSES, "B": {d: 200 - v for d, v in CLOSES.items()}}  # A rises 10%, B falls 10%
    records = [
        {"as_of": "2026-10-01", "ticker": "A", "group": ("FinGPT", "x"), "call": 1, "range": (8.0, 12.0)},
        {"as_of": "2026-10-01", "ticker": "B", "group": ("FinGPT", "x"), "call": 1, "range": (0.0, 1.0)},
        {"as_of": "2026-10-02", "ticker": "A", "group": ("FinGPT", "x"), "call": 1, "range": (0.0, 1.0)},  # not gradable yet
        {"as_of": "2026-10-01", "ticker": "B", "group": ("FinRL", "b", "vote"), "call": -1},
    ]
    s = score(records, closes)
    assert s[("FinGPT", "x")] == {"n": 2, "hit": 50.0, "always_up": 50.0, "shuffled": 50.0, "follow": pytest.approx(0.0), "fixed": "2/2", "in_range": 50.0}
    assert s[("FinRL", "b", "vote")] == {"n": 1, "hit": 100.0, "always_up": 0.0, "shuffled": 100.0, "follow": pytest.approx(10.0), "fixed": "1/1"}


def test_score_shuffled_baseline_and_fixed_calls():
    closes = {"A": CLOSES}
    days = ["2026-10-01", "2026-10-02"]
    closes["A"] = {**CLOSES, "2026-10-09": 120}  # both days gradable, both up
    records = [{"as_of": d, "ticker": "A", "group": ("g",), "call": c} for d, c in zip(days, (1, -1))]
    s = score(records, closes)[("g",)]
    assert s["always_up"] == 100.0
    assert s["shuffled"] == 50.0  # half the calls say Up, and every move was up
    assert s["fixed"] == "0/1"    # the call on A changed
