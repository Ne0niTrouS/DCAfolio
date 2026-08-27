import '@testing-library/jest-dom/vitest';

import { cleanup, configure } from '@testing-library/react';
import { afterEach } from 'vitest';

// The default 1s async timeout is not enough when all four test projects run
// in parallel on a loaded machine: a slow render made assertions fail
// intermittently even though the behaviour was correct. This changes only how
// long a test waits, never what it asserts.
configure({ asyncUtilTimeout: 5000 });

// jsdom does not implement scrollIntoView. Every real browser does, so this is
// a gap in the test environment rather than something the components should
// defend against.
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

afterEach(() => {
  cleanup();
});
