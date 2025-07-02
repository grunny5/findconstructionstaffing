# Slug Generation and Internationalization

## Current Implementation

The `createSlug` function in `lib/utils/formatting.ts` provides:

1. **Input validation** - Handles null, undefined, and non-string inputs
2. **Unicode normalization** - Uses NFD to decompose accented characters
3. **Diacritic removal** - Strips accents from decomposable characters
4. **Special character handling** - Replaces non-alphanumeric sequences with hyphens
5. **Cleanup** - Removes duplicate and leading/trailing hyphens

## Limitations

### Character Support

- Characters that cannot be decomposed using NFD (like Ø, Æ, Đ) are removed entirely
- Non-Latin scripts (Cyrillic, Arabic, Chinese, etc.) are removed
- This can lead to empty or truncated slugs for non-Latin content

### Examples of Current Behavior

```typescript
createSlug('Café'); // 'cafe' ✓
createSlug('São Paulo'); // 'sao-paulo' ✓
createSlug('Øresund'); // 'resund' ⚠️
createSlug('北京'); // '' ⚠️
createSlug('Москва'); // '' ⚠️
```

## Recommended Enhancement: Transliteration

### Option 1: Use `slugify` Library

```bash
npm install slugify
```

```typescript
import slugify from 'slugify';

export const createSlug = (text: string): string => {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return slugify(text, {
    lower: true,
    strict: true,
    locale: 'en', // Can be customized per user locale
  });
};
```

### Option 2: Use `transliteration` Library

```bash
npm install transliteration
```

```typescript
import { slugify } from 'transliteration';

export const createSlug = (text: string): string => {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return slugify(text);
};
```

### Benefits of Library Approach

- Proper transliteration of non-Latin scripts
- Configurable locale support
- Better handling of edge cases
- Maintained character mappings

### Examples with Transliteration

```typescript
createSlug('Øresund'); // 'oresund' ✓
createSlug('北京'); // 'bei-jing' ✓
createSlug('Москва'); // 'moskva' ✓
createSlug('Æther'); // 'aether' ✓
```

## Implementation Considerations

1. **Backwards Compatibility**
   - Existing slugs in the database must remain valid
   - Consider running a migration to update slugs if needed

2. **SEO Impact**
   - Better slugs improve international SEO
   - Transliterated slugs are more readable for global users

3. **Performance**
   - Library adds ~10-20KB to bundle size
   - Consider dynamic import for code splitting

4. **Database Constraints**
   - Ensure slug column has appropriate length
   - Add unique constraints where necessary

## Testing Requirements

Add comprehensive tests for:

- All Latin-1 supplement characters
- Common European languages (German, French, Spanish, etc.)
- Cyrillic scripts (Russian, Ukrainian, etc.)
- Asian languages (Chinese, Japanese, Korean)
- Arabic and Hebrew scripts
- Edge cases with mixed scripts
