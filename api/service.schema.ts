import z from 'zod';

export default {
    input: z.tuple([
        z.string().describe('service name'),
        z.object({
            impl_only: z
                .boolean()
                .optional()
                .default(false)
                .describe("Generate only an implementation file"),
        }),
    ]),
    output: z.void()
} as const;
