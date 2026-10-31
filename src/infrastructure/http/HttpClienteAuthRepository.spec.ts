import { HttpClienteAuthRepository } from "./HttpClienteAuthRepository";

describe("HttpClienteAuthRepository", () => {
  const token = "token-interno";
  it("envia CPF ao OS e retorna apenas o cliente", async () => {
    const fetcher = jest.fn().mockResolvedValue(new Response(JSON.stringify({ cliente: { id: "1", ativo: true } }), { status: 200 }));
    const repo = new HttpClienteAuthRepository("https://os.example", token, fetcher);
    await expect(repo.buscarPorCpf("52998224725")).resolves.toEqual({ id: "1", ativo: true });
    expect(fetcher).toHaveBeenCalledWith("https://os.example/internal/clientes/validar-cpf", expect.objectContaining({ method: "POST", redirect: "error", body: JSON.stringify({ cpf: "52998224725" }) }));
  });
  it("preserva ausência e inatividade", async () => {
    const fetcher = jest.fn().mockResolvedValueOnce(new Response(JSON.stringify({ cliente: null }))).mockResolvedValueOnce(new Response(JSON.stringify({ cliente: { id: "1", ativo: false } })));
    const repo = new HttpClienteAuthRepository("https://os.example", token, fetcher);
    await expect(repo.buscarPorCpf("52998224725")).resolves.toBeNull();
    await expect(repo.buscarPorCpf("52998224725")).resolves.toEqual({ id: "1", ativo: false });
  });
  it.each([new Response("erro", { status: 503 }), new Response(JSON.stringify({ cliente: { id: 123, ativo: true } }))])("falha fechada para HTTP ou resposta inválida", async (response) => {
    const repo = new HttpClienteAuthRepository("https://os.example", token, jest.fn().mockResolvedValue(response));
    await expect(repo.buscarPorCpf("52998224725")).rejects.toThrow();
  });
  it("propaga falhas de rede sem retornar cliente", async () => {
    const repo = new HttpClienteAuthRepository("https://os.example", token, jest.fn().mockRejectedValue(new Error("timeout")));
    await expect(repo.buscarPorCpf("52998224725")).rejects.toThrow("timeout");
  });
});
