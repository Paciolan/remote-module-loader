export interface Fetcher {
  (url: string): Promise<string>;
}
