module.exports = function (api) {
  const isTest = api.env("test");
  api.cache(isTest ? false : true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      ...(isTest ? [] : ["nativewind/babel"]),
    ],
  };
};
