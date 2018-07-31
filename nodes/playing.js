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

      this.lastState = null;
      this.begin();
    }

    get plex() {
      return !!this.server ? this.server.plex : null;
    }

    begin() {
      this.plex.on('playing', (state, notification) => {
        if (state !== this.lastState) {
            const msg = { payload: state, plex: notification };

            this.lastState = state;
            this.send(msg);
        }
      });
    }
  }

  RED.nodes.registerType('plex-ws-playing', PlayingNode);
};
