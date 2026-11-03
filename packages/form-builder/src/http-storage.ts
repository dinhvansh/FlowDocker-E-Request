import {
  isFormDefinition,
  type FormDefinition,
  type BilingualText,
} from "./schema";

export interface StoredForm {
  id: string;
  definition: FormDefinition;
  version: number;
}
export interface FormSummary {
  id: string;
  title: BilingualText;
  version: number;
}
export class FormStorageError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
  ) {
    super(code);
    this.name = "FormStorageError";
  }
}
/** Host supplies a trusted endpoint and current session. Never stores credentials. */
export function createHttpFormRepository(options: {
  baseUrl: string;
  appId: string;
  getAccessToken: () => string | null | Promise<string | null>;
  fetch?: typeof fetch;
}) {
  const appId = options.appId;
  const base = options.baseUrl.replace(/\/$/, "");
  const send = options.fetch ?? globalThis.fetch;
  if (!/^[a-z][a-z0-9.-]{0,79}$/.test(appId))
    throw new Error("Invalid application ID");
  const root = `${base}/api/v1/apps/${encodeURIComponent(appId)}/forms`;
  const idPath = (id: string) => {
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        id,
      )
    )
      throw new FormStorageError("INVALID_ID", 400);
    return `/${id}`;
  };
  async function request(
    path: string,
    method: string,
    body?: unknown,
  ): Promise<unknown> {
    const token = await options.getAccessToken();
    if (!token) throw new FormStorageError("UNAUTHENTICATED", 401);
    let response: Response;
    try {
      response = await send(root + path, {
        method,
        credentials: "omit",
        cache: "no-store",
        redirect: "error",
        headers: {
          authorization: `Bearer ${token}`,
          ...(body ? { "content-type": "application/json" } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
    } catch {
      throw new FormStorageError("CONNECTION_FAILED", 0);
    }
    let data: unknown;
    try {
      data = await response.json();
    } catch {
      throw new FormStorageError("INVALID_RESPONSE", response.status);
    }
    if (!response.ok) {
      const code = (data as { error?: { code?: unknown } })?.error?.code;
      throw new FormStorageError(
        typeof code === "string" && /^[A-Z_]{1,80}$/.test(code)
          ? code
          : "REQUEST_FAILED",
        response.status,
      );
    }
    return data;
  }
  function versioned(data: unknown): { id: string; version: number } {
    const row = data as { id?: unknown; version?: unknown };
    if (
      !row ||
      typeof row.id !== "string" ||
      !Number.isSafeInteger(row.version) ||
      (row.version as number) < 1
    )
      throw new FormStorageError("INVALID_RESPONSE", 502);
    return { id: row.id, version: row.version as number };
  }
  return {
    async list(
      after?: string,
    ): Promise<{ items: FormSummary[]; nextCursor: string | null }> {
      if (after) idPath(after);
      const data = (await request(
        after ? `?after=${encodeURIComponent(after)}` : "",
        "GET",
      )) as { items?: unknown; nextCursor?: unknown };
      if (
        !data ||
        !Array.isArray(data.items) ||
        data.items.length > 50 ||
        (data.nextCursor !== null && typeof data.nextCursor !== "string")
      )
        throw new FormStorageError("INVALID_RESPONSE", 502);
      const items = data.items.map((value) => {
        const row = value as { title?: BilingualText };
        if (
          !row?.title ||
          typeof row.title.vi !== "string" ||
          typeof row.title.en !== "string"
        )
          throw new FormStorageError("INVALID_RESPONSE", 502);
        return { ...versioned(row), title: row.title };
      });
      return { items, nextCursor: data.nextCursor as string | null };
    },
    async read(id: string): Promise<StoredForm> {
      const data = (await request(idPath(id), "GET")) as {
        definition?: unknown;
      };
      if (!isFormDefinition(data?.definition))
        throw new FormStorageError("INVALID_RESPONSE", 502);
      return { ...versioned(data), definition: data.definition };
    },
    async save(input: StoredForm): Promise<{ id: string; version: number }> {
      if (
        !Number.isSafeInteger(input.version) ||
        input.version < 0 ||
        !isFormDefinition(input.definition)
      )
        throw new FormStorageError("INVALID_FORM_OR_VERSION", 400);
      return versioned(
        await request(idPath(input.id), input.version === 0 ? "POST" : "PUT", {
          definition: input.definition,
          expectedVersion: input.version,
        }),
      );
    },
    async remove(id: string, expectedVersion: number): Promise<void> {
      if (!Number.isSafeInteger(expectedVersion) || expectedVersion < 1)
        throw new FormStorageError("INVALID_VERSION", 400);
      await request(idPath(id), "DELETE", { expectedVersion });
    },
  };
}
