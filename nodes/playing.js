var utils = require('../lib/utils.js');

module.exports = function(RED) {
  class PlayingNode {
    constructor(config) {
      RED.nodes.createNode(this, config);

      this.server = RED.nodes.getNode(config.server);
      utils.bindStateHandlers(this, this.server);

      if (!this.plex) {
        utils.updateNodeStatusFailed(this, 'plex not configured');
        return;
      }

      this.begin();
    }

    get plex() {
      return !!this.server ? this.server.plex : null;
    }

    begin() {
      this.plex.on('playing', (state, notification) => {
        const sessions = this.server.sessions;
        const sessionKey = notification['sessionKey'];

        sessions.fetch(sessionKey).then((session) => {
            const msg = {
                payload: state,
                plex: notification,
                session: session
            };

            if (session['prevState'] !== state) {
                this.send(msg);
                session['prevState'] = state;
            }

            if (state === 'stopped') {
                sessions.delete(sessionKey);
            }
        }).catch((reason) => {
            this.warn(`failed to fetch session details from Plex: ${reason}`);
        });
      });
    }
  }

  RED.nodes.registerType('plex-ws-playing', PlayingNode);
};
