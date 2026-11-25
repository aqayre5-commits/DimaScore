#!/usr/bin/env python3
"""
Regression: per-fixture shirt colours stay bound to team.id
through locale (en → ar) and Starting XI → At full-time.

Requires a running app whose database has both fixtures seeded
with resolved palettes (see scripts/backfill-fixture-kit-colours.ts).

  BASE_URL=http://127.0.0.1:3400 \\
  CITY_FULHAM_ID=9000001 \\
  MADRID_PSV_ID=1635715 \\
  python3 tests/e2e/shirt-colours.spec.py
"""
from __future__ import annotations

import asyncio
import os
import sys

from playwright.async_api import async_playwright

BASE = os.environ.get("BASE_URL", "http://127.0.0.1:3400")
CITY_FULHAM = int(os.environ.get("CITY_FULHAM_ID", "9000001"))
MADRID_PSV = int(os.environ.get("MADRID_PSV_ID", "1635715"))


def hexv(v: str) -> str:
    return (v or "").replace(" ", "").lower()


async def open_lineups(page, locale: str, fixture_id: int) -> None:
    await page.goto(f"{BASE}/{locale}/match/{fixture_id}#lineups", wait_until="networkidle", timeout=60_000)
    await page.wait_for_function(
        "() => { const el = document.querySelector('.mc-board, .pl-tabs'); const r = el && el.getBoundingClientRect(); return !!(r && r.width > 50); }",
        timeout=30_000,
    )
    await page.evaluate(
        """() => {
          if (location.hash !== '#lineups') location.hash = 'lineups';
          window.dispatchEvent(new HashChangeEvent('hashchange'));
          const root = document.querySelector('[data-tab]');
          if (root) root.setAttribute('data-tab', 'lineups');
        }"""
    )
    tabs = page.locator('a[href="#lineups"]')
    n = await tabs.count()
    for i in range(n):
        loc = tabs.nth(i)
        if await loc.is_visible():
            await loc.click()
            break
    await page.locator(".lu-team").first.wait_for(state="visible", timeout=20_000)


async def read_sides(page):
    return await page.evaluate(
        """() => [...document.querySelectorAll('.lu-team[data-team-id]')].map(el => {
          const style = getComputedStyle(el);
          const keeper = el.querySelector('.lu-player.lu-keeper');
          const ks = keeper ? getComputedStyle(keeper) : null;
          return {
            teamId: el.getAttribute('data-team-id'),
            playerKit: style.getPropertyValue('--kit').trim(),
            keeperKit: ks ? ks.getPropertyValue('--kit').trim() : null,
            keeperNum: keeper?.querySelector('.lu-num')?.textContent?.trim() ?? null,
          };
        })"""
    )


async def switch_full_time(page) -> None:
    btns = page.locator(".lu-mode button")
    n = await btns.count()
    for i in range(n):
        btn = btns.nth(i)
        if await btn.is_visible():
            pressed = await btn.get_attribute("aria-pressed")
            if pressed == "false" or i == 1:
                await btn.click()
                await page.wait_for_timeout(300)
                return


def by_id(sides):
    return {s["teamId"]: s for s in sides}


async def main() -> None:
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            executable_path="/usr/bin/google-chrome" if os.path.exists("/usr/bin/google-chrome") else None,
            args=["--no-sandbox"],
            headless=True,
        )
        page = await browser.new_page(viewport={"width": 1440, "height": 900})

        await open_lineups(page, "en", CITY_FULHAM)
        city_en = await read_sides(page)
        assert len(city_en) == 2, f"City–Fulham should render two teams, got {city_en}"

        await open_lineups(page, "en", MADRID_PSV)
        madrid_en = await read_sides(page)
        assert len(madrid_en) == 2, f"Madrid–PSV should render two teams, got {madrid_en}"
        m = by_id(madrid_en)
        assert "541" in m and "197" in m, f"expected team ids 541 and 197, got {list(m)}"
        assert hexv(m["541"]["playerKit"]) != hexv(m["197"]["playerKit"]), "sides must not share a shirt colour"

        prev = ",".join(sorted(hexv(s["playerKit"]) for s in city_en))
        nxt = ",".join(sorted(hexv(s["playerKit"]) for s in madrid_en))
        assert prev != nxt, "palette pair must change when switching fixtures"

        await open_lineups(page, "ar", MADRID_PSV)
        madrid_ar = by_id(await read_sides(page))
        assert hexv(madrid_ar["541"]["playerKit"]) == hexv(m["541"]["playerKit"])
        assert hexv(madrid_ar["197"]["playerKit"]) == hexv(m["197"]["playerKit"])

        await switch_full_time(page)
        madrid_ft = by_id(await read_sides(page))
        assert hexv(madrid_ft["541"]["playerKit"]) == hexv(m["541"]["playerKit"])
        assert hexv(madrid_ft["197"]["playerKit"]) == hexv(m["197"]["playerKit"])

        kovar = madrid_ft.get("197")
        if kovar and kovar.get("keeperNum") in {"32", "٣٢"}:
            assert hexv(kovar.get("keeperKit") or "") != hexv(kovar["playerKit"]), (
                "PSV GK must not wear the outfield shirt colour"
            )

        await browser.close()
    print("shirt-colours regression: ok")
    print({"city_en": city_en, "madrid_en": madrid_en})


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except Exception as err:
        print(err, file=sys.stderr)
        sys.exit(1)
