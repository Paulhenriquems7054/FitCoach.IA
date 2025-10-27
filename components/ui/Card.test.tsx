import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Card } from './Card';

// Fix: Import Jest globals to resolve TypeScript errors.
import { describe, it, expect } from '@jest/globals';

describe('Card', () => {
  it('renders children correctly', () => {
    render(<Card><p>Card content</p></Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('applies additional class names', () => {
    const { container } = render(<Card className="extra-class">Content</Card>);
    expect(container.firstChild).toHaveClass('extra-class');
  });

  it('has base classes applied for styling', () => {
    const { container } = render(<Card>Content</Card>);
    expect(container.firstChild).toHaveClass('bg-white', 'dark:bg-slate-800/50', 'rounded-xl');
  });
});