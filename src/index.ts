import { BlueprintRoute } from './blueprint.js';
import { Tree } from './router/tree.js';
import { Request, Response } from './types.js';

export default class Safehouse {
  tree: Tree = { branches: new Map() }

  route <const Meta extends BlueprintRoute | [method: string, url: string], const Options extends RouteOptions> (
    meta: Meta,
    options: Options
  ) {
    const [method, url] = meta instanceof Array ? meta : meta.location

    function routeWarning (message: string, action?: string) {
      console.warn(`safehouse: route setup ${url}\n> ${message}${action ? `\n> action: ${action}` : ''}`)
    }

    let branch = this.tree
    const parts = url.split('/')
    // remove leading slash, it should be there
    if (parts.length && !parts[0]) parts.shift()
    for (const part of parts) {
      if (part.startsWith(':')) {
        if (branch.param) return routeWarning(`url: param ':${branch.param.name}' already exists for subroute, cannot separately match this param '${part}'`, 'skipping route')
        branch.param = { name: part.slice(1), branch: {} }
        branch = branch.param.branch
      } else {
        if (!branch.branches) branch.branches = new Map()
        branch.branches.set(part, {})
        branch = branch.branches.get(part)!
      }
    }

    if (!branch.leaf) branch.leaf = new Map()
    branch.leaf.set(method, (req, res, params) => {
      let ctx = { _params }

    })
  }

  handle (req: Request, res: Response) {
    if (!req.url) return res.writeHead(401).end()
    if (!req.method) return res.writeHead(401).end()
    if (!req.headers.host) return res.writeHead(401).end()

    const url = new URL(req.url, `http://${req.headers.host}`)
    const params: Record<string, string> = {}

    let branch = this.tree
    const parts = url.pathname.slice(1).split('/')
    while (parts.length) {
      const part = parts.shift()!
      // skip last iteration if there is a trailing slash
      if (!parts.length && !part) continue

      const nextBranch = branch.branches?.get(part)
      if (nextBranch) branch = nextBranch
      else if (branch.param) {
        params[branch.param.name] = part
        branch = branch.param.branch
      } else {
        return res.writeHead(404).end()
      }
    }

    const handler = branch.leaf?.get(req.method)?.handler
    if (handler) return handler(req, res, params)
    return res.writeHead(404).end()
  }
}
