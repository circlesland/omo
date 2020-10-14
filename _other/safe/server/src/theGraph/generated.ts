import type { GraphQLClient } from 'graphql-request';
import { print } from 'graphql';
import type { GraphQLError } from 'graphql-request/dist/types';
import type { Headers } from 'graphql-request/dist/types.dom';
import gql from 'graphql-tag';
export type Maybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  BigDecimal: any;
  BigInt: any;
  Bytes: any;
};

export type Balance = {
  __typename?: 'Balance';
  id: Scalars['ID'];
  amount: Scalars['BigInt'];
  owner: Safe;
  token: Token;
};

export type Balance_Filter = {
  id?: Maybe<Scalars['ID']>;
  id_not?: Maybe<Scalars['ID']>;
  id_gt?: Maybe<Scalars['ID']>;
  id_lt?: Maybe<Scalars['ID']>;
  id_gte?: Maybe<Scalars['ID']>;
  id_lte?: Maybe<Scalars['ID']>;
  id_in?: Maybe<Array<Scalars['ID']>>;
  id_not_in?: Maybe<Array<Scalars['ID']>>;
  amount?: Maybe<Scalars['BigInt']>;
  amount_not?: Maybe<Scalars['BigInt']>;
  amount_gt?: Maybe<Scalars['BigInt']>;
  amount_lt?: Maybe<Scalars['BigInt']>;
  amount_gte?: Maybe<Scalars['BigInt']>;
  amount_lte?: Maybe<Scalars['BigInt']>;
  amount_in?: Maybe<Array<Scalars['BigInt']>>;
  amount_not_in?: Maybe<Array<Scalars['BigInt']>>;
  owner?: Maybe<Scalars['String']>;
  owner_not?: Maybe<Scalars['String']>;
  owner_gt?: Maybe<Scalars['String']>;
  owner_lt?: Maybe<Scalars['String']>;
  owner_gte?: Maybe<Scalars['String']>;
  owner_lte?: Maybe<Scalars['String']>;
  owner_in?: Maybe<Array<Scalars['String']>>;
  owner_not_in?: Maybe<Array<Scalars['String']>>;
  owner_contains?: Maybe<Scalars['String']>;
  owner_not_contains?: Maybe<Scalars['String']>;
  owner_starts_with?: Maybe<Scalars['String']>;
  owner_not_starts_with?: Maybe<Scalars['String']>;
  owner_ends_with?: Maybe<Scalars['String']>;
  owner_not_ends_with?: Maybe<Scalars['String']>;
  token?: Maybe<Scalars['String']>;
  token_not?: Maybe<Scalars['String']>;
  token_gt?: Maybe<Scalars['String']>;
  token_lt?: Maybe<Scalars['String']>;
  token_gte?: Maybe<Scalars['String']>;
  token_lte?: Maybe<Scalars['String']>;
  token_in?: Maybe<Array<Scalars['String']>>;
  token_not_in?: Maybe<Array<Scalars['String']>>;
  token_contains?: Maybe<Scalars['String']>;
  token_not_contains?: Maybe<Scalars['String']>;
  token_starts_with?: Maybe<Scalars['String']>;
  token_not_starts_with?: Maybe<Scalars['String']>;
  token_ends_with?: Maybe<Scalars['String']>;
  token_not_ends_with?: Maybe<Scalars['String']>;
};

export enum Balance_OrderBy {
  Id = 'id',
  Amount = 'amount',
  Owner = 'owner',
  Token = 'token'
}



export type Block_Height = {
  hash?: Maybe<Scalars['Bytes']>;
  number?: Maybe<Scalars['Int']>;
};


export type Event = {
  id: Scalars['ID'];
};

export type Event_Filter = {
  id?: Maybe<Scalars['ID']>;
  id_not?: Maybe<Scalars['ID']>;
  id_gt?: Maybe<Scalars['ID']>;
  id_lt?: Maybe<Scalars['ID']>;
  id_gte?: Maybe<Scalars['ID']>;
  id_lte?: Maybe<Scalars['ID']>;
  id_in?: Maybe<Array<Scalars['ID']>>;
  id_not_in?: Maybe<Array<Scalars['ID']>>;
};

export enum Event_OrderBy {
  Id = 'id'
}

export type HubTransfer = Event & {
  __typename?: 'HubTransfer';
  id: Scalars['ID'];
  from: Scalars['String'];
  to: Scalars['String'];
  amount: Scalars['BigInt'];
};

export type HubTransfer_Filter = {
  id?: Maybe<Scalars['ID']>;
  id_not?: Maybe<Scalars['ID']>;
  id_gt?: Maybe<Scalars['ID']>;
  id_lt?: Maybe<Scalars['ID']>;
  id_gte?: Maybe<Scalars['ID']>;
  id_lte?: Maybe<Scalars['ID']>;
  id_in?: Maybe<Array<Scalars['ID']>>;
  id_not_in?: Maybe<Array<Scalars['ID']>>;
  from?: Maybe<Scalars['String']>;
  from_not?: Maybe<Scalars['String']>;
  from_gt?: Maybe<Scalars['String']>;
  from_lt?: Maybe<Scalars['String']>;
  from_gte?: Maybe<Scalars['String']>;
  from_lte?: Maybe<Scalars['String']>;
  from_in?: Maybe<Array<Scalars['String']>>;
  from_not_in?: Maybe<Array<Scalars['String']>>;
  from_contains?: Maybe<Scalars['String']>;
  from_not_contains?: Maybe<Scalars['String']>;
  from_starts_with?: Maybe<Scalars['String']>;
  from_not_starts_with?: Maybe<Scalars['String']>;
  from_ends_with?: Maybe<Scalars['String']>;
  from_not_ends_with?: Maybe<Scalars['String']>;
  to?: Maybe<Scalars['String']>;
  to_not?: Maybe<Scalars['String']>;
  to_gt?: Maybe<Scalars['String']>;
  to_lt?: Maybe<Scalars['String']>;
  to_gte?: Maybe<Scalars['String']>;
  to_lte?: Maybe<Scalars['String']>;
  to_in?: Maybe<Array<Scalars['String']>>;
  to_not_in?: Maybe<Array<Scalars['String']>>;
  to_contains?: Maybe<Scalars['String']>;
  to_not_contains?: Maybe<Scalars['String']>;
  to_starts_with?: Maybe<Scalars['String']>;
  to_not_starts_with?: Maybe<Scalars['String']>;
  to_ends_with?: Maybe<Scalars['String']>;
  to_not_ends_with?: Maybe<Scalars['String']>;
  amount?: Maybe<Scalars['BigInt']>;
  amount_not?: Maybe<Scalars['BigInt']>;
  amount_gt?: Maybe<Scalars['BigInt']>;
  amount_lt?: Maybe<Scalars['BigInt']>;
  amount_gte?: Maybe<Scalars['BigInt']>;
  amount_lte?: Maybe<Scalars['BigInt']>;
  amount_in?: Maybe<Array<Scalars['BigInt']>>;
  amount_not_in?: Maybe<Array<Scalars['BigInt']>>;
};

