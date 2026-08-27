import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { ComboBox, type ComboBoxOption } from '@/components/ComboBox';

const OPTIONS: ComboBoxOption[] = [
  { value: 'cpall', label: 'CPALL', hint: 'บริษัท ซีพี ออลล์ จำกัด (มหาชน)' },
  { value: 'ptt', label: 'PTT', hint: 'บริษัท ปตท. จำกัด (มหาชน)' },
  { value: 'pttep', label: 'PTTEP', hint: 'บริษัท ปตท. สำรวจและผลิตปิโตรเลียม จำกัด (มหาชน)' },
  { value: 'kbank', label: 'KBANK', hint: 'ธนาคารกสิกรไทย จำกัด (มหาชน)' },
];

const LABEL = 'Stock';

function Harness({
  onChange = vi.fn(),
  initial = '',
}: {
  onChange?: (v: string) => void;
  initial?: string;
}) {
  const [value, setValue] = useState(initial);
  return (
    <ComboBox
      label={LABEL}
      value={value}
      options={OPTIONS}
      placeholder="Search"
      onChange={(next) => {
        setValue(next);
        onChange(next);
      }}
    />
  );
}

function field() {
  return screen.getByRole('combobox', { name: LABEL });
}

function list() {
  return screen.getByRole('listbox', { name: LABEL });
}

describe('ComboBox', () => {
  it('stays closed until asked, then shows every option', async () => {
    render(<Harness />);

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

    await userEvent.click(field());

    expect(within(list()).getAllByRole('option')).toHaveLength(OPTIONS.length);
  });

  it('filters on the symbol', async () => {
    render(<Harness />);

    await userEvent.click(field());
    await userEvent.type(field(), 'ptt');

    const options = within(list()).getAllByRole('option');
    expect(options.map((option) => option.textContent)).toEqual([
      `PTT${OPTIONS[1]?.hint}`,
      `PTTEP${OPTIONS[2]?.hint}`,
    ]);
  });

  it('filters on the Thai company name, which is the point of searching', async () => {
    render(<Harness />);

    await userEvent.click(field());
    await userEvent.type(field(), 'กสิกร');

    const options = within(list()).getAllByRole('option');
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent('KBANK');
  });

  it('says so when nothing matches, instead of showing an empty box', async () => {
    render(<Harness />);

    await userEvent.click(field());
    await userEvent.type(field(), 'zzzz');

    expect(within(list()).queryAllByRole('option')).toHaveLength(0);
    expect(list()).toHaveTextContent('ไม่พบรายการที่ตรงกัน');
  });

  it('selects with the mouse and shows the label afterwards', async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    await userEvent.click(field());
    // Matched on the full row text: "PTT" alone also matches PTTEP.
    await userEvent.click(
      within(list()).getByRole('option', { name: `PTT${OPTIONS[1]?.hint}` }),
    );

    expect(onChange).toHaveBeenCalledWith('ptt');
    expect(field()).toHaveValue('PTT');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('is drivable from the keyboard alone', async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    field().focus();
    await userEvent.keyboard('{Escape}');
    await userEvent.keyboard('{ArrowDown}');
    expect(list()).toBeInTheDocument();

    await userEvent.keyboard('{ArrowDown}{Enter}');

    expect(onChange).toHaveBeenCalledWith('ptt');
    expect(field()).toHaveValue('PTT');
  });

  it('marks the active row for assistive technology', async () => {
    render(<Harness />);

    await userEvent.click(field());
    await userEvent.keyboard('{ArrowDown}');

    const active = field().getAttribute('aria-activedescendant');
    expect(active).toBeTruthy();
    expect(document.getElementById(active as string)).toHaveTextContent('PTT');
  });

  it('closes on Escape and keeps the previous selection', async () => {
    render(<Harness initial="cpall" />);

    await userEvent.click(field());
    await userEvent.type(field(), 'ptt');
    await userEvent.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
    // Typing is a search, not an edit: the half-typed text must not survive.
    expect(field()).toHaveValue('CPALL');
  });

  it('closes on an outside click without changing anything', async () => {
    const onChange = vi.fn();
    render(
      <div>
        <Harness onChange={onChange} initial="cpall" />
        <button type="button">elsewhere</button>
      </div>,
    );

    await userEvent.click(field());
    await userEvent.click(screen.getByRole('button', { name: 'elsewhere' }));

    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
    expect(onChange).not.toHaveBeenCalled();
    expect(field()).toHaveValue('CPALL');
  });

  it('reports an error to assistive technology', () => {
    render(
      <ComboBox
        label={LABEL}
        value=""
        options={OPTIONS}
        error="Select a stock."
        onChange={vi.fn()}
      />,
    );

    expect(field()).toHaveAttribute('aria-invalid', 'true');
    expect(field()).toHaveAccessibleDescription('Select a stock.');
  });
});
