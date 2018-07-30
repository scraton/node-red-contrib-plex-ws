const Client = require('../lib/client');

module.exports = function(RED) {
  class ServerNode {
    constructor(n) {
      RED.nodes.createNode(this, n);

      this.hostname = n.hostname;
      this.port = parseInt(n.port);
      this.secure = n.secure;
      this.token = this.credentials.token;
      this.nodes = [];

      if (!this.hostname) {
        this.warn('plex hostname is not set');
        return;
      }

      if (isNaN(this.port)) {
        this.warn('plex port is not a number');
        return;
      }

      if (!this.token) {
        this.warn('plex token is not set');
        return;
      }

      this.client = new Client({
        hostname: this.hostname,
        port: this.port,
        secure: this.secure,
        token: this.token
      });

      this.client.on('close', reason => this.onClose(reason));
      this.client.on('unauthorized', () => this.onUnauthorized());
    }

    get plex() {
      return this.client;
    }

    onClose(reason) {
      this.warn(`plex disconnected: ${reason}`);
    }

    onUnauthorized() {
      this.warn(`plex authentication failed`);
    }
  }

  RED.nodes.registerType("plex-ws-server", ServerNode, {
    credentials: {
      token: { type: "text" }
    }
  });
};
