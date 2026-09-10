export class Cpf {
  private constructor(readonly valor: string) {}

  static criar(valor: unknown): Cpf | null {
    if (typeof valor !== 'string') return null;

    const informado = valor.trim();
    const formatoAceito =
      /^\d{11}$/.test(informado) ||
      /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(informado);

    if (!formatoAceito) return null;

    const cpf = informado.replace(/\D/g, '');
    if (/^(\d)\1{10}$/.test(cpf)) return null;

    if (!Cpf.digitoConfere(cpf, 9) || !Cpf.digitoConfere(cpf, 10)) {
      return null;
    }

    return new Cpf(cpf);
  }

  private static digitoConfere(cpf: string, quantidade: number): boolean {
    const soma = Array.from({ length: quantidade }, (_, indice) => indice).reduce<number>(
      (total, indice) => total + Number(cpf[indice]) * (quantidade + 1 - indice),
      0,
    );
    const resto = (soma * 10) % 11;
    const digito = resto === 10 ? 0 : resto;

    return digito === Number(cpf[quantidade]);
  }
}
