import type { ResponseData } from './types.js'

interface BlueprintOptions <
  BaseURL extends string,
  GlobalErrors extends ResponseData
> {
  baseUrl?: BaseURL,
  globalErrors?: GlobalErrors
}

interface MiddlewareOptions <
  Errors extends ResponseData
> {
  dependencies?: unknown[],
  errors?: Errors,
  prerequisites?: unknown[]
}

type BlueprintMiddleware <
  Arguments extends unknown[],
  Errors extends ResponseData
> = {
  options: MiddlewareOptions<Errors>,
  _presetCallArguments: Arguments | undefined,
  (...args: Arguments): BlueprintMiddleware<Arguments, Errors>
}

interface RouteOptions {
  middleware?: BlueprintMiddleware<any, any>[]
}

export type BlueprintRoute = RouteOptions & {
  location: readonly [method: string, url: string],
  _T_response: ResponseData
}

export class Blueprint <
  BaseURL extends string,
  GlobalErrors extends ResponseData
> {
  options: BlueprintOptions<BaseURL, GlobalErrors>

  constructor (options?: BlueprintOptions<BaseURL, GlobalErrors>) {
    this.options = options || {}
  }

  /**
   * Blueprint middlewares need:
   * - configuration (cors, deps, reqs, etc)
   * - arguments (so they can be 'called'/configured in blueprint routes)
   * - NOT context data, this is only in the implementation
   */
  middleware <Arguments extends unknown[] = []> () {
    return <const Errors extends ResponseData> (options?: MiddlewareOptions<Errors>) => {
      const blueprintMiddlewareCallee = (...args: Arguments) => {
        blueprintMiddlewareCallee._presetCallArguments = args
        return blueprintMiddlewareCallee
      }

      blueprintMiddlewareCallee.options = options || {}
      blueprintMiddlewareCallee._presetCallArguments = undefined as Arguments | undefined

      return blueprintMiddlewareCallee as BlueprintMiddleware<Arguments, Errors>
    }
  }

  route <const Location extends [method: string, url: string], const Options extends RouteOptions> (location: Location, options: Options) {
    return <Response extends ResponseData> () => {
      return {
        location,
        ...options,
        _T_response: null as unknown as Response
      } satisfies BlueprintRoute
    }
  }
}