export enum HubTransfer_OrderBy {
  Id = 'id',
  From = 'from',
  To = 'to',
  Amount = 'amount'
}

export type Notification = Event & {
  __typename?: 'Notification';
  id: Scalars['ID'];
  safe?: Maybe<Safe>;
  safeAddress: Scalars['String'];
  type: NotificationType;
  time: Scalars['BigInt'];
  transactionHash: Scalars['String'];
  trust?: Maybe<TrustChange>;
  transfer?: Maybe<Transfer>;
  hubTransfer?: Maybe<HubTransfer>;
  ownership?: Maybe<OwnershipChange>;
};

export enum NotificationType {
  HubTransfer = 'HUB_TRANSFER',
  Ownership = 'OWNERSHIP',
  Transfer = 'TRANSFER',
  Trust = 'TRUST'
}

export type Notification_Filter = {
  id?: Maybe<Scalars['ID']>;
  id_not?: Maybe<Scalars['ID']>;
  id_gt?: Maybe<Scalars['ID']>;
  id_lt?: Maybe<Scalars['ID']>;
  id_gte?: Maybe<Scalars['ID']>;
  id_lte?: Maybe<Scalars['ID']>;
  id_in?: Maybe<Array<Scalars['ID']>>;
  id_not_in?: Maybe<Array<Scalars['ID']>>;
  safe?: Maybe<Scalars['String']>;
  safe_not?: Maybe<Scalars['String']>;
  safe_gt?: Maybe<Scalars['String']>;
  safe_lt?: Maybe<Scalars['String']>;
  safe_gte?: Maybe<Scalars['String']>;
  safe_lte?: Maybe<Scalars['String']>;
  safe_in?: Maybe<Array<Scalars['String']>>;
  safe_not_in?: Maybe<Array<Scalars['String']>>;
  safe_contains?: Maybe<Scalars['String']>;
  safe_not_contains?: Maybe<Scalars['String']>;
  safe_starts_with?: Maybe<Scalars['String']>;
  safe_not_starts_with?: Maybe<Scalars['String']>;
  safe_ends_with?: Maybe<Scalars['String']>;
  safe_not_ends_with?: Maybe<Scalars['String']>;
  safeAddress?: Maybe<Scalars['String']>;
  safeAddress_not?: Maybe<Scalars['String']>;
  safeAddress_gt?: Maybe<Scalars['String']>;
  safeAddress_lt?: Maybe<Scalars['String']>;
  safeAddress_gte?: Maybe<Scalars['String']>;
  safeAddress_lte?: Maybe<Scalars['String']>;
  safeAddress_in?: Maybe<Array<Scalars['String']>>;
  safeAddress_not_in?: Maybe<Array<Scalars['String']>>;
  safeAddress_contains?: Maybe<Scalars['String']>;
  safeAddress_not_contains?: Maybe<Scalars['String']>;
  safeAddress_starts_with?: Maybe<Scalars['String']>;
  safeAddress_not_starts_with?: Maybe<Scalars['String']>;
  safeAddress_ends_with?: Maybe<Scalars['String']>;
  safeAddress_not_ends_with?: Maybe<Scalars['String']>;
  type?: Maybe<NotificationType>;
  type_not?: Maybe<NotificationType>;
  time?: Maybe<Scalars['BigInt']>;
  time_not?: Maybe<Scalars['BigInt']>;
  time_gt?: Maybe<Scalars['BigInt']>;
  time_lt?: Maybe<Scalars['BigInt']>;
  time_gte?: Maybe<Scalars['BigInt']>;
  time_lte?: Maybe<Scalars['BigInt']>;
  time_in?: Maybe<Array<Scalars['BigInt']>>;
  time_not_in?: Maybe<Array<Scalars['BigInt']>>;
  transactionHash?: Maybe<Scalars['String']>;
  transactionHash_not?: Maybe<Scalars['String']>;
  transactionHash_gt?: Maybe<Scalars['String']>;
  transactionHash_lt?: Maybe<Scalars['String']>;
  transactionHash_gte?: Maybe<Scalars['String']>;
  transactionHash_lte?: Maybe<Scalars['String']>;
  transactionHash_in?: Maybe<Array<Scalars['String']>>;
  transactionHash_not_in?: Maybe<Array<Scalars['String']>>;
  transactionHash_contains?: Maybe<Scalars['String']>;
  transactionHash_not_contains?: Maybe<Scalars['String']>;
  transactionHash_starts_with?: Maybe<Scalars['String']>;
  transactionHash_not_starts_with?: Maybe<Scalars['String']>;
  transactionHash_ends_with?: Maybe<Scalars['String']>;
  transactionHash_not_ends_with?: Maybe<Scalars['String']>;
  trust?: Maybe<Scalars['String']>;
  trust_not?: Maybe<Scalars['String']>;
  trust_gt?: Maybe<Scalars['String']>;
  trust_lt?: Maybe<Scalars['String']>;
  trust_gte?: Maybe<Scalars['String']>;
  trust_lte?: Maybe<Scalars['String']>;
  trust_in?: Maybe<Array<Scalars['String']>>;
  trust_not_in?: Maybe<Array<Scalars['String']>>;
  trust_contains?: Maybe<Scalars['String']>;
  trust_not_contains?: Maybe<Scalars['String']>;
  trust_starts_with?: Maybe<Scalars['String']>;
  trust_not_starts_with?: Maybe<Scalars['String']>;
  trust_ends_with?: Maybe<Scalars['String']>;
  trust_not_ends_with?: Maybe<Scalars['String']>;
  transfer?: Maybe<Scalars['String']>;
  transfer_not?: Maybe<Scalars['String']>;
  transfer_gt?: Maybe<Scalars['String']>;
  transfer_lt?: Maybe<Scalars['String']>;
  transfer_gte?: Maybe<Scalars['String']>;
  transfer_lte?: Maybe<Scalars['String']>;
  transfer_in?: Maybe<Array<Scalars['String']>>;
  transfer_not_in?: Maybe<Array<Scalars['String']>>;
  transfer_contains?: Maybe<Scalars['String']>;
  transfer_not_contains?: Maybe<Scalars['String']>;
  transfer_starts_with?: Maybe<Scalars['String']>;
  transfer_not_starts_with?: Maybe<Scalars['String']>;
  transfer_ends_with?: Maybe<Scalars['String']>;
  transfer_not_ends_with?: Maybe<Scalars['String']>;
  hubTransfer?: Maybe<Scalars['String']>;
  hubTransfer_not?: Maybe<Scalars['String']>;
  hubTransfer_gt?: Maybe<Scalars['String']>;
  hubTransfer_lt?: Maybe<Scalars['String']>;
  hubTransfer_gte?: Maybe<Scalars['String']>;
  hubTransfer_lte?: Maybe<Scalars['String']>;
  hubTransfer_in?: Maybe<Array<Scalars['String']>>;
  hubTransfer_not_in?: Maybe<Array<Scalars['String']>>;
  hubTransfer_contains?: Maybe<Scalars['String']>;
  hubTransfer_not_contains?: Maybe<Scalars['String']>;
  hubTransfer_starts_with?: Maybe<Scalars['String']>;
  hubTransfer_not_starts_with?: Maybe<Scalars['String']>;
  hubTransfer_ends_with?: Maybe<Scalars['String']>;
  hubTransfer_not_ends_with?: Maybe<Scalars['String']>;
  ownership?: Maybe<Scalars['String']>;
  ownership_not?: Maybe<Scalars['String']>;
  ownership_gt?: Maybe<Scalars['String']>;
  ownership_lt?: Maybe<Scalars['String']>;
  ownership_gte?: Maybe<Scalars['String']>;
  ownership_lte?: Maybe<Scalars['String']>;
  ownership_in?: Maybe<Array<Scalars['String']>>;
  ownership_not_in?: Maybe<Array<Scalars['String']>>;
  ownership_contains?: Maybe<Scalars['String']>;
  ownership_not_contains?: Maybe<Scalars['String']>;
  ownership_starts_with?: Maybe<Scalars['String']>;
  ownership_not_starts_with?: Maybe<Scalars['String']>;
  ownership_ends_with?: Maybe<Scalars['String']>;
  ownership_not_ends_with?: Maybe<Scalars['String']>;
};

