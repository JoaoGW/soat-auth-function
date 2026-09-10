import { Pool } from "pg";

import { PostgresClienteAuthRepository } from "./PostgresClienteAuthRepository";

describe("PostgresClienteAuthRepository", () => {
  it("consulta somente o documento normalizado com parâmetro SQL", async () => {
    const query = jest
      .fn()
      .mockResolvedValue({ rows: [{ id: "cliente-1", ativo: true }] });
    const repository = new PostgresClienteAuthRepository({
      query,
    } as unknown as Pick<Pool, "query">);

    await expect(repository.buscarPorCpf("52998224725")).resolves.toEqual({
      id: "cliente-1",
      ativo: true,
    });
    expect(query).toHaveBeenCalledWith(
      'SELECT "id", "ativo" FROM "Cliente" WHERE "documento" = $1 LIMIT 1',
      ["52998224725"],
    );
  });
});
