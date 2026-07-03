import test from "node:test";
import assert from "node:assert/strict";
import { sanitizeText, sanitizeEmail, sanitizeSearchFilters } from "./sanitize";

test("sanitizeText strips tags and trims whitespace", () => {
  assert.equal(sanitizeText("  <b>Senior</b> Developer  ", 30), "Senior Developer");
});

test("sanitizeEmail lowercases and truncates", () => {
  assert.equal(sanitizeEmail("  VICENTE@Example.COM  "), "vicente@example.com");
});

test("sanitizeSearchFilters keeps the sanitized list", () => {
  assert.deepEqual(sanitizeSearchFilters([" React ", "<b>Node</b>"]), ["React", "Node"]);
});