export enum Notification_OrderBy {
  Id = 'id',
  Safe = 'safe',
  SafeAddress = 'safeAddress',
  Type = 'type',
  Time = 'time',
  TransactionHash = 'transactionHash',
  Trust = 'trust',
  Transfer = 'transfer',
  HubTransfer = 'hubTransfer',
  Ownership = 'ownership'
}

export enum OrderDirection {
  Asc = 'asc',
  Desc = 'desc'
}

export type OwnershipChange = Event & {
  __typename?: 'OwnershipChange';
  id: Scalars['ID'];
  adds?: Maybe<Scalars['String']>;
  removes?: Maybe<Scalars['String']>;
};

export type OwnershipChange_Filter = {
  id?: Maybe<Scalars['ID']>;
  id_not?: Maybe<Scalars['ID']>;
  id_gt?: Maybe<Scalars['ID']>;
  id_lt?: Maybe<Scalars['ID']>;
  id_gte?: Maybe<Scalars['ID']>;
  id_lte?: Maybe<Scalars['ID']>;
  id_in?: Maybe<Array<Scalars['ID']>>;
  id_not_in?: Maybe<Array<Scalars['ID']>>;
  adds?: Maybe<Scalars['String']>;
  adds_not?: Maybe<Scalars['String']>;
  adds_gt?: Maybe<Scalars['String']>;
  adds_lt?: Maybe<Scalars['String']>;
  adds_gte?: Maybe<Scalars['String']>;
  adds_lte?: Maybe<Scalars['String']>;
  adds_in?: Maybe<Array<Scalars['String']>>;
  adds_not_in?: Maybe<Array<Scalars['String']>>;
  adds_contains?: Maybe<Scalars['String']>;
  adds_not_contains?: Maybe<Scalars['String']>;
  adds_starts_with?: Maybe<Scalars['String']>;
  adds_not_starts_with?: Maybe<Scalars['String']>;
  adds_ends_with?: Maybe<Scalars['String']>;
  adds_not_ends_with?: Maybe<Scalars['String']>;
  removes?: Maybe<Scalars['String']>;
  removes_not?: Maybe<Scalars['String']>;
  removes_gt?: Maybe<Scalars['String']>;
  removes_lt?: Maybe<Scalars['String']>;
  removes_gte?: Maybe<Scalars['String']>;
  removes_lte?: Maybe<Scalars['String']>;
  removes_in?: Maybe<Array<Scalars['String']>>;
  removes_not_in?: Maybe<Array<Scalars['String']>>;
  removes_contains?: Maybe<Scalars['String']>;
  removes_not_contains?: Maybe<Scalars['String']>;
  removes_starts_with?: Maybe<Scalars['String']>;
  removes_not_starts_with?: Maybe<Scalars['String']>;
  removes_ends_with?: Maybe<Scalars['String']>;
  removes_not_ends_with?: Maybe<Scalars['String']>;
};

export enum OwnershipChange_OrderBy {
  Id = 'id',
  Adds = 'adds',
  Removes = 'removes'
}

export type Query = {
  __typename?: 'Query';
  token?: Maybe<Token>;
  tokens: Array<Token>;
  user?: Maybe<User>;
  users: Array<User>;
  safe?: Maybe<Safe>;
  safes: Array<Safe>;
  balance?: Maybe<Balance>;
  balances: Array<Balance>;
  signup?: Maybe<Signup>;
  signups: Array<Signup>;
  trust?: Maybe<Trust>;
  trusts: Array<Trust>;
  trustChange?: Maybe<TrustChange>;
  trustChanges: Array<TrustChange>;
  transfer?: Maybe<Transfer>;
  transfers: Array<Transfer>;
  hubTransfer?: Maybe<HubTransfer>;
  hubTransfers: Array<HubTransfer>;
  ownershipChange?: Maybe<OwnershipChange>;
  ownershipChanges: Array<OwnershipChange>;
  notification?: Maybe<Notification>;
  notifications: Array<Notification>;
  event?: Maybe<Event>;
  events: Array<Event>;
};


