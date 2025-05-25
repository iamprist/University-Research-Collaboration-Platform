// jest-dom adds custom jest matchers for asserting on DOM nodes
import '@testing-library/jest-dom';
import fetch, { Response, Headers, Request } from 'node-fetch';

// Define globals that Firebase auth expects
global.fetch = fetch;
global.Response = Response;
global.Headers = Headers;
global.Request = Request;

global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
