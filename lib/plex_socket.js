const EventEmitter = require('events');
const WebSocket = require('ws');

const NOTIFICATION_TYPE_PLAYING = 'playing';

function notification(payload) {
    return !!payload && payload['NotificationContainer'];
}

class PlexSocket extends EventEmitter {
    constructor({
        hostname,
        port = 32400,
        token,
        secure = false,
        reconnectInterval = 4000,
        reconnectMaxRetries = Infinity,
        autoConnect = true
    }={}) {
        super()

        this.hostname = hostname;
        this.port = port;
        this.token = token;
        this.secure = secure;
        this.reconnectInterval = reconnectInterval;
        this.reconnectMaxRetries = reconnectMaxRetries;
        this.autoConnect = autoConnect;

        this.shouldClose = false;
        this.retries = 0;
        this.socket = null;

        if (this.autoConnect) {
            this.connect()
        }
    }

    buildAddress() {
        const protocol = this.https ? 'wss' : 'ws';
        return `${protocol}://${this.hostname}:${this.port}/:/websockets/notifications`;
    }

    connect() {
        if (this.retries++ >= this.reconnectMaxRetries) {
            this.emit('reconnect-max-retries', this.reconnectMaxRetries);
        }

        try {
            const protocol = { headers: { 'X-Plex-Token': this.token } };
            this.socket = new WebSocket(this.buildAddress(), protocol);
        } catch (err) {
            this.onClose(err);
            throw err;
        }

        this.socket.on('open', data => this.onOpen(data));
        this.socket.on('message', data => this.onMessage(data));
        this.socket.on('error', err => this.onError(err));
        this.socket.on('unexpected-response', (req, res) => this.onUnexpectedResponse(req, res));
        this.socket.on('close', reason => this.onClose(reason));
    }

    close() {
        this.shouldClose = true;
        this.socket.close();
        this.socket = null;
    }

    parseData(data) {
        try {
            return JSON.parse(data);
        } catch (err) {
            return this.emit('error', err);
        }
    }

    onOpen(data) {
        this.retries = 0;
        this.emit('open', data);
    }

    onClose(reason) {
        if (!this.shouldClose) {
            setTimeout(() => this.connect(), this.reconnectInterval);
        } else {
            this.emit('close', reason);
        }
    }

    onMessage(data) {
        const payload = this.parseData(data);

        if (payload) {
            this.emit('message', payload);

            const notif = notification(payload);
            !!notif && this.onNotification(notif);
        }
    }

    onNotification(notif) {
        this.emit('notification', notif);

        switch (notif.type) {
            case NOTIFICATION_TYPE_PLAYING:
                this.onPlaying(notif);
                break;
        }
    }

    onPlaying(notif) {
        const payload = notif['PlaySessionStateNotification'];

        if (payload && payload.length) {
            payload.forEach((playingNotif) => {
                this.emit('playing', playingNotif.state, playingNotif);
            });
        } else {
            this.emit('error', new Error('expected playing notification to have PlaySessionStateNotification'));
        }
    }

    onUnexpectedResponse(req, res) {
        if (res && res.statusCode == 401) {
            return this.emit('unauthorized'), req, res;
        }

        return this.emit('unexpected-response', req, res);
    }

    onError(err) {
        this.emit('error', err);
    }
}

module.exports = PlexSocket;
