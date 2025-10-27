import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Alert } from './Alert';

// Fix: Import Jest globals to resolve TypeScript errors.
import { describe, it, expect } from '@jest/globals';

describe('Alert', () => {
  it('renders title and children for info type', () => {
    render(<Alert type="info" title="Information">Some info here.</Alert>);
    expect(screen.getByText('Information')).toBeInTheDocument();
    expect(screen.getByText('Some info here.')).toBeInTheDocument();
  });

  it('renders success variant with correct styles', () => {
    const { container } = render(<Alert type="success" title="Success">It worked!</Alert>);
    const alertDiv = container.firstChild as HTMLElement;
    expect(alertDiv).toHaveClass('bg-green-50');
    expect(container.querySelector('svg.text-green-500')).toBeInTheDocument();
  });

  it('renders error variant with correct styles', () => {
    const { container } = render(<Alert type="error" title="Error">It failed.</Alert>);
    const alertDiv = container.firstChild as HTMLElement;
    expect(alertDiv).toHaveClass('bg-red-50');
    expect(container.querySelector('svg.text-red-500')).toBeInTheDocument();
  });
  
  it('renders info variant with correct styles', () => {
    const { container } = render(<Alert type="info" title="Info">For your information.</Alert>);
    const alertDiv = container.firstChild as HTMLElement;
    expect(alertDiv).toHaveClass('bg-blue-50');
    expect(container.querySelector('svg.text-blue-500')).toBeInTheDocument();
  });
});