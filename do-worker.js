// Durable Object host worker for local dev (module worker)
export default {};
import { AffiliateCounter as BaseAffiliateCounter } from './src/durable_objects/AffiliateCounter.js';

// Export a Durable Object class that delegates to the existing implementation
export class AffiliateCounter {
  constructor(state, env) {
    this.impl = new BaseAffiliateCounter(state, env);
  }

  async fetch(request) {
    return this.impl.fetch(request);
  }
}
