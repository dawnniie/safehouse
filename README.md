# safehouse

The code for this project is, for the most part, already functional in a private project. I'm currently working on moving it over and making things a bit more formalised/configurable for it to be suitable for public use.

## Benefits

- Helps ensure client <-> server data consistency.
- Enforces that the client side handles any possible errors. Minimal 'unexpected error' errors.
- DX+++ -> your intellisense becomes amazing.
- Eliminates the need for field-by-field API documentation (which honestly you shouldn't be doing anyway, but yeah).
- If applicable, makes it far easier for third parties to use your API. You can define routes anywhere, so some can be public and others private.

## Conceptual Overview

This is just an overview, things will change and not everything is shown.

**Routes are defined in a common location which can be exported to both the server-side and client-side.**

```ts
/* I recommend collating all errors together in a separate file */
export const UsernameTaken = { status: 401, body: { code: 1001, message: 'Username already in use' } } as const

export const getUsersMe = route('GET', '/users/me', {
    /* Defining a strategy will automatically include all applicable auth errors in the response */
    auth: AuthStrategy.Require,
    /* We tell the server exactly what to send and the client what it can expect to receive */
    response: null as unknown as { status: 200, body: User<'self'> }
})

export const patchUsersMe = route('PATCH', '/users/me', {
    auth: AuthStrategy.Require,
    /* Native zod support, which again will include all applicable errors */
    body: z.object({
        username: z.string().regex(/[a-z0-9-]{4,20}/),
        description: z.string()
    }).partial(),
    /* Any number of responses can be specified with a union, including errors */
    response: null as unknown as { status: 200, body: User<'self'> }
        | typeof UsernameTaken
})
```

**On the server-side, we have handlers which provide correctly typed request bodies and only accept the defined responses.**

Here, we are assuming that all routes are exported/imported as `Routes` and errors as `Errors`.

```ts
export const getUsersMe = handle(
    Routes.getUsersMe,
    async (req, res) => {
        /* req.author is already loaded by the authentication strategy */
        const user = await database.users.get(req.author.id)
        return res.json(user)
    }
)

export const patchUsersMe = handle(
    Routes.patchUsersMe,
    async (req, res) => {
        const existingUser = await database.users.find({ username: req.body.username })
        if (existingUser) return res.error(Errors.UsernameTaken)
        const updatedUser = await database.users.update(req.author.id, req.body)
        return res.json(updatedUser)
    }
)
```

**On the client-side, we use a special fetcher that takes a Route object rather than a Method & URL.**

```ts
/* The body we provide is strictly typed, and will error if incorrect */
const response = await fetch(Routes.patchUsersMe, { body: { username: 'my-new-username' } })
/* The response is also strictly typed! Not only is the correct data structure there, but TypeScript will ensure you handle any possible errors. */
console.log(response)
```

## Future Roadmap

Here are some vague ideas that I would like to implement in the future.

- Automatically generate OpenAPI specification from Routes.
- Provide mapped responses for different input conditions, particularly for use cases like user permissions. This seems difficult, and maybe even impossible to do strictly server-side.
- Increased modularity to plug-and-play different body parsers.
