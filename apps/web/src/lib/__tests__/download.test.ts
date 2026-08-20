import { afterEach, describe, expect, it, vi } from 'vitest';

import { downloadBlob } from '@/lib/download';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('downloadBlob', () => {
  it('hands the file to the browser under the requested name', () => {
    const createObjectURL = vi.fn(() => 'blob:dcafolio');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL });

    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    downloadBlob(new Blob(['data']), 'dcafolio_all_all-time.csv');

    expect(createObjectURL).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();

    const anchor = click.mock.instances[0] as HTMLAnchorElement;
    expect(anchor.download).toBe('dcafolio_all_all-time.csv');
    expect(anchor.href).toContain('blob:dcafolio');

    vi.unstubAllGlobals();
  });

  it('releases the object URL and leaves no anchor behind', () => {
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', { ...URL, createObjectURL: () => 'blob:dcafolio', revokeObjectURL });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    downloadBlob(new Blob(['data']), 'dcafolio.csv');

    expect(revokeObjectURL).toHaveBeenCalledWith('blob:dcafolio');
    expect(document.querySelector('a[download]')).toBeNull();

    vi.unstubAllGlobals();
  });
});
