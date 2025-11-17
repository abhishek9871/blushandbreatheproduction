import { onRequestPost as __admin_products__barcode__clear_ts_onRequestPost } from "C:\\Users\\VASU\\Desktop\\blushandbreatheproduction\\functions\\admin\\products\\[barcode]\\clear.ts"
import { onRequestGet as __admin_products__barcode__clicks_ts_onRequestGet } from "C:\\Users\\VASU\\Desktop\\blushandbreatheproduction\\functions\\admin\\products\\[barcode]\\clicks.ts"
import { onRequestGet as __admin_products__barcode__edit_ts_onRequestGet } from "C:\\Users\\VASU\\Desktop\\blushandbreatheproduction\\functions\\admin\\products\\[barcode]\\edit.ts"
import { onRequestGet as __admin_products__barcode__override_ts_onRequestGet } from "C:\\Users\\VASU\\Desktop\\blushandbreatheproduction\\functions\\admin\\products\\[barcode]\\override.ts"
import { onRequestPost as __admin_products__barcode__override_ts_onRequestPost } from "C:\\Users\\VASU\\Desktop\\blushandbreatheproduction\\functions\\admin\\products\\[barcode]\\override.ts"
import { onRequestGet as __admin_products__barcode__stats_ts_onRequestGet } from "C:\\Users\\VASU\\Desktop\\blushandbreatheproduction\\functions\\admin\\products\\[barcode]\\stats.ts"
import { onRequestGet as __api_products__barcode__merged_ts_onRequestGet } from "C:\\Users\\VASU\\Desktop\\blushandbreatheproduction\\functions\\api\\products\\[barcode]\\merged.ts"
import { onRequestPost as __api_products__barcode__suggestions_ts_onRequestPost } from "C:\\Users\\VASU\\Desktop\\blushandbreatheproduction\\functions\\api\\products\\[barcode]\\suggestions.ts"
import { onRequestPost as __api_affiliate_click_ts_onRequestPost } from "C:\\Users\\VASU\\Desktop\\blushandbreatheproduction\\functions\\api\\affiliate\\click.ts"
import { onRequestPost as __dev_kv_clear_ts_onRequestPost } from "C:\\Users\\VASU\\Desktop\\blushandbreatheproduction\\functions\\dev\\kv-clear.ts"
import { onRequest as __api_newsapi_ts_onRequest } from "C:\\Users\\VASU\\Desktop\\blushandbreatheproduction\\functions\\api\\newsapi.ts"
import { onRequest as __api_ninjas_ts_onRequest } from "C:\\Users\\VASU\\Desktop\\blushandbreatheproduction\\functions\\api\\ninjas.ts"
import { onRequest as ___middleware_ts_onRequest } from "C:\\Users\\VASU\\Desktop\\blushandbreatheproduction\\functions\\_middleware.ts"

export const routes = [
    {
      routePath: "/admin/products/:barcode/clear",
      mountPath: "/admin/products/:barcode",
      method: "POST",
      middlewares: [],
      modules: [__admin_products__barcode__clear_ts_onRequestPost],
    },
  {
      routePath: "/admin/products/:barcode/clicks",
      mountPath: "/admin/products/:barcode",
      method: "GET",
      middlewares: [],
      modules: [__admin_products__barcode__clicks_ts_onRequestGet],
    },
  {
      routePath: "/admin/products/:barcode/edit",
      mountPath: "/admin/products/:barcode",
      method: "GET",
      middlewares: [],
      modules: [__admin_products__barcode__edit_ts_onRequestGet],
    },
  {
      routePath: "/admin/products/:barcode/override",
      mountPath: "/admin/products/:barcode",
      method: "GET",
      middlewares: [],
      modules: [__admin_products__barcode__override_ts_onRequestGet],
    },
  {
      routePath: "/admin/products/:barcode/override",
      mountPath: "/admin/products/:barcode",
      method: "POST",
      middlewares: [],
      modules: [__admin_products__barcode__override_ts_onRequestPost],
    },
  {
      routePath: "/admin/products/:barcode/stats",
      mountPath: "/admin/products/:barcode",
      method: "GET",
      middlewares: [],
      modules: [__admin_products__barcode__stats_ts_onRequestGet],
    },
  {
      routePath: "/api/products/:barcode/merged",
      mountPath: "/api/products/:barcode",
      method: "GET",
      middlewares: [],
      modules: [__api_products__barcode__merged_ts_onRequestGet],
    },
  {
      routePath: "/api/products/:barcode/suggestions",
      mountPath: "/api/products/:barcode",
      method: "POST",
      middlewares: [],
      modules: [__api_products__barcode__suggestions_ts_onRequestPost],
    },
  {
      routePath: "/api/affiliate/click",
      mountPath: "/api/affiliate",
      method: "POST",
      middlewares: [],
      modules: [__api_affiliate_click_ts_onRequestPost],
    },
  {
      routePath: "/dev/kv-clear",
      mountPath: "/dev",
      method: "POST",
      middlewares: [],
      modules: [__dev_kv_clear_ts_onRequestPost],
    },
  {
      routePath: "/api/newsapi",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_newsapi_ts_onRequest],
    },
  {
      routePath: "/api/ninjas",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_ninjas_ts_onRequest],
    },
  {
      routePath: "/",
      mountPath: "/",
      method: "",
      middlewares: [___middleware_ts_onRequest],
      modules: [],
    },
  ]