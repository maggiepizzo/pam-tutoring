import { render, screen } from '@testing-library/react';
import App from './App';

test('example_test', () => {
  render(<App />);
  const linkElement = screen.getByText(/Pam Tutoring/i);
  expect(linkElement).toBeInTheDocument();
});