export type QueryTokenArgs = {
  id: Scalars['ID'];
  block?: Maybe<Block_Height>;
};


export type QueryTokensArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Token_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  where?: Maybe<Token_Filter>;
  block?: Maybe<Block_Height>;
};


export type QueryUserArgs = {
  id: Scalars['ID'];
  block?: Maybe<Block_Height>;
};


export type QueryUsersArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<User_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  where?: Maybe<User_Filter>;
  block?: Maybe<Block_Height>;
};


export type QuerySafeArgs = {
  id: Scalars['ID'];
  block?: Maybe<Block_Height>;
};


export type QuerySafesArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Safe_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  where?: Maybe<Safe_Filter>;
  block?: Maybe<Block_Height>;
};


export type QueryBalanceArgs = {
  id: Scalars['ID'];
  block?: Maybe<Block_Height>;
};


export type QueryBalancesArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Balance_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  where?: Maybe<Balance_Filter>;
  block?: Maybe<Block_Height>;
};


export type QuerySignupArgs = {
  id: Scalars['ID'];
  block?: Maybe<Block_Height>;
};


export type QuerySignupsArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Signup_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  where?: Maybe<Signup_Filter>;
  block?: Maybe<Block_Height>;
};


export type QueryTrustArgs = {
  id: Scalars['ID'];
  block?: Maybe<Block_Height>;
};


export type QueryTrustsArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Trust_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  where?: Maybe<Trust_Filter>;
  block?: Maybe<Block_Height>;
};


export type QueryTrustChangeArgs = {
  id: Scalars['ID'];
  block?: Maybe<Block_Height>;
};


export type QueryTrustChangesArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<TrustChange_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  where?: Maybe<TrustChange_Filter>;
  block?: Maybe<Block_Height>;
};


export type QueryTransferArgs = {
  id: Scalars['ID'];
  block?: Maybe<Block_Height>;
};


export type QueryTransfersArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Transfer_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  where?: Maybe<Transfer_Filter>;
  block?: Maybe<Block_Height>;
};


export type QueryHubTransferArgs = {
  id: Scalars['ID'];
  block?: Maybe<Block_Height>;
};


export type QueryHubTransfersArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<HubTransfer_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  where?: Maybe<HubTransfer_Filter>;
  block?: Maybe<Block_Height>;
};


export type QueryOwnershipChangeArgs = {
  id: Scalars['ID'];
  block?: Maybe<Block_Height>;
};


export type QueryOwnershipChangesArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<OwnershipChange_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  where?: Maybe<OwnershipChange_Filter>;
  block?: Maybe<Block_Height>;
};


export type QueryNotificationArgs = {
  id: Scalars['ID'];
  block?: Maybe<Block_Height>;
};


export type QueryNotificationsArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Notification_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  where?: Maybe<Notification_Filter>;
  block?: Maybe<Block_Height>;
};


export type QueryEventArgs = {
  id: Scalars['ID'];
  block?: Maybe<Block_Height>;
};


export type QueryEventsArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Event_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  where?: Maybe<Event_Filter>;
  block?: Maybe<Block_Height>;
};

export type Safe = {
  __typename?: 'Safe';
  id: Scalars['ID'];
  deployed?: Maybe<Scalars['Boolean']>;
  owners: Array<User>;
  outgoing: Array<Trust>;
  incoming: Array<Trust>;
  outgoingAddresses: Array<Scalars['String']>;
  balances: Array<Balance>;
};


export type SafeOwnersArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<User_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  where?: Maybe<User_Filter>;
};


export type SafeOutgoingArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Trust_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  where?: Maybe<Trust_Filter>;
};


export type SafeIncomingArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Trust_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  where?: Maybe<Trust_Filter>;
};


export type SafeBalancesArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Balance_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  where?: Maybe<Balance_Filter>;
};

export type Safe_Filter = {
  id?: Maybe<Scalars['ID']>;
  id_not?: Maybe<Scalars['ID']>;
  id_gt?: Maybe<Scalars['ID']>;
  id_lt?: Maybe<Scalars['ID']>;
  id_gte?: Maybe<Scalars['ID']>;
  id_lte?: Maybe<Scalars['ID']>;
  id_in?: Maybe<Array<Scalars['ID']>>;
  id_not_in?: Maybe<Array<Scalars['ID']>>;
  deployed?: Maybe<Scalars['Boolean']>;
  deployed_not?: Maybe<Scalars['Boolean']>;
  deployed_in?: Maybe<Array<Scalars['Boolean']>>;
  deployed_not_in?: Maybe<Array<Scalars['Boolean']>>;
  outgoingAddresses?: Maybe<Array<Scalars['String']>>;
  outgoingAddresses_not?: Maybe<Array<Scalars['String']>>;
  outgoingAddresses_contains?: Maybe<Array<Scalars['String']>>;
  outgoingAddresses_not_contains?: Maybe<Array<Scalars['String']>>;
};

export enum Safe_OrderBy {
  Id = 'id',
  Deployed = 'deployed',
  Owners = 'owners',
  Outgoing = 'outgoing',
  Incoming = 'incoming',
  OutgoingAddresses = 'outgoingAddresses',
  Balances = 'balances'
}

export type Signup = Event & {
  __typename?: 'Signup';
  id: Scalars['ID'];
  safe: Scalars['String'];
  token: Scalars['String'];
};

