var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-iCUpxm/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// functions/_worker.js
var AffiliateCounter = class {
  static {
    __name(this, "AffiliateCounter");
  }
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname || "";
    try {
      if (request.method === "POST" && path.endsWith("/click")) {
        return await this._handleClick(request);
      }
      if (request.method === "POST" && path.endsWith("/clear")) {
        return await this._handleClear();
      }
      if (request.method === "GET" && path.endsWith("/stats")) {
        return await this._handleStats();
      }
      return new Response(JSON.stringify({ error: "not_found" }), { status: 404, headers: { "Content-Type": "application/json" } });
    } catch (err) {
      return new Response(JSON.stringify({ error: "do_error", detail: String(err) }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
  }
  async _handleClick(request) {
    const body = await request.json().catch(() => ({}));
    const barcode = body.barcode || "unknown";
    const offerItemId = body.offerItemId || null;
    const affiliateUrl = (body.affiliateUrl || "").toString().slice(0, 256);
    const ip = body.ip || "unknown";
    const ua = (body.userAgent || "").toString().slice(0, 200);
    const ts = body.timestamp || (/* @__PURE__ */ new Date()).toISOString();
    const countKey = "count";
    const clicksKey = "clicks";
    const currentCount = await this.state.storage.get(countKey) || 0;
    const clicks = await this.state.storage.get(clicksKey) || [];
    const newClick = { ts, barcode, offerItemId, affiliateUrl, ip, ua };
    const updatedClicks = [newClick, ...clicks].slice(0, 200);
    await this.state.storage.put(countKey, currentCount + 1);
    await this.state.storage.put(clicksKey, updatedClicks);
    return new Response(JSON.stringify({ ok: true, newCount: currentCount + 1 }), { headers: { "Content-Type": "application/json" } });
  }
  async _handleStats() {
    const count = await this.state.storage.get("count") || 0;
    const clicks = await this.state.storage.get("clicks") || [];
    return new Response(JSON.stringify({ count, lastClicks: clicks.slice(0, 10) }), { headers: { "Content-Type": "application/json" } });
  }
  async _handleClear() {
    await this.state.storage.delete("count");
    await this.state.storage.delete("clicks");
    return new Response(JSON.stringify({ ok: true, cleared: true }), { headers: { "Content-Type": "application/json" } });
  }
};
var worker_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization"
        }
      });
    }
    if (path === "/api/affiliate/click" && request.method === "POST") {
      try {
        const body = await request.json();
        const { barcode, offerItemId, affiliateUrl, timestamp } = body;
        if (!barcode || !offerItemId || !affiliateUrl) {
          return new Response(JSON.stringify({ error: "Missing required fields" }), {
            status: 400,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
          });
        }
        const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "unknown";
        const userAgent = request.headers.get("user-agent") || "unknown";
        try {
          const id = env.AFFILIATE_DO.idFromName(barcode);
          const stub = env.AFFILIATE_DO.get(id);
          const doResponse = await stub.fetch("https://do/click", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ barcode, offerItemId, affiliateUrl, timestamp, ip, userAgent })
          });
          if (doResponse.ok) {
            const result = await doResponse.json();
            return new Response(JSON.stringify({ ok: true, newCount: result.newCount }), {
              headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
            });
          }
        } catch (doError) {
          console.warn("DO unavailable, using KV fallback:", doError);
        }
        const clickData = {
          barcode,
          offerItemId,
          affiliateUrl: affiliateUrl.substring(0, 256),
          timestamp: timestamp || (/* @__PURE__ */ new Date()).toISOString(),
          ip,
          userAgent: userAgent.substring(0, 100)
        };
        const clickKey = `AFFILIATE:CLICKS:${barcode}:${Date.now()}`;
        await env.AFFILIATE_KV.put(clickKey, JSON.stringify(clickData));
        const countKey = `AFFILIATE:COUNT:${barcode}`;
        const currentCount = await env.AFFILIATE_KV.get(countKey);
        const newCount = (parseInt(currentCount || "0") + 1).toString();
        await env.AFFILIATE_KV.put(countKey, newCount);
        return new Response(JSON.stringify({ ok: true, newCount: parseInt(newCount), fallback: true }), {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      } catch (error) {
        console.error("Affiliate click tracking error:", error);
        return new Response(JSON.stringify({ error: "Failed to track click" }), {
          status: 500,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }
    }
    const statsMatch = path.match(/^\/api\/admin\/products\/([^/]+)\/stats$/);
    if (statsMatch && request.method === "GET") {
      const barcode = statsMatch[1];
      const authHeader = request.headers.get("Authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ error: "Missing authorization" }), {
          status: 401,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }
      const token = authHeader.substring(7);
      const adminPassword = env.ADMIN_PASSWORD || "admin123";
      if (token !== adminPassword) {
        return new Response(JSON.stringify({ error: "Invalid authorization" }), {
          status: 403,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }
      try {
        const id = env.AFFILIATE_DO.idFromName(barcode);
        const stub = env.AFFILIATE_DO.get(id);
        const doResponse = await stub.fetch("https://do/stats", {
          method: "GET"
        });
        if (doResponse.ok) {
          const stats = await doResponse.json();
          return new Response(JSON.stringify(stats), {
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
          });
        }
      } catch (doError) {
        console.warn("DO unavailable, using KV fallback:", doError);
      }
      const countKey = `AFFILIATE:COUNT:${barcode}`;
      const count = parseInt(await env.AFFILIATE_KV.get(countKey) || "0");
      const clicksList = await env.AFFILIATE_KV.list({ prefix: `AFFILIATE:CLICKS:${barcode}:` });
      const recentClicks = [];
      for (const key of clicksList.keys.slice(0, 5)) {
        const clickData = await env.AFFILIATE_KV.get(key.name);
        if (clickData) {
          recentClicks.push(JSON.parse(clickData));
        }
      }
      return new Response(JSON.stringify({
        count,
        lastClicks: recentClicks,
        fallback: true
      }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
    const clearMatch = path.match(/^\/api\/admin\/products\/([^/]+)\/clear$/);
    if (clearMatch && request.method === "POST") {
      const barcode = clearMatch[1];
      const authHeader = request.headers.get("Authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ error: "Missing authorization" }), {
          status: 401,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }
      const token = authHeader.substring(7);
      const adminPassword = env.ADMIN_PASSWORD || "admin123";
      if (token !== adminPassword) {
        return new Response(JSON.stringify({ error: "Invalid authorization" }), {
          status: 403,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }
      try {
        const id = env.AFFILIATE_DO.idFromName(barcode);
        const stub = env.AFFILIATE_DO.get(id);
        const doResponse = await stub.fetch("https://do/clear", {
          method: "POST"
        });
        if (doResponse.ok) {
          return new Response(JSON.stringify({ ok: true, cleared: true }), {
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
          });
        }
      } catch (doError) {
        console.warn("DO unavailable:", doError);
      }
      return new Response(JSON.stringify({ ok: true, cleared: true }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
    if (path === "/api/dev/kv-clear" && request.method === "POST") {
      const authHeader = request.headers.get("Authorization");
      const adminPassword = env.ADMIN_PASSWORD || "admin123";
      const expected = `Bearer ${adminPassword}`;
      if (authHeader !== expected) {
        return new Response(JSON.stringify({ error: "unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }
      const body = await request.json().catch(() => ({}));
      const barcode = body.barcode;
      if (!barcode) {
        return new Response(JSON.stringify({ error: "missing barcode" }), {
          status: 400,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }
      const countKey = `AFFILIATE:COUNT:${barcode}`;
      await env.AFFILIATE_KV.delete(countKey);
      const clicksList = await env.AFFILIATE_KV.list({ prefix: `AFFILIATE:CLICKS:${barcode}:` });
      const deletePromises = clicksList.keys.map((key) => env.AFFILIATE_KV.delete(key.name));
      await Promise.all(deletePromises);
      return new Response(JSON.stringify({ ok: true, deleted: countKey, clicksDeleted: clicksList.keys.length }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
    return env.ASSETS.fetch(request);
  }
};

// ../../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-iCUpxm/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = worker_default;

// ../../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-iCUpxm/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  AffiliateCounter,
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=_worker.js.map
