import { RequestHandler } from '../types.js'

export type Branch = {
  /**
   * Map of method to handler for the route of the current branch
   * eg. for branch /test/abc, leaf will handle /test/abc
   */
  leaf?: Map<string, { handler: RequestHandler }>,
  /**
   * Handler for a catch-all parameter of the current branch
   * eg. for branch /test/abc, param will handle /test/abc/123
   */
  param?: { name: string, branch: Branch },
  /**
   * Contains branches as descendants of this branch
   * eg. mapped 123 -> branch for /test/abc/123
   */
  branches?: Map<string, Branch>
}

/** The route tree begins with a branch for the top / endpoint */
export type Tree = Branch
