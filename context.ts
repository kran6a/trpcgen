import {TRPCError} from "@trpc/server";

export const Context = {
    project: {
        root_dir: '/mnt/c/Users/Ángel/IdeaProjects/bar-back/packages/bar'
    },
    abort(error: TRPCError){
        console.error(JSON.stringify({code: error.code, message: error.message}));
        process.exit(error.code);
    }
};
export type Context = typeof Context;