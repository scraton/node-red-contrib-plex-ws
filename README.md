node-red-contrib-plex-ws
=====================================

Nodes for connecting to Plex with real time notifications.

**NOTE:** The Plex WebSocket API is not documented and probably not intended for third-party use. Breaking changes may occurr during Plex upgrades.

## Getting Started

This assumes you have [node-red](http://nodered.org/) already installed and working.

```bash
cd ~/.node-red
npm install node-red-contrib-plex-ws
sudo service nodered restart
```

## Configuration

You will need to get your `X-Plex-Token` in order to configure the nodes. See ["Finding an authentication token / X-Plex-Token"](https://support.plex.tv/articles/204059436-finding-an-authentication-token-x-plex-token/).

## Included Nodes

You can view detailed documentation for the nodes via the node-red info pane. Just select a node and start readin'.

* [playing](#playing)
* [notification](#notification)

### playing

Receive notification when the playing state of a session changes. Add filters for specific conditions (e.g. media type, player, user, etc).

### notification

Receive all Plex notifications.

---
## Development

An environment with node-red can be easily spun up using Docker and Docker Compose.

1. Clone this repository:        `git clone https://github.com/scraton/node-red-contrib-plex-ws`
1. Install node dependencies:    `cd node-red-contrib-plex-ws && yarn install`
1. Start the docker environment: `yarn run dev`

---
## Credits

Gotta give credit where credit is due.

* [node-red](https://github.com/node-red/node-red)
* [node-red-contrib-plex](https://github.com/halkeye/node-red-contrib-plex) - Uses official APIs via polling, more stable option
