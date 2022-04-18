test("we did it", () => {
  expect(1).toBe(1);
});

test("greeting", () => {
  expect("Hello Foo").toBe("Hello Foo");
});

describe("This test fails", () => {
  it("will continue to fail until we update the test suite to have actual tests", () => {
    expect.assertions(1);
  });
});
