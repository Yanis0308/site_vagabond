# Routes Folder

Routes define the pathways within your application.
Fastify's structure supports the modular monolith approach, where your
application is organized into distinct, self-contained modules.
This facilitates easier scaling and future transition to a microservice architecture.
In the future you might want to independently deploy some of those.

In this folder you should define all the routes that define the endpoints
of your web application.
Each service is a [Fastify
plugin](https://fastify.dev/docs/latest/Reference/Plugins/), it is
encapsulated (it can have its own independent plugins) and it is
typically stored in a file; be careful to group your routes logically,
e.g. all `/users` routes in a `users.js` file. We have added
a `root.js` file for you with a '/' root added.

If a single file becomes too large, create a folder and add a `index.js` file there:
this file must be a Fastify plugin, and it will be loaded automatically
by the application. You can now add as many files as you want inside that folder.
In this way you can create complex routes within a single monolith,
and eventually extract them.

If you need to share functionality between routes, place that
functionality into the `plugins` folder, and share it via
[decorators](https://fastify.dev/docs/latest/Reference/Decorators/).

If you're a bit confused about using `async/await` to write routes, you would
better take a look at [Promise resolution](https://fastify.dev/docs/latest/Reference/Routes/#promise-resolution) for more details.

## Error responses

`ErrorResponseSchema` (`libs/shared-utils/src/schemas/error.ts`) mirrors
Fastify's default error reply body: `{ statusCode, error, message, code? }`.
Use it for any error status (4xx/5xx) declared in a route `response` schema.

Two reasons to keep this shape aligned with Fastify's default:

1. Native plugin errors flow through unchanged. When `@fastify/under-pressure`
   throws 503, `@fastify/rate-limit` throws 429, or AJV throws 400, Fastify
   serializes them with its default serializer producing this exact shape —
   no `setErrorHandler` reshaping needed, no `FST_ERR_FAILED_ERROR_SERIALIZATION`.
2. Handlers that explicitly send an error use the same body shape, so the
   client sees one consistent format whatever the error source.

Example:

```ts
return await reply.status(404).send({
  statusCode: 404,
  error: "Not Found",
  message: "POI not found",
});
```

Background: VG-317 originally declared `503: ReadyResponseSchema` on `/ready`,
causing serialization failures whenever `under-pressure` intercepted the
request. The fix realigned `ErrorResponseSchema` on Fastify's native shape on VG-424.
