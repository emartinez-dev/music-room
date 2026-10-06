// sessionManager keeps a single module-level handler, so every test starts from
// a freshly required module to avoid leaking a handler between tests.
describe("sessionManager", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it("should do nothing when no handler has been registered", () => {
    const { sessionExpired } = require("../sessionManager");

    expect(() => sessionExpired()).not.toThrow();
  });

  it("should call the registered handler when the session expires", () => {
    const { sessionExpired, setSessionExpiredHandler } = require("../sessionManager");
    const handler = jest.fn();

    setSessionExpiredHandler(handler);
    sessionExpired();

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("should call the handler again on every expiration", () => {
    const { sessionExpired, setSessionExpiredHandler } = require("../sessionManager");
    const handler = jest.fn();

    setSessionExpiredHandler(handler);
    sessionExpired();
    sessionExpired();

    expect(handler).toHaveBeenCalledTimes(2);
  });

  // AuthProvider re-registers the handler whenever logout changes identity,
  // so the latest registration has to win.
  it("should replace a previously registered handler", () => {
    const { sessionExpired, setSessionExpiredHandler } = require("../sessionManager");
    const first = jest.fn();
    const second = jest.fn();

    setSessionExpiredHandler(first);
    setSessionExpiredHandler(second);
    sessionExpired();

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});
