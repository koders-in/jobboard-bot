const test = require("node:test");
const assert = require("node:assert");
const { categorizeJob } = require("../src/jobSource");

test("categorizes developer jobs as Technology", () => {
  assert.strictEqual(
    categorizeJob("Frontend Developer", "Build web applications"),
    "Technology"
  );
});

test("categorizes designer jobs as Design", () => {
  assert.strictEqual(
    categorizeJob("UI/UX Designer", "Create designs in Figma"),
    "Design"
  );
});

test("categorizes writer jobs as Content", () => {
  assert.strictEqual(
    categorizeJob("Technical Writer", "Write technical blogs"),
    "Content"
  );
});

test("categorizes unrelated jobs as Other", () => {
  assert.strictEqual(
    categorizeJob("Accountant", "Manage company finances"),
    "Other"
  );
});
