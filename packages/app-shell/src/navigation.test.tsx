import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { I18nProvider } from "@flowdocker/i18n";
import { AppShell } from "./index";

afterEach(cleanup);
const mount = (getPageHref?: (page: import("./index").PageId) => string) => {
  const onPageChange = vi.fn();
  render(
    <I18nProvider initialLocale="en">
      <AppShell
        page="forms"
        account={{ displayName: "Sample", initials: "S", subtitle: "Demo" }}
        onPageChange={onPageChange}
        getPageHref={getPageHref}
        theme="light"
        onThemeChange={() => {}}
      >
        Content
      </AppShell>
    </I18nProvider>,
  );
  return onPageChange;
};
it("renders all sidebar destinations and profile as real links and preserves active semantics", () => {
  mount();
  const links = screen.getAllByRole("link");
  expect(links.map((link) => link.getAttribute("href"))).toEqual([
    "#workspace",
    "#applications",
    "#forms",
    "#master",
    "#connections",
    "#flows",
    "#permissions",
    "#profile",
  ]);
  expect(
    screen.getByRole("link", { name: "Forms" }).getAttribute("aria-current"),
  ).toBe("page");
  expect(
    screen
      .getByRole("link", { name: "Master Data" })
      .getAttribute("aria-current"),
  ).toBeNull();
});
it("uses existing routing only for an unmodified primary activation", () => {
  const navigate = mount();
  const link = screen.getByRole("link", { name: "Master Data" });
  for (const props of [
    { ctrlKey: true },
    { metaKey: true },
    { shiftKey: true },
    { altKey: true },
    { button: 1 },
    { button: 2 },
  ]) {
    const event = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      ...props,
    });
    fireEvent(link, event);
    expect(event.defaultPrevented).toBe(false);
  }
  fireEvent.contextMenu(link);
  fireEvent(
    link,
    new MouseEvent("auxclick", { button: 1, bubbles: true, cancelable: true }),
  );
  expect(navigate).not.toHaveBeenCalled();
  const primary = new MouseEvent("click", {
    button: 0,
    bubbles: true,
    cancelable: true,
  });
  fireEvent(link, primary);
  expect(primary.defaultPrevented).toBe(true);
  expect(navigate).toHaveBeenCalledExactlyOnceWith("master");
});
it("accepts host-specific link destinations without changing page callbacks", () => {
  const navigate = mount((id) => `/console?tab=${id}`);
  const profile = screen.getByRole("link", { name: "Open profile" });
  expect(profile.getAttribute("href")).toBe("/console?tab=profile");
  fireEvent.click(profile);
  expect(navigate).toHaveBeenCalledWith("profile");
});
