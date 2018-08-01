const PlexApi = require('plex-api');
const PlexSocket = require('../lib/plex_socket');
const SessionStore = require('../lib/session_store');

module.exports = function(RED) {
  class ServerNode {
    constructor(n) {
      RED.nodes.createNode(this, n);

      this.hostname = n.hostname;
      this.port = parseInt(n.port);
      this.timeout = parseInt(n.timeout);
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

      this.api = new PlexApi({
        hostname: this.hostname,
        port: this.port,
        timeout: this.timeout,
        authenticator: {
          authenticate: (plexApi, cb) => {
            cb(null, this.token)
          }
        }
      });

      this.socket = new PlexSocket({
        hostname: this.hostname,
        port: this.port,
        secure: this.secure,
        token: this.token
      });

      this.sessions = new SessionStore(this.api);

      this.socket.on('close', (code, reason) => this.onPlexClose(code, reason));
      this.socket.on('unauthorized', () => this.onPlexUnauthorized());
      this.socket.on('error', (err) => this.onPlexError(err));
      this.socket.on('pong-timeout', () => this.onPlexPongTimeout());

      this.on('close', () => this.onClose());
    }

    get plex() {
      return this.socket;
    }

    onClose() {
      this.socket.close();
      this.socket = null;
    }

    onPlexPongTimeout() {
      this.warn('plex connection timeout, reconnecting');
    }

    onPlexClose(code, reason) {
      this.warn(`plex disconnected: ${code} - ${reason}`);
    }

    onPlexUnauthorized() {
      this.warn(`plex authentication failed`);
    }

    onPlexError(err) {
      this.warn(`plex error: ${err}`);
    }
  }

  RED.nodes.registerType("plex-ws-server", ServerNode, {
    credentials: {
      token: { type: "text" }
    }
  });
};
