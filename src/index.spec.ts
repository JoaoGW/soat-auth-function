import { functionAppName } from './index';

describe('auth function scaffold', () => {
  it('identifica a aplicação da Function', () => {
    expect(functionAppName).toBe('soat-auth-function');
  });
});

