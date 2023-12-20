declare global {
    export type Router = {
        [key: string]: 'query' | 'mutation' | 'subscription' | Router
    }
}

export {};