export type Signup_Filter = {
  id?: Maybe<Scalars['ID']>;
  id_not?: Maybe<Scalars['ID']>;
  id_gt?: Maybe<Scalars['ID']>;
  id_lt?: Maybe<Scalars['ID']>;
  id_gte?: Maybe<Scalars['ID']>;
  id_lte?: Maybe<Scalars['ID']>;
  id_in?: Maybe<Array<Scalars['ID']>>;
  id_not_in?: Maybe<Array<Scalars['ID']>>;
  safe?: Maybe<Scalars['String']>;
  safe_not?: Maybe<Scalars['String']>;
  safe_gt?: Maybe<Scalars['String']>;
  safe_lt?: Maybe<Scalars['String']>;
  safe_gte?: Maybe<Scalars['String']>;
  safe_lte?: Maybe<Scalars['String']>;
  safe_in?: Maybe<Array<Scalars['String']>>;
  safe_not_in?: Maybe<Array<Scalars['String']>>;
  safe_contains?: Maybe<Scalars['String']>;
  safe_not_contains?: Maybe<Scalars['String']>;
  safe_starts_with?: Maybe<Scalars['String']>;
  safe_not_starts_with?: Maybe<Scalars['String']>;
  safe_ends_with?: Maybe<Scalars['String']>;
  safe_not_ends_with?: Maybe<Scalars['String']>;
  token?: Maybe<Scalars['String']>;
  token_not?: Maybe<Scalars['String']>;
  token_gt?: Maybe<Scalars['String']>;
  token_lt?: Maybe<Scalars['String']>;
  token_gte?: Maybe<Scalars['String']>;
  token_lte?: Maybe<Scalars['String']>;
  token_in?: Maybe<Array<Scalars['String']>>;
  token_not_in?: Maybe<Array<Scalars['String']>>;
  token_contains?: Maybe<Scalars['String']>;
  token_not_contains?: Maybe<Scalars['String']>;
  token_starts_with?: Maybe<Scalars['String']>;
  token_not_starts_with?: Maybe<Scalars['String']>;
  token_ends_with?: Maybe<Scalars['String']>;
  token_not_ends_with?: Maybe<Scalars['String']>;
};

export enum Signup_OrderBy {
  Id = 'id',
  Safe = 'safe',
  Token = 'token'
}

export type Subscription = {
  __typename?: 'Subscription';
  token?: Maybe<Token>;
  tokens: Array<Token>;
  user?: Maybe<User>;
  users: Array<User>;
  safe?: Maybe<Safe>;
  safes: Array<Safe>;
  balance?: Maybe<Balance>;
  balances: Array<Balance>;
  signup?: Maybe<Signup>;
  signups: Array<Signup>;
  trust?: Maybe<Trust>;
  trusts: Array<Trust>;
  trustChange?: Maybe<TrustChange>;
  trustChanges: Array<TrustChange>;
  transfer?: Maybe<Transfer>;
  transfers: Array<Transfer>;
  hubTransfer?: Maybe<HubTransfer>;
  hubTransfers: Array<HubTransfer>;
  ownershipChange?: Maybe<OwnershipChange>;
  ownershipChanges: Array<OwnershipChange>;
  notification?: Maybe<Notification>;
  notifications: Array<Notification>;
  event?: Maybe<Event>;
  events: Array<Event>;
};


export type SubscriptionTokenArgs = {
  id: Scalars['ID'];
  block?: Maybe<Block_Height>;
};


export type SubscriptionTokensArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Token_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  where?: Maybe<Token_Filter>;
  block?: Maybe<Block_Height>;
};


export type SubscriptionUserArgs = {
  id: Scalars['ID'];
  block?: Maybe<Block_Height>;
};


export type SubscriptionUsersArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<User_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  where?: Maybe<User_Filter>;
  block?: Maybe<Block_Height>;
};


export type SubscriptionSafeArgs = {
  id: Scalars['ID'];
  block?: Maybe<Block_Height>;
};


export type SubscriptionSafesArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Safe_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  where?: Maybe<Safe_Filter>;
  block?: Maybe<Block_Height>;
};


export type SubscriptionBalanceArgs = {
  id: Scalars['ID'];
  block?: Maybe<Block_Height>;
};


export type SubscriptionBalancesArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Balance_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  where?: Maybe<Balance_Filter>;
  block?: Maybe<Block_Height>;
};


export type SubscriptionSignupArgs = {
  id: Scalars['ID'];
  block?: Maybe<Block_Height>;
};


export type SubscriptionSignupsArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Signup_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  where?: Maybe<Signup_Filter>;
  block?: Maybe<Block_Height>;
};


export type SubscriptionTrustArgs = {
  id: Scalars['ID'];
  block?: Maybe<Block_Height>;
};


export type SubscriptionTrustsArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Trust_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  where?: Maybe<Trust_Filter>;
  block?: Maybe<Block_Height>;
};


export type SubscriptionTrustChangeArgs = {
  id: Scalars['ID'];
  block?: Maybe<Block_Height>;
};


export type SubscriptionTrustChangesArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<TrustChange_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  where?: Maybe<TrustChange_Filter>;
  block?: Maybe<Block_Height>;
};


export type SubscriptionTransferArgs = {
  id: Scalars['ID'];
  block?: Maybe<Block_Height>;
};


export type SubscriptionTransfersArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Transfer_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  where?: Maybe<Transfer_Filter>;
  block?: Maybe<Block_Height>;
};


export type SubscriptionHubTransferArgs = {
  id: Scalars['ID'];
  block?: Maybe<Block_Height>;
};


export type SubscriptionHubTransfersArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<HubTransfer_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  where?: Maybe<HubTransfer_Filter>;
  block?: Maybe<Block_Height>;
};


export type SubscriptionOwnershipChangeArgs = {
  id: Scalars['ID'];
  block?: Maybe<Block_Height>;
};


export type SubscriptionOwnershipChangesArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<OwnershipChange_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  where?: Maybe<OwnershipChange_Filter>;
  block?: Maybe<Block_Height>;
};


export type SubscriptionNotificationArgs = {
  id: Scalars['ID'];
  block?: Maybe<Block_Height>;
};


export type SubscriptionNotificationsArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Notification_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  where?: Maybe<Notification_Filter>;
  block?: Maybe<Block_Height>;
};


export type SubscriptionEventArgs = {
  id: Scalars['ID'];
  block?: Maybe<Block_Height>;
};


export type SubscriptionEventsArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Event_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  where?: Maybe<Event_Filter>;
  block?: Maybe<Block_Height>;
};

export type Token = {
  __typename?: 'Token';
  id: Scalars['ID'];
  owner: Safe;
};

