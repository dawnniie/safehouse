import type { IncomingMessage, ServerResponse } from 'http'

type Promisable<T> = T | Promise<T>

export type Request = IncomingMessage
export type Response = ServerResponse
export type ResponseData = { status: number, json?: unknown }

export type SafehouseError<E extends string> = { _error: `safehouse: ${E}` }

/**
 * A generated request handler, which takes a request and response and returns nothing.
 */
export type RequestHandler = (req: Request, res: Response, params: Record<string, string>) => Promise<void>
