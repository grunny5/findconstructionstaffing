import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  CompletionChecklist,
  generateChecklistItems,
  type ChecklistItem,
} from '../CompletionChecklist';

describe('CompletionChecklist', () => {
  describe('Rendering', () => {
    it('should render checklist heading', () => {
      const items: ChecklistItem[] = [
        {
          id: 'logo',
          label: 'Add Logo',
          completed: false,
          link: '/dashboard/profile#logo',
        },
      ];

      render(<CompletionChecklist items={items} />);

      expect(screen.getByText('Complete your profile:')).toBeInTheDocument();
    });

    it('should render all checklist items', () => {
      const items: ChecklistItem[] = [
        {
          id: 'logo',
          label: 'Add Logo',
          completed: false,
          link: '/dashboard/profile#logo',
        },
        {
          id: 'description',
          label: 'Complete Description',
          completed: false,
          link: '/dashboard/profile#description',
        },
        {
          id: 'trades',
          label: 'Select Trades',
          completed: true,
          link: '/dashboard/profile#trades',
        },
      ];

      render(<CompletionChecklist items={items} />);

      expect(screen.getByText('Add Logo')).toBeInTheDocument();
      expect(screen.getByText('Complete Description')).toBeInTheDocument();
      expect(screen.getByText('Select Trades')).toBeInTheDocument();
    });

    it('should render nothing when items array is empty', () => {
      const { container } = render(<CompletionChecklist items={[]} />);

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Completed Items', () => {
    it('should show line-through for completed items', () => {
      const items: ChecklistItem[] = [
        {
          id: 'logo',
          label: 'Add Logo',
          completed: true,
          link: '/dashboard/profile#logo',
        },
      ];

      render(<CompletionChecklist items={items} />);

      const item = screen.getByText('Add Logo');
      expect(item).toHaveClass('line-through');
    });

    it('should show checkmark icon for completed items', () => {
      const items: ChecklistItem[] = [
        {
          id: 'logo',
          label: 'Add Logo',
          completed: true,
          link: '/dashboard/profile#logo',
        },
      ];

      const { container } = render(<CompletionChecklist items={items} />);

      const checkmarkIcon = container.querySelector('svg.text-green-600');
      expect(checkmarkIcon).toBeInTheDocument();
    });

    it('should show faded/opacity styling for completed items', () => {
      const items: ChecklistItem[] = [
        {
          id: 'logo',
          label: 'Add Logo',
          completed: true,
          link: '/dashboard/profile#logo',
        },
      ];

      const { container } = render(<CompletionChecklist items={items} />);

      const link = screen.getByText('Add Logo').closest('a');
      expect(link).toHaveClass('opacity-50');
    });
  });

  describe('Incomplete Items', () => {
    it('should not show line-through for incomplete items', () => {
      const items: ChecklistItem[] = [
        {
          id: 'logo',
          label: 'Add Logo',
          completed: false,
          link: '/dashboard/profile#logo',
        },
      ];

      render(<CompletionChecklist items={items} />);

      const item = screen.getByText('Add Logo');
      expect(item).not.toHaveClass('line-through');
    });

    it('should show circle icon for incomplete items', () => {
      const items: ChecklistItem[] = [
        {
          id: 'logo',
          label: 'Add Logo',
          completed: false,
          link: '/dashboard/profile#logo',
        },
      ];

      const { container } = render(<CompletionChecklist items={items} />);

      const circleIcon = container.querySelector('svg.h-4.w-4:not(.text-green-600)');
      expect(circleIcon).toBeInTheDocument();
    });
  });

  describe('Links', () => {
    it('should link each item to the correct page', () => {
      const items: ChecklistItem[] = [
        {
          id: 'logo',
          label: 'Add Logo',
          completed: false,
          link: '/dashboard/profile#logo',
        },
        {
          id: 'description',
          label: 'Complete Description',
          completed: false,
          link: '/dashboard/profile#description',
        },
      ];

      const { container } = render(<CompletionChecklist items={items} />);

      const logoLink = screen.getByText('Add Logo').closest('a');
      expect(logoLink).toHaveAttribute('href', '/dashboard/profile#logo');

      const descLink = screen.getByText('Complete Description').closest('a');
      expect(descLink).toHaveAttribute('href', '/dashboard/profile#description');
    });
  });
});

describe('generateChecklistItems', () => {
  describe('Logo Check', () => {
    it('should mark logo as incomplete when missing', () => {
      const profile = {
        logo_url: null,
      };

      const items = generateChecklistItems(profile);
      const logoItem = items.find((item) => item.id === 'logo');

      expect(logoItem?.completed).toBe(false);
    });

    it('should mark logo as completed when present', () => {
      const profile = {
        logo_url: 'https://example.com/logo.png',
      };

      const items = generateChecklistItems(profile);
      const logoItem = items.find((item) => item.id === 'logo');

      expect(logoItem?.completed).toBe(true);
    });

    it('should mark logo as incomplete when empty string', () => {
      const profile = {
        logo_url: '',
      };

      const items = generateChecklistItems(profile);
      const logoItem = items.find((item) => item.id === 'logo');

      expect(logoItem?.completed).toBe(false);
    });
  });

  describe('Description Check', () => {
    it('should mark description as incomplete when missing', () => {
      const profile = {
        description: null,
      };

      const items = generateChecklistItems(profile);
      const descItem = items.find((item) => item.id === 'description');

      expect(descItem?.completed).toBe(false);
    });

    it('should mark description as incomplete when too short (< 100 chars)', () => {
      const profile = {
        description: 'This is too short',
      };

      const items = generateChecklistItems(profile);
      const descItem = items.find((item) => item.id === 'description');

      expect(descItem?.completed).toBe(false);
    });

    it('should mark description as completed when >= 100 chars', () => {
      const profile = {
        description:
          'This is a long enough description that contains more than one hundred characters and should be marked as complete',
      };

      const items = generateChecklistItems(profile);
      const descItem = items.find((item) => item.id === 'description');

      expect(descItem?.completed).toBe(true);
    });

    it('should mark description as incomplete when only whitespace', () => {
      const profile = {
        description: '   ',
      };

      const items = generateChecklistItems(profile);
      const descItem = items.find((item) => item.id === 'description');

      expect(descItem?.completed).toBe(false);
    });
  });

  describe('Trades Check', () => {
    it('should mark trades as incomplete when missing', () => {
      const profile = {
        trades: undefined,
      };

      const items = generateChecklistItems(profile);
      const tradesItem = items.find((item) => item.id === 'trades');

      expect(tradesItem?.completed).toBe(false);
    });

    it('should mark trades as incomplete when empty array', () => {
      const profile = {
        trades: [],
      };

      const items = generateChecklistItems(profile);
      const tradesItem = items.find((item) => item.id === 'trades');

      expect(tradesItem?.completed).toBe(false);
    });

    it('should mark trades as completed when has items', () => {
      const profile = {
        trades: [{ id: '1', name: 'Electrician' }],
      };

      const items = generateChecklistItems(profile);
      const tradesItem = items.find((item) => item.id === 'trades');

      expect(tradesItem?.completed).toBe(true);
    });
  });

  describe('Regions Check', () => {
    it('should mark regions as incomplete when missing', () => {
      const profile = {
        regions: undefined,
      };

      const items = generateChecklistItems(profile);
      const regionsItem = items.find((item) => item.id === 'regions');

      expect(regionsItem?.completed).toBe(false);
    });

    it('should mark regions as incomplete when empty array', () => {
      const profile = {
        regions: [],
      };

      const items = generateChecklistItems(profile);
      const regionsItem = items.find((item) => item.id === 'regions');

      expect(regionsItem?.completed).toBe(false);
    });

    it('should mark regions as completed when has items', () => {
      const profile = {
        regions: [{ id: '1', name: 'Texas' }],
      };

      const items = generateChecklistItems(profile);
      const regionsItem = items.find((item) => item.id === 'regions');

      expect(regionsItem?.completed).toBe(true);
    });
  });

  describe('Contact Info Check', () => {
    it('should mark contact as incomplete when both phone and email missing', () => {
      const profile = {
        phone: null,
        email: null,
      };

      const items = generateChecklistItems(profile);
      const contactItem = items.find((item) => item.id === 'contact');

      expect(contactItem?.completed).toBe(false);
    });

    it('should mark contact as completed when phone provided', () => {
      const profile = {
        phone: '+12345678900',
        email: null,
      };

      const items = generateChecklistItems(profile);
      const contactItem = items.find((item) => item.id === 'contact');

      expect(contactItem?.completed).toBe(true);
    });

    it('should mark contact as completed when email provided', () => {
      const profile = {
        phone: null,
        email: 'test@example.com',
      };

      const items = generateChecklistItems(profile);
      const contactItem = items.find((item) => item.id === 'contact');

      expect(contactItem?.completed).toBe(true);
    });

    it('should mark contact as completed when both provided', () => {
      const profile = {
        phone: '+12345678900',
        email: 'test@example.com',
      };

      const items = generateChecklistItems(profile);
      const contactItem = items.find((item) => item.id === 'contact');

      expect(contactItem?.completed).toBe(true);
    });

    it('should mark contact as incomplete when only whitespace', () => {
      const profile = {
        phone: '   ',
        email: '   ',
      };

      const items = generateChecklistItems(profile);
      const contactItem = items.find((item) => item.id === 'contact');

      expect(contactItem?.completed).toBe(false);
    });
  });

  describe('All Items Generated', () => {
    it('should generate all 5 checklist items', () => {
      const profile = {};

      const items = generateChecklistItems(profile);

      expect(items).toHaveLength(5);
      expect(items.map((i) => i.id)).toEqual(['logo', 'description', 'trades', 'regions', 'contact']);
    });

    it('should include proper links for all items', () => {
      const profile = {};

      const items = generateChecklistItems(profile);

      expect(items.every((item) => item.link.startsWith('/dashboard/profile#'))).toBe(true);
    });
  });
});
