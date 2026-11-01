/* eslint-disable @typescript-eslint/no-unused-expressions -- Playwright CLI entry. */
async (page) => {
  const keys = ["flowdocker.locale", "flowdocker.theme"];
  const saved = await page.evaluate(
    (keys) => keys.map((k) => localStorage.getItem(k)),
    keys,
  );
  const results = [];
  try {
    for (const [locale, theme] of [
      ["vi", "light"],
      ["en", "dark"],
    ]) {
      await page.evaluate(
        ({ locale, theme }) => {
          localStorage.setItem("flowdocker.locale", locale);
          localStorage.setItem("flowdocker.theme", theme);
        },
        { locale, theme },
      );
      await page.reload();
      for (const [width, height] of [
        [1440, 900],
        [1366, 768],
        [390, 844],
      ]) {
        await page.setViewportSize({ width, height });
        const card = page.locator(".fd-form-template").first();
        await card.waitFor();
        await card.hover();
        const measured = await card.evaluate((el) => {
          const s = getComputedStyle(el),
            app = getComputedStyle(document.querySelector(".fd-app"));
          return {
            border: s.borderTopColor,
            expected: app.getPropertyValue("--fd-border-hover").trim(),
            brand: app.getPropertyValue("--fd-brand-solid").trim(),
            overflow: document.documentElement.scrollWidth > innerWidth,
          };
        });
        // Wait for the existing border transition to settle.
        await page.waitForTimeout(230);
        const border = await card.evaluate(
          (el) => getComputedStyle(el).borderTopColor,
        );
        const expected =
          theme === "light" ? "rgb(189, 189, 189)" : "rgb(105, 105, 105)";
        if (
          border !== expected ||
          measured.brand !== "#e20e17" ||
          measured.overflow
        )
          throw new Error(
            JSON.stringify({ locale, theme, width, border, measured }),
          );
        results.push({
          locale,
          theme,
          width,
          border,
          overflow: measured.overflow,
        });
        await page.screenshot({
          path: `output/playwright/neutral-hover-${locale}-${theme}-${width}.png`,
          fullPage: true,
        });
      }
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.locator(".fd-form-template").first().click();
      const toolbox = page.locator(".fd-form-palette-items button").first();
      await toolbox.waitFor();
      await toolbox.hover();
      await page.waitForTimeout(230);
      const palette = await toolbox.evaluate((el) => ({
        background: getComputedStyle(el).backgroundColor,
        color: getComputedStyle(el).color,
      }));
      const expected =
        theme === "light" ? "rgb(241, 241, 241)" : "rgb(48, 48, 48)";
      if (palette.background !== expected)
        throw new Error(JSON.stringify({ palette, expected }));
      results.push({ locale, theme, palette });
      await page.screenshot({
        path: `output/playwright/neutral-hover-designer-${theme}.png`,
        fullPage: true,
      });
      await page.reload();
    }
    console.log(JSON.stringify(results));
  } finally {
    await page.evaluate(
      ({ keys, saved }) =>
        keys.forEach((k, i) =>
          saved[i] === null
            ? localStorage.removeItem(k)
            : localStorage.setItem(k, saved[i]),
        ),
      { keys, saved },
    );
    await page.reload();
  }
};
