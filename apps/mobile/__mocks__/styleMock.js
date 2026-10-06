// Metro/NativeWind resolves the global stylesheet import at build time; Jest
// cannot parse CSS, so the import is mapped to this empty module instead.
module.exports = {};
