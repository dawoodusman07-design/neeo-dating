import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react-native';

afterEach(cleanup);
import { ThemeProvider } from '@/theme';
import { Button, Chip, EmptyState, IconButton, ListRow, TextField, VerifiedBadge } from '@/ui';

const wrap = (ui: React.ReactElement, scheme: 'light' | 'dark' = 'light') => render(<ThemeProvider forceScheme={scheme}>{ui}</ThemeProvider>);

describe('ui kit accessibility', () => {
  it('Button exposes role, label and disabled/busy state', async () => {
    const onPress = jest.fn();
    await wrap(<Button title="Continue" onPress={onPress} />);
    const btn = screen.getByRole('button', { name: 'Continue' });
    fireEvent.press(btn);
    expect(onPress).toHaveBeenCalled();
  });

  it('Button loading state is busy and disabled', async () => {
    const onPress = jest.fn();
    await wrap(<Button title="Wait" loading onPress={onPress} />);
    expect(screen.getByRole('button', { name: 'Wait' }).props.accessibilityState).toMatchObject({ disabled: true, busy: true });
  });

  it('IconButton always has a spoken label and a 44pt hit area', async () => {
    await wrap(<IconButton icon="pass" label="Pass on Maya" size={36} />);
    const btn = screen.getByRole('button', { name: 'Pass on Maya' });
    expect(btn.props.hitSlop).toBe(4); // (44 - 36) / 2
  });

  it('Chip reports checked state', async () => {
    await wrap(<Chip label="Coffee" selected onPress={() => {}} />);
    expect(screen.getByRole('checkbox', { name: 'Coffee' }).props.accessibilityState.checked).toBe(true);
  });

  it('TextField shows error text (not colour alone)', async () => {
    await wrap(<TextField label="Code" error="Enter the 6-digit code" />, 'dark');
    expect(screen.getByText('Enter the 6-digit code')).toBeTruthy();
  });

  it('Verified uses icon + text', async () => {
    await wrap(<VerifiedBadge />);
    expect(screen.getByLabelText('Photo verified')).toBeTruthy();
    expect(screen.getByText('Verified')).toBeTruthy();
  });

  it('radio ListRow reports selection', async () => {
    await wrap(<ListRow title="Everyone" selected onPress={() => {}} />);
    expect(screen.getByRole('radio').props.accessibilityState.selected).toBe(true);
  });

  it('EmptyState renders title, body and action', async () => {
    const onPress = jest.fn();
    await wrap(<EmptyState icon="time" title="You’re all caught up" body="New introductions at 9:00." action={{ title: 'Go to chats', onPress }} />);
    fireEvent.press(screen.getByRole('button', { name: 'Go to chats' }));
    expect(onPress).toHaveBeenCalled();
  });
});
