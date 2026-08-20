import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { App } from '../App';

describe('App shell', () => {
  it('renders the product identity', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'DCAfolio' })).toBeInTheDocument();
    expect(screen.getByText('Personal Stock Tracker')).toBeInTheDocument();
  });

  it('credits NeOniTrouS', () => {
    render(<App />);

    expect(screen.getByText('© NeOniTrouS')).toBeInTheDocument();
  });
});
