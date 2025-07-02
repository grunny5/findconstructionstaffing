// Type definitions to fix TypeScript errors in supabase-mock.ts

export type AnyMockSupabase = {
  [key: string]: any;
  _error?: Error | null;
  _throwError?: boolean;
  _isCountQuery?: boolean;
  _defaultData?: any;
  _defaultCount?: number;
  _lastMethod?: string;
  _lastArgs?: any[];
};

export type MockChainMethod = jest.Mock<any, any>;

export function castMockSupabase(mockSupabase: any): AnyMockSupabase {
  return mockSupabase as AnyMockSupabase;
}