import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Picks an option from a `ComboBox` the way a person does: open it, then click
 * the row. Kept here so a change to the control does not ripple through every
 * test that happens to choose a stock.
 */
export async function pickOption(fieldLabel: string, optionName: RegExp): Promise<void> {
  const field = screen.getByRole('combobox', { name: fieldLabel });
  await userEvent.click(field);

  const list = await screen.findByRole('listbox', { name: fieldLabel });
  await userEvent.click(within(list).getByRole('option', { name: optionName }));
}

/** Types into an open combobox to narrow the list, without choosing anything. */
export async function searchOptions(fieldLabel: string, query: string): Promise<void> {
  const field = screen.getByRole('combobox', { name: fieldLabel });
  await userEvent.click(field);
  await userEvent.type(field, query);
}
