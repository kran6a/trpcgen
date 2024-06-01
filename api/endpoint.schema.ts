import z from 'zod';

export default {
    input: z.tuple([
        z.string().describe('router name'),
        z.enum(['query', 'mutation', 'subscription'], {invalid_type_error: 'Procedure type must be "query", "mutation" or "subscription"'}).describe('Procedure type'),
        z.string().describe('procedure name')
    ]),
    output: z.void()
} as const;
