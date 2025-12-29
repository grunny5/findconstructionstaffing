/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../tabs';

describe('Tabs Components', () => {
  const renderTabs = (props = {}) => {
    return render(
      <Tabs defaultValue="tab1" {...props}>
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          <TabsTrigger value="tab3" disabled>
            Tab 3
          </TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
        <TabsContent value="tab3">Content 3</TabsContent>
      </Tabs>
    );
  };

  describe('Basic Rendering', () => {
    it('should render tabs with triggers', () => {
      renderTabs();
      expect(screen.getByRole('tablist')).toBeInTheDocument();
      expect(screen.getAllByRole('tab')).toHaveLength(3);
    });

    it('should render tab content', () => {
      renderTabs();
      expect(screen.getByText('Content 1')).toBeInTheDocument();
    });

    it('should show correct content for default value', () => {
      renderTabs({ defaultValue: 'tab2' });
      expect(screen.getByText('Content 2')).toBeVisible();
    });
  });

  describe('TabsList', () => {
    it('should apply base styling classes', () => {
      renderTabs();
      const tabsList = screen.getByRole('tablist');

      expect(tabsList).toHaveClass('inline-flex');
      expect(tabsList).toHaveClass('h-10');
      expect(tabsList).toHaveClass('items-center');
      expect(tabsList).toHaveClass('justify-center');
      expect(tabsList).toHaveClass('rounded-md');
      expect(tabsList).toHaveClass('bg-muted');
      expect(tabsList).toHaveClass('p-1');
      expect(tabsList).toHaveClass('text-muted-foreground');
    });

    it('should accept custom className', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList className="custom-list-class">
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content</TabsContent>
        </Tabs>
      );
      const tabsList = screen.getByRole('tablist');
      expect(tabsList).toHaveClass('custom-list-class');
    });

    it('should forward ref to tablist element', () => {
      const ref = { current: null as HTMLDivElement | null };
      render(
        <Tabs defaultValue="tab1">
          <TabsList ref={ref}>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content</TabsContent>
        </Tabs>
      );
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('TabsTrigger', () => {
    it('should apply base styling classes', () => {
      renderTabs();
      const trigger = screen.getByRole('tab', { name: 'Tab 1' });

      expect(trigger).toHaveClass('inline-flex');
      expect(trigger).toHaveClass('items-center');
      expect(trigger).toHaveClass('justify-center');
      expect(trigger).toHaveClass('whitespace-nowrap');
      expect(trigger).toHaveClass('rounded-sm');
      expect(trigger).toHaveClass('px-3');
      expect(trigger).toHaveClass('py-1.5');
      expect(trigger).toHaveClass('text-sm');
      expect(trigger).toHaveClass('font-medium');
      expect(trigger).toHaveClass('transition-all');
    });

    it('should have focus ring classes for accessibility', () => {
      renderTabs();
      const trigger = screen.getByRole('tab', { name: 'Tab 1' });

      expect(trigger).toHaveClass('ring-offset-background');
      expect(trigger).toHaveClass('focus-visible:outline-none');
      expect(trigger).toHaveClass('focus-visible:ring-2');
      expect(trigger).toHaveClass('focus-visible:ring-industrial-orange-600');
      expect(trigger).toHaveClass('focus-visible:ring-offset-2');
    });

    it('should show focus ring when trigger receives focus', async () => {
      const user = userEvent.setup();
      render(
        <>
          <button>Before</button>
          <Tabs defaultValue="tab1">
            <TabsList>
              <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            </TabsList>
            <TabsContent value="tab1">Content</TabsContent>
          </Tabs>
        </>
      );

      const beforeButton = screen.getByRole('button', { name: 'Before' });
      beforeButton.focus();

      await user.tab();

      const trigger = screen.getByRole('tab', { name: 'Tab 1' });
      expect(trigger).toHaveFocus();
      expect(trigger).toHaveClass('focus-visible:ring-industrial-orange-600');
    });

    it('should apply active state classes when selected', () => {
      renderTabs();
      const activeTrigger = screen.getByRole('tab', { name: 'Tab 1' });

      expect(activeTrigger).toHaveAttribute('data-state', 'active');
      expect(activeTrigger).toHaveClass('data-[state=active]:bg-background');
      expect(activeTrigger).toHaveClass('data-[state=active]:text-foreground');
      expect(activeTrigger).toHaveClass('data-[state=active]:shadow-sm');
    });

    it('should apply inactive state when not selected', () => {
      renderTabs();
      const inactiveTrigger = screen.getByRole('tab', { name: 'Tab 2' });

      expect(inactiveTrigger).toHaveAttribute('data-state', 'inactive');
    });

    it('should accept custom className', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1" className="custom-trigger-class">
              Tab 1
            </TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content</TabsContent>
        </Tabs>
      );
      const trigger = screen.getByRole('tab');
      expect(trigger).toHaveClass('custom-trigger-class');
    });

    it('should forward ref to trigger element', () => {
      const ref = { current: null as HTMLButtonElement | null };
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1" ref={ref}>
              Tab 1
            </TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content</TabsContent>
        </Tabs>
      );
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });
  });

  describe('TabsContent', () => {
    it('should apply base styling classes', () => {
      renderTabs();
      const content = screen.getByRole('tabpanel');

      expect(content).toHaveClass('mt-2');
      expect(content).toHaveClass('ring-offset-background');
    });

    it('should have focus ring classes for accessibility', () => {
      renderTabs();
      const content = screen.getByRole('tabpanel');

      expect(content).toHaveClass('focus-visible:outline-none');
      expect(content).toHaveClass('focus-visible:ring-2');
      expect(content).toHaveClass('focus-visible:ring-industrial-orange-600');
      expect(content).toHaveClass('focus-visible:ring-offset-2');
    });

    it('should accept custom className', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1" className="custom-content-class">
            Content
          </TabsContent>
        </Tabs>
      );
      const content = screen.getByRole('tabpanel');
      expect(content).toHaveClass('custom-content-class');
    });

    it('should forward ref to content element', () => {
      const ref = { current: null as HTMLDivElement | null };
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1" ref={ref}>
            Content
          </TabsContent>
        </Tabs>
      );
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('Disabled State', () => {
    it('should apply disabled styles to disabled trigger', () => {
      renderTabs();
      const disabledTrigger = screen.getByRole('tab', { name: 'Tab 3' });

      expect(disabledTrigger).toBeDisabled();
      expect(disabledTrigger).toHaveClass('disabled:pointer-events-none');
      expect(disabledTrigger).toHaveClass('disabled:opacity-50');
    });

    it('should not switch to disabled tab on click', async () => {
      const user = userEvent.setup();
      renderTabs();

      const disabledTrigger = screen.getByRole('tab', { name: 'Tab 3' });
      await user.click(disabledTrigger);

      // Tab 1 should still be active since disabled tab can't be selected
      const tab1 = screen.getByRole('tab', { name: 'Tab 1' });
      expect(tab1).toHaveAttribute('data-state', 'active');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should activate tab when clicked', async () => {
      const user = userEvent.setup();
      renderTabs();

      const tab2 = screen.getByRole('tab', { name: 'Tab 2' });
      await user.click(tab2);

      expect(tab2).toHaveAttribute('data-state', 'active');
      expect(screen.getByText('Content 2')).toBeVisible();
    });

    it('should have keyboard-related classes for accessibility', () => {
      renderTabs();
      const tab1 = screen.getByRole('tab', { name: 'Tab 1' });
      const tab2 = screen.getByRole('tab', { name: 'Tab 2' });

      // Tab 1 is active, inactive tabs have tabindex -1 for roving tabindex pattern
      expect(tab1).toHaveAttribute('data-state', 'active');
      expect(tab2).toHaveAttribute('tabindex', '-1');
    });
  });

  describe('ARIA Attributes', () => {
    it('should have proper ARIA attributes on tablist', () => {
      renderTabs();
      const tabsList = screen.getByRole('tablist');
      expect(tabsList).toHaveAttribute('role', 'tablist');
    });

    it('should have proper ARIA attributes on triggers', () => {
      renderTabs();
      const tab1 = screen.getByRole('tab', { name: 'Tab 1' });
      const tab2 = screen.getByRole('tab', { name: 'Tab 2' });

      expect(tab1).toHaveAttribute('role', 'tab');
      expect(tab1).toHaveAttribute('aria-selected', 'true');
      expect(tab2).toHaveAttribute('aria-selected', 'false');
    });

    it('should have proper ARIA attributes on content', () => {
      renderTabs();
      const content = screen.getByRole('tabpanel');
      expect(content).toHaveAttribute('role', 'tabpanel');
    });

    it('should link triggers to content with aria-controls', () => {
      renderTabs();
      const tab1 = screen.getByRole('tab', { name: 'Tab 1' });
      const content = screen.getByRole('tabpanel');

      const controlsId = tab1.getAttribute('aria-controls');
      expect(controlsId).toBeTruthy();
      if (controlsId) {
        expect(content).toHaveAttribute('id', controlsId);
      }
    });
  });

  describe('Tab Switching', () => {
    it('should switch content when clicking different tabs', async () => {
      const user = userEvent.setup();
      renderTabs();

      expect(screen.getByText('Content 1')).toBeVisible();

      await user.click(screen.getByRole('tab', { name: 'Tab 2' }));
      expect(screen.getByText('Content 2')).toBeVisible();

      await user.click(screen.getByRole('tab', { name: 'Tab 1' }));
      expect(screen.getByText('Content 1')).toBeVisible();
    });

    it('should call onValueChange when tab changes', async () => {
      const onValueChange = jest.fn();
      const user = userEvent.setup();

      render(
        <Tabs defaultValue="tab1" onValueChange={onValueChange}>
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      );

      await user.click(screen.getByRole('tab', { name: 'Tab 2' }));
      expect(onValueChange).toHaveBeenCalledWith('tab2');
    });

    it('should work as controlled component', async () => {
      const onValueChange = jest.fn();
      const user = userEvent.setup();

      const { rerender } = render(
        <Tabs value="tab1" onValueChange={onValueChange}>
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      );

      await user.click(screen.getByRole('tab', { name: 'Tab 2' }));
      expect(onValueChange).toHaveBeenCalledWith('tab2');

      rerender(
        <Tabs value="tab2" onValueChange={onValueChange}>
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      );

      expect(screen.getByText('Content 2')).toBeVisible();
    });
  });
});