export type Token_Filter = {
  id?: Maybe<Scalars['ID']>;
  id_not?: Maybe<Scalars['ID']>;
  id_gt?: Maybe<Scalars['ID']>;
  id_lt?: Maybe<Scalars['ID']>;
  id_gte?: Maybe<Scalars['ID']>;
  id_lte?: Maybe<Scalars['ID']>;
  id_in?: Maybe<Array<Scalars['ID']>>;
  id_not_in?: Maybe<Array<Scalars['ID']>>;
  owner?: Maybe<Scalars['String']>;
  owner_not?: Maybe<Scalars['String']>;
  owner_gt?: Maybe<Scalars['String']>;
  owner_lt?: Maybe<Scalars['String']>;
  owner_gte?: Maybe<Scalars['String']>;
  owner_lte?: Maybe<Scalars['String']>;
  owner_in?: Maybe<Array<Scalars['String']>>;
  owner_not_in?: Maybe<Array<Scalars['String']>>;
  owner_contains?: Maybe<Scalars['String']>;
  owner_not_contains?: Maybe<Scalars['String']>;
  owner_starts_with?: Maybe<Scalars['String']>;
  owner_not_starts_with?: Maybe<Scalars['String']>;
  owner_ends_with?: Maybe<Scalars['String']>;
  owner_not_ends_with?: Maybe<Scalars['String']>;
};

export enum Token_OrderBy {
  Id = 'id',
  Owner = 'owner'
}

export type Transfer = Event & {
  __typename?: 'Transfer';
  id: Scalars['ID'];
  from: Scalars['String'];
  to: Scalars['String'];
  amount: Scalars['BigInt'];
};

export type Transfer_Filter = {
  id?: Maybe<Scalars['ID']>;
  id_not?: Maybe<Scalars['ID']>;
  id_gt?: Maybe<Scalars['ID']>;
  id_lt?: Maybe<Scalars['ID']>;
  id_gte?: Maybe<Scalars['ID']>;
  id_lte?: Maybe<Scalars['ID']>;
  id_in?: Maybe<Array<Scalars['ID']>>;
  id_not_in?: Maybe<Array<Scalars['ID']>>;
  from?: Maybe<Scalars['String']>;
  from_not?: Maybe<Scalars['String']>;
  from_gt?: Maybe<Scalars['String']>;
  from_lt?: Maybe<Scalars['String']>;
  from_gte?: Maybe<Scalars['String']>;
  from_lte?: Maybe<Scalars['String']>;
  from_in?: Maybe<Array<Scalars['String']>>;
  from_not_in?: Maybe<Array<Scalars['String']>>;
  from_contains?: Maybe<Scalars['String']>;
  from_not_contains?: Maybe<Scalars['String']>;
  from_starts_with?: Maybe<Scalars['String']>;
  from_not_starts_with?: Maybe<Scalars['String']>;
  from_ends_with?: Maybe<Scalars['String']>;
  from_not_ends_with?: Maybe<Scalars['String']>;
  to?: Maybe<Scalars['String']>;
  to_not?: Maybe<Scalars['String']>;
  to_gt?: Maybe<Scalars['String']>;
  to_lt?: Maybe<Scalars['String']>;
  to_gte?: Maybe<Scalars['String']>;
  to_lte?: Maybe<Scalars['String']>;
  to_in?: Maybe<Array<Scalars['String']>>;
  to_not_in?: Maybe<Array<Scalars['String']>>;
  to_contains?: Maybe<Scalars['String']>;
  to_not_contains?: Maybe<Scalars['String']>;
  to_starts_with?: Maybe<Scalars['String']>;
  to_not_starts_with?: Maybe<Scalars['String']>;
  to_ends_with?: Maybe<Scalars['String']>;
  to_not_ends_with?: Maybe<Scalars['String']>;
  amount?: Maybe<Scalars['BigInt']>;
  amount_not?: Maybe<Scalars['BigInt']>;
  amount_gt?: Maybe<Scalars['BigInt']>;
  amount_lt?: Maybe<Scalars['BigInt']>;
  amount_gte?: Maybe<Scalars['BigInt']>;
  amount_lte?: Maybe<Scalars['BigInt']>;
  amount_in?: Maybe<Array<Scalars['BigInt']>>;
  amount_not_in?: Maybe<Array<Scalars['BigInt']>>;
};

export enum Transfer_OrderBy {
  Id = 'id',
  From = 'from',
  To = 'to',
  Amount = 'amount'
}

export type Trust = Event & {
  __typename?: 'Trust';
  id: Scalars['ID'];
  canSendToAddress: Scalars['String'];
  canSendTo?: Maybe<Safe>;
  userAddress: Scalars['String'];
  user?: Maybe<Safe>;
  limit: Scalars['BigInt'];
  limitPercentage: Scalars['BigInt'];
};

export type TrustChange = Event & {
  __typename?: 'TrustChange';
  id: Scalars['ID'];
  canSendTo: Scalars['String'];
  user: Scalars['String'];
  limitPercentage: Scalars['BigInt'];
};

export type TrustChange_Filter = {
  id?: Maybe<Scalars['ID']>;
  id_not?: Maybe<Scalars['ID']>;
  id_gt?: Maybe<Scalars['ID']>;
  id_lt?: Maybe<Scalars['ID']>;
  id_gte?: Maybe<Scalars['ID']>;
  id_lte?: Maybe<Scalars['ID']>;
  id_in?: Maybe<Array<Scalars['ID']>>;
  id_not_in?: Maybe<Array<Scalars['ID']>>;
  canSendTo?: Maybe<Scalars['String']>;
  canSendTo_not?: Maybe<Scalars['String']>;
  canSendTo_gt?: Maybe<Scalars['String']>;
  canSendTo_lt?: Maybe<Scalars['String']>;
  canSendTo_gte?: Maybe<Scalars['String']>;
  canSendTo_lte?: Maybe<Scalars['String']>;
  canSendTo_in?: Maybe<Array<Scalars['String']>>;
  canSendTo_not_in?: Maybe<Array<Scalars['String']>>;
  canSendTo_contains?: Maybe<Scalars['String']>;
  canSendTo_not_contains?: Maybe<Scalars['String']>;
  canSendTo_starts_with?: Maybe<Scalars['String']>;
  canSendTo_not_starts_with?: Maybe<Scalars['String']>;
  canSendTo_ends_with?: Maybe<Scalars['String']>;
  canSendTo_not_ends_with?: Maybe<Scalars['String']>;
  user?: Maybe<Scalars['String']>;
  user_not?: Maybe<Scalars['String']>;
  user_gt?: Maybe<Scalars['String']>;
  user_lt?: Maybe<Scalars['String']>;
  user_gte?: Maybe<Scalars['String']>;
  user_lte?: Maybe<Scalars['String']>;
  user_in?: Maybe<Array<Scalars['String']>>;
  user_not_in?: Maybe<Array<Scalars['String']>>;
  user_contains?: Maybe<Scalars['String']>;
  user_not_contains?: Maybe<Scalars['String']>;
  user_starts_with?: Maybe<Scalars['String']>;
  user_not_starts_with?: Maybe<Scalars['String']>;
  user_ends_with?: Maybe<Scalars['String']>;
  user_not_ends_with?: Maybe<Scalars['String']>;
  limitPercentage?: Maybe<Scalars['BigInt']>;
  limitPercentage_not?: Maybe<Scalars['BigInt']>;
  limitPercentage_gt?: Maybe<Scalars['BigInt']>;
  limitPercentage_lt?: Maybe<Scalars['BigInt']>;
  limitPercentage_gte?: Maybe<Scalars['BigInt']>;
  limitPercentage_lte?: Maybe<Scalars['BigInt']>;
  limitPercentage_in?: Maybe<Array<Scalars['BigInt']>>;
  limitPercentage_not_in?: Maybe<Array<Scalars['BigInt']>>;
};

