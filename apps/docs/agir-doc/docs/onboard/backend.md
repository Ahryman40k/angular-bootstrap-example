# Backends

## Anatomy of a backend

A backend is divided into 3 parts:
- the communication layer: can be RPC, HTTP/REST, gRPC, GraphQL ...
- the domain that act as business units of logic
- the infrastructure layer that handle the concrete way for a business logic to play with an elsewhere data

### Communication Layer

It goals is to manage all communication related part like routing, HTTP errors, ... 
It should also check integrity of input objects with Zod schema.

In brief, that layer 
- validate input data
- extract data from communication channel and produce Domain-specific object model
- handle errors for client
- use a domain service to execute its purpose

### Domain layer

Here we define a service dedicated to a question.

As exemple, if the question is related to an object creation on a system, then the service will expose a `create` function 
- that take Input information 
- validate business rules on input data
- call a system that communicate concretely (like a db, another server, a file, ...)
- return the result or error

### Infrastructure layer

Expose concrete action from an external system. Like CRUD operation on a db, ...
Abstraction here allows us to decorate object, so we can add caching, ...


## Generate an API server

An API server can be generated thanks to @nrwl/express addin.
- So first assume that it is in installed in the workspace
- then run `nx g @nrwl/express:app` et let the addin guide you :)



