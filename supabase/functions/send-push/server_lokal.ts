export function serve(handler: (req: Request) => Promise<Response>) { Deno.serve(handler); }
