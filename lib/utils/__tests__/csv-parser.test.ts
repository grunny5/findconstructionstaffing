/**
 * Tests for CSV/XLSX Parser
 */

import {
  parseCSV,
  parseXLSX,
  parseFile,
  EXPECTED_COLUMNS,
  ParseResult,
} from '../csv-parser';
import * as XLSX from 'xlsx';

describe('csv-parser', () => {
  describe('parseCSV', () => {
    describe('Basic Parsing', () => {
      it('parses a valid CSV with all columns', () => {
        const csv = `name,description,website,phone,email,headquarters,founded_year,employee_count,company_size,offers_per_diem,is_union,trades,regions
ABC Staffing,Best staffing company,https://abc.com,555-1234,info@abc.com,Houston TX,2010,50-100,Medium,true,false,"Electrician,Welder","TX,LA"`;

        const result = parseCSV(csv);

        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(1);
        expect(result.errors).toHaveLength(0);

        const row = result.data[0];
        expect(row.name).toBe('ABC Staffing');
        expect(row.description).toBe('Best staffing company');
        expect(row.website).toBe('https://abc.com');
        expect(row.phone).toBe('555-1234');
        expect(row.email).toBe('info@abc.com');
        expect(row.headquarters).toBe('Houston TX');
        expect(row.founded_year).toBe('2010');
        expect(row.employee_count).toBe('50-100');
        expect(row.company_size).toBe('Medium');
        expect(row.offers_per_diem).toBe(true);
        expect(row.is_union).toBe(false);
        expect(row.trades).toEqual(['Electrician', 'Welder']);
        expect(row.regions).toEqual(['TX', 'LA']);
        expect(row._rowNumber).toBe(2);
      });

      it('parses multiple rows', () => {
        const csv = `name,description
Agency One,First agency
Agency Two,Second agency
Agency Three,Third agency`;

        const result = parseCSV(csv);

        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(3);
        expect(result.data[0].name).toBe('Agency One');
        expect(result.data[0]._rowNumber).toBe(2);
        expect(result.data[1].name).toBe('Agency Two');
        expect(result.data[1]._rowNumber).toBe(3);
        expect(result.data[2].name).toBe('Agency Three');
        expect(result.data[2]._rowNumber).toBe(4);
      });

      it('handles quoted fields with commas', () => {
        const csv = `name,description
"Smith, Jones & Associates","Full service staffing, recruiting, and consulting"`;

        const result = parseCSV(csv);

        expect(result.success).toBe(true);
        expect(result.data[0].name).toBe('Smith, Jones & Associates');
        expect(result.data[0].description).toBe(
          'Full service staffing, recruiting, and consulting'
        );
      });

      it('handles quoted fields with quotes inside', () => {
        const csv = `name,description
"The ""Best"" Staffing","Description with ""quotes"""`;

        const result = parseCSV(csv);

        expect(result.success).toBe(true);
        expect(result.data[0].name).toBe('The "Best" Staffing');
        expect(result.data[0].description).toBe('Description with "quotes"');
      });

      it('handles newlines in quoted fields', () => {
        const csv = `name,description
"Multi-Line Agency","First line
Second line
Third line"`;

        const result = parseCSV(csv);

        expect(result.success).toBe(true);
        expect(result.data[0].description).toContain('First line');
        expect(result.data[0].description).toContain('Second line');
      });
    });

    describe('Header Handling', () => {
      it('fails when name column is missing', () => {
        const csv = `description,website
Some description,https://example.com`;

        const result = parseCSV(csv);

        expect(result.success).toBe(false);
        expect(result.errors).toContainEqual(
          expect.objectContaining({
            type: 'header',
            message: 'Missing required column: name',
          })
        );
      });

      it('handles case-insensitive headers', () => {
        const csv = `NAME,DESCRIPTION,Website,OFFERS_PER_DIEM
Test Agency,Test Desc,https://test.com,yes`;

        const result = parseCSV(csv);

        expect(result.success).toBe(true);
        expect(result.data[0].name).toBe('Test Agency');
        expect(result.data[0].website).toBe('https://test.com');
        expect(result.data[0].offers_per_diem).toBe(true);
      });

      it('handles headers with extra whitespace', () => {
        const csv = `  name  ,  description
Test Agency,Test Desc`;

        const result = parseCSV(csv);

        expect(result.success).toBe(true);
        expect(result.data[0].name).toBe('Test Agency');
      });

      it('warns about unrecognized columns', () => {
        const csv = `name,description,unknown_column,another_unknown
Test Agency,Test Desc,ignored,also ignored`;

        const result = parseCSV(csv);

        expect(result.success).toBe(true);
        expect(result.warnings).toContainEqual(
          expect.stringContaining('Unrecognized columns will be ignored')
        );
        expect(result.warnings[0]).toContain('unknown_column');
        expect(result.warnings[0]).toContain('another_unknown');
      });

      it('ignores extra columns in data', () => {
        const csv = `name,extra_col
Test Agency,ignored value`;

        const result = parseCSV(csv);

        expect(result.success).toBe(true);
        expect(result.data[0].name).toBe('Test Agency');
        expect(result.data[0]).not.toHaveProperty('extra_col');
      });
    });

    describe('Missing Values', () => {
      it('handles missing optional columns', () => {
        const csv = `name
Test Agency`;

        const result = parseCSV(csv);

        expect(result.success).toBe(true);
        expect(result.data[0].name).toBe('Test Agency');
        expect(result.data[0].description).toBeUndefined();
        expect(result.data[0].website).toBeUndefined();
        expect(result.data[0].trades).toBeUndefined();
      });

      it('handles empty values in cells', () => {
        const csv = `name,description,website
Test Agency,,`;

        const result = parseCSV(csv);

        expect(result.success).toBe(true);
        expect(result.data[0].name).toBe('Test Agency');
        expect(result.data[0].description).toBeUndefined();
        expect(result.data[0].website).toBeUndefined();
      });

      it('skips empty rows', () => {
        const csv = `name,description
Agency One,First

Agency Two,Second

`;

        const result = parseCSV(csv);

        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(2);
        expect(result.data[0].name).toBe('Agency One');
        expect(result.data[1].name).toBe('Agency Two');
      });

      it('skips rows with only whitespace', () => {
        const csv = `name,description
Agency One,First
   ,
Agency Two,Second`;

        const result = parseCSV(csv);

        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(2);
      });
    });

    describe('Boolean Normalization', () => {
      const booleanTestCases = [
        { input: 'true', expected: true },
        { input: 'TRUE', expected: true },
        { input: 'True', expected: true },
        { input: 'yes', expected: true },
        { input: 'YES', expected: true },
        { input: 'Yes', expected: true },
        { input: 'y', expected: true },
        { input: 'Y', expected: true },
        { input: '1', expected: true },
        { input: 'false', expected: false },
        { input: 'FALSE', expected: false },
        { input: 'False', expected: false },
        { input: 'no', expected: false },
        { input: 'NO', expected: false },
        { input: 'No', expected: false },
        { input: 'n', expected: false },
        { input: 'N', expected: false },
        { input: '0', expected: false },
        { input: '', expected: undefined },
        { input: 'invalid', expected: undefined },
        { input: 'maybe', expected: undefined },
      ];

      it.each(booleanTestCases)(
        'normalizes "$input" to $expected for offers_per_diem',
        ({ input, expected }) => {
          const csv = `name,offers_per_diem
Test Agency,${input}`;

          const result = parseCSV(csv);

          expect(result.success).toBe(true);
          expect(result.data[0].offers_per_diem).toBe(expected);
        }
      );

      it.each(booleanTestCases)(
        'normalizes "$input" to $expected for is_union',
        ({ input, expected }) => {
          const csv = `name,is_union
Test Agency,${input}`;

          const result = parseCSV(csv);

          expect(result.success).toBe(true);
          expect(result.data[0].is_union).toBe(expected);
        }
      );
    });

    describe('Array Parsing (trades and regions)', () => {
      it('parses comma-separated trades', () => {
        const csv = `name,trades
Test Agency,"Electrician, Welder, Pipefitter"`;

        const result = parseCSV(csv);

        expect(result.success).toBe(true);
        expect(result.data[0].trades).toEqual([
          'Electrician',
          'Welder',
          'Pipefitter',
        ]);
      });

      it('parses comma-separated regions', () => {
        const csv = `name,regions
Test Agency,"TX, CA, NY, FL"`;

        const result = parseCSV(csv);

        expect(result.success).toBe(true);
        expect(result.data[0].regions).toEqual(['TX', 'CA', 'NY', 'FL']);
      });

      it('handles trades without spaces after commas', () => {
        const csv = `name,trades
Test Agency,Electrician,Welder,Pipefitter`;

        const result = parseCSV(csv);

        expect(result.success).toBe(true);
        // Note: without quotes, commas separate columns, so only first trade is captured
        // This is expected CSV behavior
        expect(result.data[0].trades).toEqual(['Electrician']);
      });

      it('handles quoted trades with commas', () => {
        const csv = `name,trades
Test Agency,"Electrician,Welder,Pipefitter"`;

        const result = parseCSV(csv);

        expect(result.success).toBe(true);
        expect(result.data[0].trades).toEqual([
          'Electrician',
          'Welder',
          'Pipefitter',
        ]);
      });

      it('filters out empty values in arrays', () => {
        const csv = `name,trades
Test Agency,"Electrician, , Welder, , Pipefitter"`;

        const result = parseCSV(csv);

        expect(result.success).toBe(true);
        expect(result.data[0].trades).toEqual([
          'Electrician',
          'Welder',
          'Pipefitter',
        ]);
      });

      it('returns undefined for empty trades/regions', () => {
        const csv = `name,trades,regions
Test Agency,,`;

        const result = parseCSV(csv);

        expect(result.success).toBe(true);
        expect(result.data[0].trades).toBeUndefined();
        expect(result.data[0].regions).toBeUndefined();
      });
    });

    describe('Special Characters', () => {
      it('handles special characters in values', () => {
        const csv = `name,description
"ABC & Sons",Description with special chars: @#$%^&*()`;

        const result = parseCSV(csv);

        expect(result.success).toBe(true);
        expect(result.data[0].name).toBe('ABC & Sons');
        expect(result.data[0].description).toContain('@#$%^&*()');
      });

      it('handles unicode characters', () => {
        const csv = `name,description
Société Générale,Entreprise de recrutement française`;

        const result = parseCSV(csv);

        expect(result.success).toBe(true);
        expect(result.data[0].name).toBe('Société Générale');
      });

      it('handles URLs in website field', () => {
        const csv = `name,website
Test Agency,https://example.com/path?query=value&other=123`;

        const result = parseCSV(csv);

        expect(result.success).toBe(true);
        expect(result.data[0].website).toBe(
          'https://example.com/path?query=value&other=123'
        );
      });
    });

    describe('Error Handling', () => {
      it('handles empty CSV content', () => {
        const result = parseCSV('');

        expect(result.success).toBe(false);
        expect(result.errors).toContainEqual(
          expect.objectContaining({
            type: 'header',
            message: 'Missing required column: name',
          })
        );
      });

      it('handles CSV with only headers', () => {
        const csv = `name,description`;

        const result = parseCSV(csv);

        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(0);
      });
    });
  });

  describe('parseXLSX', () => {
    function createXLSXBuffer(
      data: unknown[][],
      sheetName = 'Sheet1'
    ): ArrayBuffer {
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
      return buffer;
    }

    describe('Basic Parsing', () => {
      it('parses a valid XLSX file', () => {
        const data = [
          ['name', 'description', 'offers_per_diem', 'trades'],
          ['Test Agency', 'Test Description', 'true', 'Electrician,Welder'],
        ];
        const buffer = createXLSXBuffer(data);

        const result = parseXLSX(buffer);

        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(1);
        expect(result.data[0].name).toBe('Test Agency');
        expect(result.data[0].description).toBe('Test Description');
        expect(result.data[0].offers_per_diem).toBe(true);
        expect(result.data[0].trades).toEqual(['Electrician', 'Welder']);
      });

      it('parses multiple rows', () => {
        const data = [
          ['name', 'description'],
          ['Agency One', 'First'],
          ['Agency Two', 'Second'],
          ['Agency Three', 'Third'],
        ];
        const buffer = createXLSXBuffer(data);

        const result = parseXLSX(buffer);

        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(3);
        expect(result.data[0].name).toBe('Agency One');
        expect(result.data[1].name).toBe('Agency Two');
        expect(result.data[2].name).toBe('Agency Three');
      });

      it('handles numeric values as strings', () => {
        const data = [
          ['name', 'founded_year', 'phone'],
          ['Test Agency', 2010, 5551234567],
        ];
        const buffer = createXLSXBuffer(data);

        const result = parseXLSX(buffer);

        expect(result.success).toBe(true);
        expect(result.data[0].founded_year).toBe('2010');
        expect(result.data[0].phone).toBe('5551234567');
      });
    });

    describe('Sheet Handling', () => {
      it('only parses first sheet', () => {
        const workbook = XLSX.utils.book_new();

        const sheet1 = XLSX.utils.aoa_to_sheet([
          ['name'],
          ['Agency from Sheet 1'],
        ]);
        XLSX.utils.book_append_sheet(workbook, sheet1, 'First');

        const sheet2 = XLSX.utils.aoa_to_sheet([
          ['name'],
          ['Agency from Sheet 2'],
        ]);
        XLSX.utils.book_append_sheet(workbook, sheet2, 'Second');

        const buffer = XLSX.write(workbook, {
          type: 'array',
          bookType: 'xlsx',
        });

        const result = parseXLSX(buffer);

        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(1);
        expect(result.data[0].name).toBe('Agency from Sheet 1');
        expect(result.warnings).toContainEqual(
          expect.stringContaining('Only the first sheet')
        );
      });

      it('fails on corrupted/invalid buffer', () => {
        // A corrupted or invalid buffer that isn't a valid XLSX file
        const invalidBuffer = new ArrayBuffer(100);
        const view = new Uint8Array(invalidBuffer);
        // Fill with random data that isn't a valid ZIP/XLSX structure
        for (let i = 0; i < 100; i++) {
          view[i] = i;
        }

        const result = parseXLSX(invalidBuffer);

        // Should fail - either with a file error (if XLSX lib throws) or
        // a header error (if parsed but missing required columns)
        expect(result.success).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });

      it('fails on empty sheet', () => {
        const data: unknown[][] = [];
        const buffer = createXLSXBuffer(data);

        const result = parseXLSX(buffer);

        expect(result.success).toBe(false);
        expect(result.errors).toContainEqual(
          expect.objectContaining({
            type: 'file',
            message: 'Sheet is empty',
          })
        );
      });
    });

    describe('Header Validation', () => {
      it('fails when name column is missing', () => {
        const data = [
          ['description', 'website'],
          ['Test', 'https://test.com'],
        ];
        const buffer = createXLSXBuffer(data);

        const result = parseXLSX(buffer);

        expect(result.success).toBe(false);
        expect(result.errors).toContainEqual(
          expect.objectContaining({
            type: 'header',
            message: 'Missing required column: name',
          })
        );
      });
    });

    describe('Empty Row Handling', () => {
      it('skips empty rows', () => {
        const data = [
          ['name', 'description'],
          ['Agency One', 'First'],
          ['', ''],
          ['Agency Two', 'Second'],
        ];
        const buffer = createXLSXBuffer(data);

        const result = parseXLSX(buffer);

        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(2);
        expect(result.data[0].name).toBe('Agency One');
        expect(result.data[1].name).toBe('Agency Two');
      });
    });
  });

  describe('parseFile', () => {
    it('parses CSV files based on extension', async () => {
      const csvContent = `name,description
Test Agency,Test Desc`;
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' });

      const result = await parseFile(file);

      expect(result.success).toBe(true);
      expect(result.data[0].name).toBe('Test Agency');
    });

    it('parses XLSX files based on extension', async () => {
      const workbook = XLSX.utils.book_new();
      const sheet = XLSX.utils.aoa_to_sheet([
        ['name', 'description'],
        ['Test Agency', 'Test Desc'],
      ]);
      XLSX.utils.book_append_sheet(workbook, sheet, 'Sheet1');
      const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });

      const file = new File([buffer], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const result = await parseFile(file);

      expect(result.success).toBe(true);
      expect(result.data[0].name).toBe('Test Agency');
    });

    it('returns error for unsupported file types', async () => {
      const file = new File(['content'], 'test.pdf', {
        type: 'application/pdf',
      });

      const result = await parseFile(file);

      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          type: 'file',
          message: expect.stringContaining('Unsupported file type'),
        })
      );
    });
  });

  describe('EXPECTED_COLUMNS', () => {
    it('contains all expected column names', () => {
      expect(EXPECTED_COLUMNS).toContain('name');
      expect(EXPECTED_COLUMNS).toContain('description');
      expect(EXPECTED_COLUMNS).toContain('website');
      expect(EXPECTED_COLUMNS).toContain('phone');
      expect(EXPECTED_COLUMNS).toContain('email');
      expect(EXPECTED_COLUMNS).toContain('headquarters');
      expect(EXPECTED_COLUMNS).toContain('founded_year');
      expect(EXPECTED_COLUMNS).toContain('employee_count');
      expect(EXPECTED_COLUMNS).toContain('company_size');
      expect(EXPECTED_COLUMNS).toContain('offers_per_diem');
      expect(EXPECTED_COLUMNS).toContain('is_union');
      expect(EXPECTED_COLUMNS).toContain('trades');
      expect(EXPECTED_COLUMNS).toContain('regions');
    });

    it('has exactly 13 columns', () => {
      expect(EXPECTED_COLUMNS).toHaveLength(13);
    });
  });
});
