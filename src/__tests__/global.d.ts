/**
 * Global type declarations for tests
 */

declare global {
  var navigator: Navigator & {
    connection?: {
      type?: string;
      effectiveType?: string;
      addEventListener: (event: string, handler: () => void) => void;
      removeEventListener: (event: string, handler: () => void) => void;
    };
  };

  var window: Window & {
    addEventListener: (event: string, handler: () => void) => void;
    removeEventListener: (event: string, handler: () => void) => void;
  };

  var fetch: jest.Mock;
}

export {};