Facebook Messenger Extensions
=============================

This repository contains code which runs the ABC News Facebook Messenger extension.

The main component is an Express app which (at this point) serves [the page](https://fbmessenger.abcnewsdigital.com/groupshare) which loads in messenger when the ABC News icon is selected from the 'draw' in Messenger.

There are, however, a number of other components which make up the system.

[nginx proxy](https://github.com/jwilder/nginx-proxy) and the [lets-encrypt companion](https://github.com/JrCs/docker-letsencrypt-nginx-proxy-companion)
--------------------------------------------------------------------------------------------------------------------------------------------------------

The Docker host which runs this service is configured with an nginx proxy which takes all requests on ports 80 and 443 and routes them to the correct docker container depending on the domain name being requested.

The lets-encrypt companion takes care of issuing and installing valid security certificates.

See more information about the setup in `docker-compose.yml`.

While these containers are currently specified as part of the docker-compose config, they may be moved out at some point as they are independent and don't depend on anything in this repo (but this project *does* depend on them, which is why they're currently defined in the compose file).

Camo image proxy
----------------

Because ABC News image assets are not yet served over an HTTPS connection, it was necessary to proxy all images. This is done with a separate docker container running [camo](https://github.com/atmos/camo).

Development
===========

Local development of the Express app is possible by cloning this repo and:

```
$ npm i -g gulp
$ npm i
$ gulp
```

You should find the output at http://localhost:3000/groupshare

To get the images loading you will need to set the `CAMO_KEY` environment variable. See the `cridentials.blank.env` file for all other env vars of relevance. This is where all the secrets are kept, so talk to someone relevant if you need the actual secrets.

Deployment
----------

To deploy the app you'll need all the relevant keys to access the docker host. You can use [machine-share](https://www.npmjs.com/package/machine-share) to import the keys (talk to someone who has them if you need them).

After you've imported the machine, you should use `docker-machine` and `docker-compose` for deployments.

```
$ eval $(docker-machine env facebook-groups-messenger-bot)
docker-compose up -d
```

This should build the relevant images defined in `docker-compose.yml` (if necessary) and boot them.

You may want to do these things separately via `docker-compose build <image-name>` and `docker-compose up -d <image-name>`.

See the [docker-compose](https://docs.docker.com/compose/reference/overview/) documentation for more details.
