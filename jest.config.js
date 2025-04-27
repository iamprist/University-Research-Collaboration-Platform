module.exports = {
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.(js|jsx)$": "babel-jest"
  },
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "identity-obj-proxy"
  },
  transformIgnorePatterns: [
    "node_modules/(?!axios)/"  // Ensure Axios is transformed
  ],
  setupFilesAfterEnv: ["@testing-library/jest-dom"],
  //globalSetup: "./__mocks__/firebase.js",  // Optional if you want to globally mock Firebase
};
