/**
 * CSV/XLSX Parser for Bulk Agency Import
 *
 * Parses uploaded CSV and XLSX files into normalized agency objects.
 * Handles field normalization, boolean conversion, and array parsing.
 */

import Papa from 'papaparse';
import * as XLSX from 'xlsx';

/**
 * Expected column headers from the import template
 */
export const EXPECTED_COLUMNS = [
  'name',
  'description',
  'website',
  'phone',
  'email',
  'headquarters',
  'founded_year',
  'employee_count',
  'company_size',
  'offers_per_diem',
  'is_union',
  'trades',
  'regions',
] as const;

export type ExpectedColumn = (typeof EXPECTED_COLUMNS)[number];

/**
 * Parsed agency row with normalized field types
 */
export interface ParsedAgencyRow {
  name?: string;
  description?: string;
  website?: string;
  phone?: string;
  email?: string;
  headquarters?: string;
  founded_year?: string;
  employee_count?: string;
  company_size?: string;
  offers_per_diem?: boolean;
  is_union?: boolean;
  trades?: string[];
  regions?: string[];
  _rowNumber: number;
}

/**
 * Result of parsing a file
 */
export interface ParseResult {
  success: boolean;
  data: ParsedAgencyRow[];
  errors: ParseError[];
  warnings: string[];
}

/**
 * Error during parsing
 */
export interface ParseError {
  row?: number;
  message: string;
  type: 'header' | 'row' | 'file';
}

/**
 * Normalizes a header string to match expected column names
 * Handles case variations and extra whitespace
 */
function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, '_');
}

/**
 * Converts various boolean-like strings to actual booleans
 * Handles: yes/no, true/false, 1/0, y/n
 */
function normalizeBoolean(
  value: string | undefined | null
): boolean | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();

  const trueValues = ['true', 'yes', 'y', '1'];
  const falseValues = ['false', 'no', 'n', '0'];

  if (trueValues.includes(normalized)) {
    return true;
  }
  if (falseValues.includes(normalized)) {
    return false;
  }

  return undefined;
}

/**
 * Parses a comma-separated string into an array of trimmed values
 * Handles extra whitespace and empty values
 */