export enum TrustChange_OrderBy {
  Id = 'id',
  CanSendTo = 'canSendTo',
  User = 'user',
  LimitPercentage = 'limitPercentage'
}

export type Trust_Filter = {
  id?: Maybe<Scalars['ID']>;
  id_not?: Maybe<Scalars['ID']>;
  id_gt?: Maybe<Scalars['ID']>;
  id_lt?: Maybe<Scalars['ID']>;
  id_gte?: Maybe<Scalars['ID']>;
  id_lte?: Maybe<Scalars['ID']>;
  id_in?: Maybe<Array<Scalars['ID']>>;
  id_not_in?: Maybe<Array<Scalars['ID']>>;
  canSendToAddress?: Maybe<Scalars['String']>;
  canSendToAddress_not?: Maybe<Scalars['String']>;
  canSendToAddress_gt?: Maybe<Scalars['String']>;
  canSendToAddress_lt?: Maybe<Scalars['String']>;
  canSendToAddress_gte?: Maybe<Scalars['String']>;
  canSendToAddress_lte?: Maybe<Scalars['String']>;
  canSendToAddress_in?: Maybe<Array<Scalars['String']>>;
  canSendToAddress_not_in?: Maybe<Array<Scalars['String']>>;
  canSendToAddress_contains?: Maybe<Scalars['String']>;
  canSendToAddress_not_contains?: Maybe<Scalars['String']>;
  canSendToAddress_starts_with?: Maybe<Scalars['String']>;
  canSendToAddress_not_starts_with?: Maybe<Scalars['String']>;
  canSendToAddress_ends_with?: Maybe<Scalars['String']>;
  canSendToAddress_not_ends_with?: Maybe<Scalars['String']>;
  canSendTo?: Maybe<Scalars['String']>;
  canSendTo_not?: Maybe<Scalars['String']>;
  canSendTo_gt?: Maybe<Scalars['String']>;
  canSendTo_lt?: Maybe<Scalars['String']>;
  canSendTo_gte?: Maybe<Scalars['String']>;
  canSendTo_lte?: Maybe<Scalars['String']>;
  canSendTo_in?: Maybe<Array<Scalars['String']>>;
  canSendTo_not_in?: Maybe<Array<Scalars['String']>>;
  canSendTo_contains?: Maybe<Scalars['String']>;
  canSendTo_not_contains?: Maybe<Scalars['String']>;
  canSendTo_starts_with?: Maybe<Scalars['String']>;
  canSendTo_not_starts_with?: Maybe<Scalars['String']>;
  canSendTo_ends_with?: Maybe<Scalars['String']>;
  canSendTo_not_ends_with?: Maybe<Scalars['String']>;
  userAddress?: Maybe<Scalars['String']>;
  userAddress_not?: Maybe<Scalars['String']>;
  userAddress_gt?: Maybe<Scalars['String']>;
  userAddress_lt?: Maybe<Scalars['String']>;
  userAddress_gte?: Maybe<Scalars['String']>;
  userAddress_lte?: Maybe<Scalars['String']>;
  userAddress_in?: Maybe<Array<Scalars['String']>>;
  userAddress_not_in?: Maybe<Array<Scalars['String']>>;
  userAddress_contains?: Maybe<Scalars['String']>;
  userAddress_not_contains?: Maybe<Scalars['String']>;
  userAddress_starts_with?: Maybe<Scalars['String']>;
  userAddress_not_starts_with?: Maybe<Scalars['String']>;
  userAddress_ends_with?: Maybe<Scalars['String']>;
  userAddress_not_ends_with?: Maybe<Scalars['String']>;
  user?: Maybe<Scalars['String']>;
  user_not?: Maybe<Scalars['String']>;
  user_gt?: Maybe<Scalars['String']>;
  user_lt?: Maybe<Scalars['String']>;
  user_gte?: Maybe<Scalars['String']>;
  user_lte?: Maybe<Scalars['String']>;
  user_in?: Maybe<Array<Scalars['String']>>;
  user_not_in?: Maybe<Array<Scalars['String']>>;
  user_contains?: Maybe<Scalars['String']>;
  user_not_contains?: Maybe<Scalars['String']>;
  user_starts_with?: Maybe<Scalars['String']>;
  user_not_starts_with?: Maybe<Scalars['String']>;
  user_ends_with?: Maybe<Scalars['String']>;
  user_not_ends_with?: Maybe<Scalars['String']>;
  limit?: Maybe<Scalars['BigInt']>;
  limit_not?: Maybe<Scalars['BigInt']>;
  limit_gt?: Maybe<Scalars['BigInt']>;
  limit_lt?: Maybe<Scalars['BigInt']>;
  limit_gte?: Maybe<Scalars['BigInt']>;
  limit_lte?: Maybe<Scalars['BigInt']>;
  limit_in?: Maybe<Array<Scalars['BigInt']>>;
  limit_not_in?: Maybe<Array<Scalars['BigInt']>>;
  limitPercentage?: Maybe<Scalars['BigInt']>;
  limitPercentage_not?: Maybe<Scalars['BigInt']>;
  limitPercentage_gt?: Maybe<Scalars['BigInt']>;
  limitPercentage_lt?: Maybe<Scalars['BigInt']>;
  limitPercentage_gte?: Maybe<Scalars['BigInt']>;
  limitPercentage_lte?: Maybe<Scalars['BigInt']>;
  limitPercentage_in?: Maybe<Array<Scalars['BigInt']>>;
  limitPercentage_not_in?: Maybe<Array<Scalars['BigInt']>>;
};

