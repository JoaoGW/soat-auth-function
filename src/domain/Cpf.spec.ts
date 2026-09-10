import { Cpf } from './Cpf';

describe('Cpf', () => {
  it.each(['52998224725', '529.982.247-25'])('aceita CPF válido: %s', (cpf) => {
    expect(Cpf.criar(cpf)?.valor).toBe('52998224725');
  });

  it.each(['52998224724', '11111111111', '529.982.247-2A', 52998224725, null])(
    'rejeita CPF inválido: %s',
    (cpf) => {
      expect(Cpf.criar(cpf)).toBeNull();
    },
  );
});
