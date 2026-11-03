import { afterEach, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Account } from "./Account";
import { setLanguage } from "../i18n";
afterEach(() => setLanguage("de"));
it("explains the local/cloud boundary in German before authentication", () => {
  const html = renderToStaticMarkup(<Account />);
  expect(html).toContain("Dein Testkonto");
  expect(html).toContain("keine automatische Datenübernahme");
  expect(html).not.toContain('type="email"'); // INITIAL_SESSION not restored on server
});
it("renders the account boundary in English", () => {
  setLanguage("en");
  const html = renderToStaticMarkup(<Account />);
  expect(html).toContain("Your test account");
  expect(html).toContain("automatic data adoption");
});
