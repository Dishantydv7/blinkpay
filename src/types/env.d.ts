declare namespace NodeJS {
  interface ProcessEnv {
    SOLANA_RPC_HOST: string;
    NEXT_PUBLIC_SITE_URL: string;
    KV_REST_API_URL: string;
    KV_REST_API_TOKEN: string;
    KV_REST_API_READ_ONLY_TOKEN: string;
  }
}
