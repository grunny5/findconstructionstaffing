// Test file to verify TypeScript compilation in CI
// This file is intentionally placed here for CI testing purposes

interface TestInterface {
  name: string;
  value: number;
}

const testFunction = (data: TestInterface): string => {
  return `${data.name}: ${data.value}`;
};

// Test strict mode
const strictModeTest: TestInterface = {
  name: 'test',
  value: 42,
};

console.log(testFunction(strictModeTest));

export { testFunction, TestInterface };