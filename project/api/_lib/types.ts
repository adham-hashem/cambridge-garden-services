export type ApiRequest = {
  method?: string;
  body?: unknown;
  query: Record<string, string | string[] | undefined>;
  headers: Record<string, string | string[] | undefined>;
};

export type ApiResponse = {
  setHeader(name: string, value: string | string[]): void;
  status(code: number): ApiResponse;
  json(body: unknown): void;
  end(body?: string): void;
};
