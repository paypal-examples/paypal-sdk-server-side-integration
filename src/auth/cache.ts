import pino from "pino";

const logger = pino();

type InternalStoreValue = {
  [key: string]: unknown;
  timeToLiveInMilliseconds: number;
  createdAtInMilliseconds: number;
};

type ExternalStoreValue = Record<string, unknown>;

export default class Cache {
  store: Map<string, InternalStoreValue>;

  constructor() {
    this.store = new Map<string, InternalStoreValue>();
  }

  get(credentials: string): ExternalStoreValue | undefined {
    if (this.store.has(credentials) === false) {
      logger.debug("key not found in cache");
      return;
    }

    const {
      timeToLiveInMilliseconds,
      createdAtInMilliseconds,
      ...originalValue
    } = this.store.get(credentials) as InternalStoreValue;

    if (timeToLiveInMilliseconds > Date.now() - createdAtInMilliseconds) {
      logger.debug("key found in cache");
      return originalValue;
    } else {
      logger.debug("key is expired");
      this.store.delete(credentials);
    }
  }

  set(
    credentials: string,
    value: ExternalStoreValue,
    timeToLiveInMilliseconds: number
  ) {
    this.store.set(credentials, {
      ...value,
      timeToLiveInMilliseconds,
      createdAtInMilliseconds: Date.now(),
    });
  }
}
