import mock from "mock-fs";

beforeAll(() => {
  mock({
    "/config": {},
  });
});

beforeEach(() => {
  mock({
    "/config": {
      "ev.json": "{}",
    },
  });
});

afterEach(() => {
  mock.restore();
});
