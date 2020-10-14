import {ApolloServer} from "apollo-server";
import {Resolvers} from "./api/resolvers";
// TODO: Migrate to GraphQL-tools: https://www.graphql-tools.com/docs/migration-from-import/
import {importSchema} from "graphql-import";
import {RequestContext} from "./requestContext";
import {CirclesFlows} from "./circlesFlows";
const httpHeadersPlugin = require("apollo-server-plugin-http-headers");

export class Main
{
  private readonly _server: ApolloServer;
  private readonly _resolvers: Resolvers;

  constructor()
  {
    if (!process.env.SAFE_GRAPHQL_SCHEMA)
    {
      throw new Error("The SAFE_GRAPHQL_SCHEMA environment variable must contain a valid path that " +
        "points to the GraphQL api schema.");
    }
    if (!process.env.SAFE_CORS_ORIGINS){
      throw new Error("The SAFE_CORS_ORIGINS environment variable must contain a valid URL terminated by a semicolon. Values in this list are allowed to request the api service.")
    }
    const apiSchemaTypeDefs = importSchema(process.env.SAFE_GRAPHQL_SCHEMA);

    this._resolvers = new Resolvers();

    const corsOrigins = process.env.SAFE_CORS_ORIGINS.split(";");
    console.log("cors origins: ", corsOrigins);

    this._server = new ApolloServer({
      context: RequestContext.create,
      typeDefs: apiSchemaTypeDefs,
      plugins:[httpHeadersPlugin],
      resolvers: {
        Mutation: this._resolvers.mutationResolvers,
        Query: this._resolvers.queryResolvers
      },
      cors: {
        origin: corsOrigins,
        credentials: true
      }
    });
  }

  async run()
  {
    if (!process.env.SAFE_PORT)
    {
      throw new Error("The SAFE_PORT environment variable is not set.");
    }

    await this._server.listen({
      port: parseInt(process.env.SAFE_PORT),
    });
  }
}

new Main()
  .run()
  .then(async () => {
    try
    {
      await CirclesFlows.deployNewSafe();
    } catch (e) {
      console.log(e);
    }
  });
