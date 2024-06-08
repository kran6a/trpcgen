import {router} from "#trpc";
import endpoint from "./api/endpoint.ts";
import  _router from "./api/router.ts";
import service from "./api/service.ts";
import api from "./api/api.ts";

export default router({
    endpoint,
    router: _router,
    service,
    api
});