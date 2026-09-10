describe('auth function scaffold', () => {
  it('identifica a aplicação da Function', async () => {
    process.env.DATABASE_URL =
      'postgresql://user:password@server.postgres.database.azure.com:5432/oficina?sslmode=require';
    process.env.JWT_CLIENT_SECRET = 'segredo-com-mais-de-trinta-e-dois-bytes';

    const { functionAppName } = await import('./index');

    expect(functionAppName).toBe('soat-auth-function');
  });
});
