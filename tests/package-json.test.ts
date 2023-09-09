import packageJson from "../src/package-json";

describe("Load package.json", () => {
  it("Should load version from package.json", () => {
    expect(packageJson.version).toBeDefined();
  });
});
