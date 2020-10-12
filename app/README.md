# Svelte + TS + Tailwind app

This is a project template for [Svelte](https://svelte.dev) apps. It lives at https://github.com/colinbate/svelte-ts-tailwind-template and is based on the official Svelte template with TypeScript pre-enabled and Tailwind CSS configured.

To create a new project based on this template using [degit](https://github.com/Rich-Harris/degit):

```bash
npx degit colinbate/svelte-ts-tailwind-template svelte-app
cd svelte-app
```

*Note that you will need to have [Node.js](https://nodejs.org) installed.*

## Get started
.env file contents:
```
# Remove or comment out this line when in production
DEBUG=true

# SMTP Settings for the server that sends the magic-login mails
SMTP_PASS=
SMTP_SERVER=mail.gandi.net
SMPT_PORT=587
SMTP_SECURE=false
SMTP_USER=team@omo.earth

# Postgres host
POSTGRES_HOST=postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=omo-auth

#
# Proxy configuration
#
# The protocol that should be used in all server-generated links (in e-mail tenplates etc.)
PROXY_PROTOCOL=http://
# The docker-internal DNS name of the proxy server
PROXY_DOMAIN=proxy
# The docker-internal listener port of the proxy server
PROXY_PORT=80

# The domain that shoulc be used in all server-generated links (in e-mail tenplates etc.)
PROXY_EXTERN_DOMAIN=omo.local
# The port that shoulc be used in all server-generated links (in e-mail tenplates etc.)
PROXY_EXTERN_PORT=8080

# The path to the auth-service on the omo domain
PROXY_SERVICE_STATIC_PATH=static
# The path to the auth-service on the omo domain
PROXY_SERVICE_AUTH_PATH=auth
# The path to the auth-service on the omo domain
PROXY_SERVICE_IDENTITY_PATH=identity
# The path to the app on the omo domain (empty means that this is at the root level of the domain '/')
PROXY_SERVICE_APP_PATH=

#
# Static content server configuration
#
STATIC_PROTOCOL=http://
STATIC_DOMAIN=static
STATIC_PORT=80

#
# App configuration
#
APP_PROTOCOL=http://
APP_DOMAIN=app
APP_PORT=80

#
# Auth service configuration
#
AUTH_PROTOCOL=http://
AUTH_DOMAIN=auth
AUTH_PORT=80
AUTH_CORS_ORIGINS=http://omo.local:8080;http://localhost:5000;
# The AUTH_APP_REDIRECT variable is set in the docker-compose file
# because the URL value contains a hash that is interpreted as comment in .env files.
# AUTH_APP_REDIRECT=http://omo.local:5000/#!/sign-in/onetime

AUTH_JWT_EXP_IN_SEC=60
AUTH_ROTATE_EVERY_N_SECONDS=300
AUTH_GRAPHQL_SCHEMA=server/src/api/api-schema.graphql

#
# Keystore service configuration
#
IDENTITY_PROTOCOL=http://
IDENTITY_DOMAIN=identity
IDENTITY_PORT=80
IDENTITY_CORS_ORIGINS=http://omo.local:8080;http://localhost:5000;

IDENTITY_GRAPHQL_SCHEMA=identity/server/src/api/api-schema.graphql
```



Install the dependencies...

```bash
cd svelte-app
npm install
```

...then start [Rollup](https://rollupjs.org):

```bash
npm run dev
```

Navigate to [localhost:5000](http://localhost:5000). You should see your app running. Edit a component file in `src`, save it, and reload the page to see your changes.

By default, the server will only respond to requests from localhost. To allow connections from other computers, edit the `sirv` commands in package.json to include the option `--host 0.0.0.0`.


## Building and running in production mode

To create an optimised version of the app:

```bash
npm run build
```

You can run the newly built app with `npm run start`. This uses [sirv](https://github.com/lukeed/sirv), which is included in your package.json's `dependencies` so that the app will work when you deploy to platforms like [Heroku](https://heroku.com).


## Single-page app mode

By default, sirv will only respond to requests that match files in `public`. This is to maximise compatibility with static fileservers, allowing you to deploy your app anywhere.

If you're building a single-page app (SPA) with multiple routes, sirv needs to be able to respond to requests for *any* path. You can make it so by editing the `"start"` command in package.json:

```js
"start": "sirv public --single"
```

## Using TypeScript

TypeScript has already been enabled in this template.