export enum Trust_OrderBy {
  Id = 'id',
  CanSendToAddress = 'canSendToAddress',
  CanSendTo = 'canSendTo',
  UserAddress = 'userAddress',
  User = 'user',
  Limit = 'limit',
  LimitPercentage = 'limitPercentage'
}

export type User = {
  __typename?: 'User';
  id: Scalars['ID'];
  safes: Array<Safe>;
  safeAddresses?: Maybe<Array<Scalars['String']>>;
};


export type UserSafesArgs = {
  skip?: Maybe<Scalars['Int']>;
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Safe_OrderBy>;
  orderDirection?: Maybe<OrderDirection>;
  where?: Maybe<Safe_Filter>;
};

export type User_Filter = {
  id?: Maybe<Scalars['ID']>;
  id_not?: Maybe<Scalars['ID']>;
  id_gt?: Maybe<Scalars['ID']>;
  id_lt?: Maybe<Scalars['ID']>;
  id_gte?: Maybe<Scalars['ID']>;
  id_lte?: Maybe<Scalars['ID']>;
  id_in?: Maybe<Array<Scalars['ID']>>;
  id_not_in?: Maybe<Array<Scalars['ID']>>;
  safes?: Maybe<Array<Scalars['String']>>;
  safes_not?: Maybe<Array<Scalars['String']>>;
  safes_contains?: Maybe<Array<Scalars['String']>>;
  safes_not_contains?: Maybe<Array<Scalars['String']>>;
  safeAddresses?: Maybe<Array<Scalars['String']>>;
  safeAddresses_not?: Maybe<Array<Scalars['String']>>;
  safeAddresses_contains?: Maybe<Array<Scalars['String']>>;
  safeAddresses_not_contains?: Maybe<Array<Scalars['String']>>;
};

export enum User_OrderBy {
  Id = 'id',
  Safes = 'safes',
  SafeAddresses = 'safeAddresses'
}

export type SafeAddressByOwnerQueryVariables = Exact<{
  address: Scalars['ID'];
}>;


export type SafeAddressByOwnerQuery = (
  { __typename?: 'Query' }
  & { users: Array<(
    { __typename?: 'User' }
    & Pick<User, 'id'>
    & { safes: Array<(
      { __typename?: 'Safe' }
      & Pick<Safe, 'id'>
    )> }
  )> }
);

export type SafeDetailsQueryVariables = Exact<{
  safeAddress: Scalars['ID'];
}>;


export type SafeDetailsQuery = (
  { __typename?: 'Query' }
  & { safes: Array<(
    { __typename?: 'Safe' }
    & Pick<Safe, 'id'>
    & { incoming: Array<(
      { __typename?: 'Trust' }
      & Pick<Trust, 'limit' | 'limitPercentage'>
      & { user?: Maybe<(
        { __typename?: 'Safe' }
        & Pick<Safe, 'id'>
      )> }
    )>, outgoing: Array<(
      { __typename?: 'Trust' }
      & Pick<Trust, 'limit' | 'limitPercentage'>
      & { canSendTo?: Maybe<(
        { __typename?: 'Safe' }
        & Pick<Safe, 'id'>
      )> }
    )>, balances: Array<(
      { __typename?: 'Balance' }
      & Pick<Balance, 'id' | 'amount'>
      & { token: (
        { __typename?: 'Token' }
        & Pick<Token, 'id'>
        & { owner: (
          { __typename?: 'Safe' }
          & Pick<Safe, 'id'>
        ) }
      ) }
    )> }
  )> }
);

export type TransfersQueryVariables = Exact<{
  safeAddress: Scalars['String'];
}>;


export type TransfersQuery = (
  { __typename?: 'Query' }
  & { notifications: Array<(
    { __typename?: 'Notification' }
    & Pick<Notification, 'time'>
    & { transfer?: Maybe<(
      { __typename?: 'Transfer' }
      & Pick<Transfer, 'from' | 'to' | 'amount'>
    )> }
  )> }
);


export const SafeAddressByOwnerDocument = gql`
    query safeAddressByOwner($address: ID!) {
  users(where: {id: $address}) {
    id
    safes {
      id
    }
  }
}
    `;
export const SafeDetailsDocument = gql`
    query safeDetails($safeAddress: ID!) {
  safes(where: {id: $safeAddress}) {
    id
    incoming(orderBy: limit, orderDirection: desc) {
      limit
      limitPercentage
      user {
        id
      }
    }
    outgoing(orderBy: limit, orderDirection: desc) {
      limit
      limitPercentage
      canSendTo {
        id
      }
    }
    balances(orderBy: amount, orderDirection: desc) {
      id
      amount
      token {
        id
        owner {
          id
        }
      }
    }
  }
}
    `;
export const TransfersDocument = gql`
    query transfers($safeAddress: String!) {
  notifications(orderBy: time, orderDirection: desc, where: {safe: $safeAddress, type: TRANSFER}) {
    time
    transfer {
      from
      to
      amount
    }
  }
}
    `;

export type SdkFunctionWrapper = <T>(action: () => Promise<T>) => Promise<T>;


const defaultWrapper: SdkFunctionWrapper = sdkFunction => sdkFunction();
export function getSdk(client: GraphQLClient, withWrapper: SdkFunctionWrapper = defaultWrapper) {
  return {
    safeAddressByOwner(variables: SafeAddressByOwnerQueryVariables): Promise<{ data?: SafeAddressByOwnerQuery | undefined; extensions?: any; headers: Headers; status: number; errors?: GraphQLError[] | undefined; }> {
        return withWrapper(() => client.rawRequest<SafeAddressByOwnerQuery>(print(SafeAddressByOwnerDocument), variables));
    },
    safeDetails(variables: SafeDetailsQueryVariables): Promise<{ data?: SafeDetailsQuery | undefined; extensions?: any; headers: Headers; status: number; errors?: GraphQLError[] | undefined; }> {
        return withWrapper(() => client.rawRequest<SafeDetailsQuery>(print(SafeDetailsDocument), variables));
    },
    transfers(variables: TransfersQueryVariables): Promise<{ data?: TransfersQuery | undefined; extensions?: any; headers: Headers; status: number; errors?: GraphQLError[] | undefined; }> {
        return withWrapper(() => client.rawRequest<TransfersQuery>(print(TransfersDocument), variables));
    }
  };
}
export type Sdk = ReturnType<typeof getSdk>;