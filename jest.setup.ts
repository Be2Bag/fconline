// jest.setup.ts
// Add any global test setup here

// Mock console.error and console.warn to keep test output clean
// Uncomment if needed:
// const originalError = console.error;
// beforeAll(() => {
//     console.error = (...args) => {
//         if (typeof args[0] === 'string' && args[0].includes('Warning:')) {
//             return;
//         }
//         originalError.call(console, ...args);
//     };
// });
// afterAll(() => {
//     console.error = originalError;
// });
