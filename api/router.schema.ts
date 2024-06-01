import z from 'zod';

export default {
    input: z.tuple([
        z.string().describe('router name'),
    ]),
    output: z.void()
} as const;
