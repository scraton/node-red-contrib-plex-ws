var utils = require('../lib/utils.js');

module.exports = function(RED) {
    class PlayingNode {
        constructor(config) {
            RED.nodes.createNode(this, config);

            this.allowUpdates = !!config.allowUpdates;
            this.lastKnownState = null;

            this.filters = config.filters || [];
            this.filters.sort((a, b) => a.idx > b.idx ? 1 : a.idx < b.idx ? -1 : 0);

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

        castType(value, type) {
            if (Array.isArray(value)) {
                return value.map(v => type(v));
            } else {
                return type(value);
            }
        }

        matchesFilters(session) {
            let match = true;

            this.filters.forEach((filter) => {
                let sessionValue = session;
                let filterValue = filter.value;
                let castType = String;
                let comparator;

                const keyParts = filter.key.split('.');
                keyParts.forEach((key) => {
                    if (Array.isArray(sessionValue)) {
                        sessionValue = sessionValue.map(v => v[key]);
                    } else {
                        sessionValue = sessionValue[key];
                    }
                });
                
                switch (filter.valueType) {
                case 'str':  castType = String; break;
                case 'num':  castType = Number; break;
                case 'bool': castType = Boolean; break;
                default:     castType = String; break;
                }

                sessionValue = this.castType(sessionValue, castType);
                filterValue = this.castType(filterValue, castType);

                switch (filter.operator) {
                case 'eq':  comparator = v => (filterValue == v); break;
                case 'neq': comparator = v => (filterValue != v); break;
                case 'lt':  comparator = v => (filterValue < v); break;
                case 'lte': comparator = v => (filterValue <= v); break;
                case 'gt':  comparator = v => (filterValue > v); break;
                case 'gte': comparator = v => (filterValue >= v); break;
                }

                if (Array.isArray(sessionValue)) {
                    match = match && sessionValue.some(comparator);
                } else {
                    match = match && comparator(sessionValue);
                }
            });

            return match;
        }

        begin() {
            this.plex.on('playing', (state, notification) => {
                const sessions = this.server.sessions;
                const sessionKey = notification['sessionKey'];

                sessions.fetch(sessionKey)
                    .then((session) => {
                        const msg = {
                            payload: state,
                            plex: notification,
                            session: session
                        };

                        if (session && (this.allowUpdates || this.lastKnownState !== state)) {
                            if (this.matchesFilters(session)) {
                                this.send(msg);
                            }

                            this.lastKnownState = state;
                        }

                        if (state === 'stopped') {
                            sessions.delete(sessionKey);
                        }
                    })
                    .catch((err) => {
                        this.warn(`failed to fetch session details from plex: ${err}`);
                    });
            });
        }
    }

    RED.nodes.registerType('plex-ws-playing', PlayingNode);
};
