import {TRPCError} from "@trpc/server";
import task from "tasuku";

export const Context = {
    project: {
        root_dir: '/mnt/c/Users/Ángel/IdeaProjects/bar-back/packages/bar'
    },
    abort(error: TRPCError){
        console.error(JSON.stringify({code: error.code, message: error.message}));
        process.exit(error.code);
    },
    task
};
export type Context = typeof Context;