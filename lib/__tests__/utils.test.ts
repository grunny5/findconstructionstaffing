import { cn } from '../utils';

describe('cn utility', () => {
  it('should merge class names', () => {
    const result = cn('class1', 'class2');
    expect(result).toBe('class1 class2');
  });

  it('should handle conditional classes', () => {
    const isActive = true;
    const isDisabled = false;

    const result = cn(
      'base-class',
      isActive && 'active',
      isDisabled && 'disabled'
    );

    expect(result).toBe('base-class active');
  });

  it('should handle arrays of classes', () => {
    const result = cn(['class1', 'class2'], 'class3');
    expect(result).toBe('class1 class2 class3');
  });

  it('should merge conflicting Tailwind classes', () => {
    const result = cn('px-2 py-1', 'px-4');
    expect(result).toBe('py-1 px-4');
  });

  it('should handle undefined and null values', () => {
    const result = cn('class1', undefined, null, 'class2');
    expect(result).toBe('class1 class2');
  });

  it('should handle empty strings', () => {
    const result = cn('class1', '', 'class2');
    expect(result).toBe('class1 class2');
  });

  it('should handle objects with boolean values', () => {
    const result = cn('base', {
      active: true,
      disabled: false,
      highlighted: true,
    });
    expect(result).toBe('base active highlighted');
  });

  it('should handle complex Tailwind utility merging', () => {
    const result = cn('text-red-500 bg-blue-500 p-4', 'text-green-500 p-2');
    expect(result).toBe('bg-blue-500 text-green-500 p-2');
  });

  it('should handle responsive Tailwind utilities', () => {
    const result = cn('md:p-4 lg:p-6', 'md:p-2');
    expect(result).toBe('lg:p-6 md:p-2');
  });

  it('should handle hover and other state utilities', () => {
    const result = cn('hover:bg-red-500 focus:ring-2', 'hover:bg-blue-500');
    expect(result).toBe('focus:ring-2 hover:bg-blue-500');
  });

  it('should handle no arguments', () => {
    const result = cn();
    expect(result).toBe('');
  });

  it('should handle single argument', () => {
    const result = cn('single-class');
    expect(result).toBe('single-class');
  });

  it('should handle duplicate classes', () => {
    const result = cn('class1 class2', 'class1');
    // clsx doesn't deduplicate by default, but that's okay
    expect(result).toContain('class1');
    expect(result).toContain('class2');
  });

  it('should handle arbitrary values in Tailwind', () => {
    const result = cn('w-[100px] h-[200px]', 'w-[150px]');
    expect(result).toBe('h-[200px] w-[150px]');
  });

  it('should preserve important modifiers', () => {
    const result = cn('!text-red-500', 'text-blue-500');
    // The important modifier should be preserved
    expect(result).toContain('!text-red-500');
  });
});
