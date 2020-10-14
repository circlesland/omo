import {GraphQLClient} from "graphql-request";
import {getSdk} from "./generated";

const client = new GraphQLClient("https://api.thegraph.com/subgraphs/name/circlesubi/circlesxdai", {
  // credentials: "include"
});
export const theGraphClient = getSdk(client);