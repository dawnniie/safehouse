import { Request, Response, Route, RouteHandler, RouteHandlerRequest, RouteHandlerResponse, RouterOptions } from '../types.js'
import { Tree } from './tree.js'

export class Router<const O extends RouterOptions> {
  options: O
  tree: Tree = new Map()

  constructor (options: O) {
    this.options = options
  }

  attach<const R extends Route> (route: R, handler: RouteHandler<R, O>) {
    let branch = this.tree.get(route.location.method) ||
      this.tree.set(route.location.method, { branches: new Map() }).get(route.location.method)!

    const parts = route.location.path.slice(1).split('/')
    for (const part of parts) {
      if (!part) continue
      if (part.startsWith(':')) {
        if (branch.param) {
          if (branch.param.name !== part.slice(1)) console.warn(`Safehouse: conflicting param names detected: ${branch.param.name} and ${part.slice(1)}`)
          branch = branch.param.branch
        } else {
          branch = { branches: new Map() }
        }
      } else {
        branch = branch.branches.get(part) ||
          branch.branches.set(part, { branches: new Map() }).get(part)!
      }
    }

    const strategy = route.auth && this.options.authStrategies.find(s => s.name === route.auth)
    if (route.auth && !strategy) throw new Error(`safehouse: auth strategy ${route.auth} is not defined in Router`)

    const innerHandler = (reqRaw: Request, resRaw: Response) => {
      const req = reqRaw as RouteHandlerRequest<R, O>
      const res = resRaw as RouteHandlerResponse<R>

      res.send = data => {
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(data))
        return res
      }

      // @ts-expect-error quirky overloading
      res.success = (status, body) => {
        if (status === '204') {
          res.statusCode = 204
          res.end()
        }

        res.statusCode = Number(status)
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(body))
        return res
      }

      res.error = (err, extra) => {
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(Object.assign(err, extra)))
        return res
      }

      if (strategy) {
        const result = strategy.handler(req, res) as Awaited<ReturnType<O['authStrategies'][number]['handler']>>
        if (typeof result === 'object' && 'status' in result && typeof result.status === 'number') {
          res.error(result)
          return
        }

        // @ts-expect-error safe
        req.auth = result
      }
    }

    branch.leaf = { handler: innerHandler }
  }

  handle (req: Request, res: Response) {
    const url = new URL(req.url!, `http://${req.headers.host}`)

    let branch = this.tree.get(req.method!)
    const params: Record<string, string> = {}

    const parts = url.pathname.slice(1).split('/')
    while (branch && parts.length) {
      const part = parts.shift()
      if (part) {
        const exactBranch = branch.branches.get(part)
        if (exactBranch) branch = exactBranch
        else if (branch.param) {
          params[branch.param.name] = part
          branch = branch.param.branch
        } else branch = undefined
      }
    }

    if (branch && branch.leaf) {
      branch.leaf.handler(req, res)
    } else {
      console.log(404)
    }
  }
}
