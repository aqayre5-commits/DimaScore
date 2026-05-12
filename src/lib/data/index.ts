import type { DataProvider } from './provider';
import { ApiFootballAdapter } from './adapters/api-football/adapter';

let instance: DataProvider | null = null;

export function getDataProvider(): DataProvider {
  if (!instance) {
    instance = new ApiFootballAdapter();
  }
  return instance;
}
