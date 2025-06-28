# Phone Number Internationalization

## Current State

The `formatPhoneNumber` function in `lib/utils/formatting.ts` currently supports only US phone numbers in the format (XXX) XXX-XXXX.

## Future Enhancement: International Phone Number Support

### Recommendation

For comprehensive international phone number support, integrate the `libphonenumber-js` library.

### Implementation Plan

1. **Install the library**
   ```bash
   npm install libphonenumber-js
   ```

2. **Update the function** to support multiple formats:
   ```typescript
   import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';

   export const formatPhoneNumber = (phone: string, country: string = 'US'): string => {
     if (!phone || typeof phone !== 'string') {
       return '';
     }

     try {
       if (isValidPhoneNumber(phone, country)) {
         const phoneNumber = parsePhoneNumber(phone, country);
         return phoneNumber.formatInternational();
       }
     } catch (error) {
       // Fall back to original input if parsing fails
     }

     // Keep existing US-only formatting as fallback
     const cleaned = phone.replace(/\D/g, '');
     const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
     if (match) {
       return `(${match[1]}) ${match[2]}-${match[3]}`;
     }

     return phone;
   };
   ```

3. **Benefits**
   - Support for 200+ countries
   - Proper validation for each country's format
   - Automatic formatting based on country code
   - E.164 format support for database storage

4. **Database Considerations**
   - Store phone numbers in E.164 format (e.g., +12125551234)
   - Add a `country_code` column to agencies table
   - Display formatted based on user's locale

5. **Migration Strategy**
   - Keep backward compatibility with existing US numbers
   - Gradually migrate existing data to E.164 format
   - Update forms to include country selection

### Related Files to Update

- `lib/utils/formatting.ts` - Main implementation
- `lib/utils/__tests__/formatting.test.ts` - Add international test cases
- `app/api/agencies/route.ts` - Update to handle international formats
- Database schema - Add country_code field

### Testing Considerations

Add test cases for:
- UK numbers: +44 20 7946 0958
- Canada: +1 416 555 0123
- Australia: +61 2 9876 5432
- Invalid international formats
- Numbers with extensions