function parseCommaSeparated(
  value: string | undefined | null
): string[] | undefined {
  if (value === undefined || value === null || value.trim() === '') {
    return undefined;
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

/**
 * Cleans and normalizes a string value
 * Returns undefined for empty strings
 */
function normalizeString(value: string | undefined | null): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Converts a raw row object to a ParsedAgencyRow with proper types
 */
function normalizeRow(
  rawRow: Record<string, string>,
  rowNumber: number
): ParsedAgencyRow {
  const normalized: ParsedAgencyRow = {
    _rowNumber: rowNumber,
  };

  // Map raw values to normalized structure
  const headerMap: Record<string, ExpectedColumn> = {};
  for (const key of Object.keys(rawRow)) {
    const normalizedKey = normalizeHeader(key);
    if (EXPECTED_COLUMNS.includes(normalizedKey as ExpectedColumn)) {
      headerMap[key] = normalizedKey as ExpectedColumn;
    }
  }

  for (const [rawKey, column] of Object.entries(headerMap)) {
    const value = rawRow[rawKey];

    switch (column) {
      case 'name':
      case 'description':
      case 'website':
      case 'phone':
      case 'email':
      case 'headquarters':
      case 'founded_year':
      case 'employee_count':
      case 'company_size':
        normalized[column] = normalizeString(value);
        break;

      case 'offers_per_diem':
      case 'is_union':
        normalized[column] = normalizeBoolean(value);
        break;

      case 'trades':
      case 'regions':
        normalized[column] = parseCommaSeparated(value);
        break;
    }
  }

  return normalized;
}

/**
 * Validates that required headers are present
 */
function validateHeaders(headers: string[]): {
  valid: boolean;
  errors: ParseError[];
  warnings: string[];
} {
  const errors: ParseError[] = [];
  const warnings: string[] = [];

  const normalizedHeaders = headers.map(normalizeHeader);

  // Check for 'name' column (required)
  if (!normalizedHeaders.includes('name')) {
    errors.push({
      type: 'header',
      message: 'Missing required column: name',
    });
  }

  // Warn about unrecognized columns
  const unrecognized = headers.filter(
    (h) => !EXPECTED_COLUMNS.includes(normalizeHeader(h) as ExpectedColumn)
  );
  if (unrecognized.length > 0) {
    warnings.push(
      `Unrecognized columns will be ignored: ${unrecognized.join(', ')}`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Checks if a row is empty (all values are blank)
 */
function isEmptyRow(row: Record<string, string>): boolean {
  return Object.values(row).every(
    (value) => value === undefined || value === null || value.trim() === ''
  );
}

/**
 * Parses a CSV file and returns normalized agency data
 */
export function parseCSV(content: string): ParseResult {
  const errors: ParseError[] = [];
  const warnings: string[] = [];
  const data: ParsedAgencyRow[] = [];

  try {
    const result = Papa.parse<Record<string, string>>(content, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (header) => header.trim(),
    });

    // Handle papaparse errors
    // Some "errors" from papaparse are recoverable and treated as warnings
    const recoverableCodes = [
      'UndetectableDelimiter',
      'TooManyFields',
      'TooFewFields',
    ];
    if (result.errors.length > 0) {
      for (const error of result.errors) {
        if (recoverableCodes.includes(error.code)) {
          // These are recoverable - papaparse still parses the data
          warnings.push(
            error.row !== undefined
              ? `Row ${error.row + 2}: ${error.message}`
              : error.message
          );
        } else {
          errors.push({
            type: 'row',
            row: error.row !== undefined ? error.row + 2 : undefined, // +2 for 1-based + header row
            message: error.message,
          });
        }
      }
    }

    // Validate headers
    const headers = result.meta.fields || [];
    const headerValidation = validateHeaders(headers);
    errors.push(...headerValidation.errors);
    warnings.push(...headerValidation.warnings);

    if (!headerValidation.valid) {
      return { success: false, data: [], errors, warnings };
    }

    // Process rows
    let rowNumber = 2; // Start at 2 (row 1 is header)
    for (const rawRow of result.data) {
      // Skip empty rows
      if (isEmptyRow(rawRow)) {
        rowNumber++;
        continue;
      }

      const normalized = normalizeRow(rawRow, rowNumber);

      // Validate required field: name
      if (!normalized.name || normalized.name.trim() === '') {
        errors.push({
          type: 'row',
          row: rowNumber,
          message: 'Missing required field: name',
        });
        rowNumber++;
        continue;
      }

      data.push(normalized);
      rowNumber++;
    }

    return {
      success: errors.length === 0,
      data,
      errors,
      warnings,
    };
  } catch (error) {
    errors.push({
      type: 'file',
      message:
        error instanceof Error ? error.message : 'Failed to parse CSV file',
    });
    return { success: false, data: [], errors, warnings };
  }
}

/**
 * Parses an XLSX file and returns normalized agency data
 * Only parses the first sheet
 */
export function parseXLSX(buffer: ArrayBuffer): ParseResult {
  const errors: ParseError[] = [];
  const warnings: string[] = [];
  const data: ParsedAgencyRow[] = [];

  try {
    const workbook = XLSX.read(buffer, { type: 'array' });

    // Get first sheet
    const sheetNames = workbook.SheetNames;
    if (sheetNames.length === 0) {
      errors.push({
        type: 'file',
        message: 'Excel file contains no sheets',
      });
      return { success: false, data: [], errors, warnings };
    }

    if (sheetNames.length > 1) {
      warnings.push(
        `Excel file contains ${sheetNames.length} sheets. Only the first sheet "${sheetNames[0]}" will be processed.`
      );
    }

    const sheet = workbook.Sheets[sheetNames[0]];

    // Convert to JSON with headers
    // When header: 1 is used, sheet_to_json returns unknown[][]
    const jsonData = XLSX.utils.sheet_to_json(sheet, {
      header: 1, // Use array format first to get headers
      defval: '',
    }) as unknown[][];

    if (jsonData.length === 0) {
      errors.push({
        type: 'file',
        message: 'Sheet is empty',
      });
      return { success: false, data: [], errors, warnings };
    }

    // Extract headers from first row
    const headers = (jsonData[0] as unknown[]).map((h) =>
      String(h || '').trim()
    );

    // Validate headers
    const headerValidation = validateHeaders(headers);
    errors.push(...headerValidation.errors);
    warnings.push(...headerValidation.warnings);

    if (!headerValidation.valid) {
      return { success: false, data: [], errors, warnings };
    }

    // Process data rows (skip header row)
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i] as unknown[];
      const rowNumber = i + 1; // 1-based row number

      // Convert array row to object with headers
      const rawRow: Record<string, string> = {};
      for (let j = 0; j < headers.length; j++) {
        const value = row[j];
        rawRow[headers[j]] =
          value !== undefined && value !== null ? String(value) : '';
      }

      // Skip empty rows
      if (isEmptyRow(rawRow)) {
        continue;
      }

      const normalized = normalizeRow(rawRow, rowNumber);

      // Validate required field: name
      if (!normalized.name || normalized.name.trim() === '') {
        errors.push({
          type: 'row',
          row: rowNumber,
          message: 'Missing required field: name',
        });
        continue;
      }

      data.push(normalized);
    }

    return {
      success: errors.length === 0,
      data,
      errors,
      warnings,
    };
  } catch (error) {
    errors.push({
      type: 'file',
      message:
        error instanceof Error ? error.message : 'Failed to parse Excel file',
    });
    return { success: false, data: [], errors, warnings };
  }
}

/**
 * Parses a file (CSV or XLSX) based on its type
 * For CSV: pass the text content
 * For XLSX: pass the ArrayBuffer
 */
export async function parseFile(file: File): Promise<ParseResult> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'csv') {
    const content = await file.text();
    return parseCSV(content);
  }

  if (extension === 'xlsx' || extension === 'xls') {
    const buffer = await file.arrayBuffer();
    return parseXLSX(buffer);
  }

  return {
    success: false,
    data: [],
    errors: [
      {
        type: 'file',
        message: `Unsupported file type: .${extension}. Please upload a .csv or .xlsx file.`,
      },
    ],
    warnings: [],
  };
}
