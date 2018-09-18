class SessionStore {
    constructor(plexApi) {
        this.plexApi = plexApi;
        this.cache = {};
    }

    fetchAll() {
        return new Promise((resolve, reject) => { // eslint-disable-line no-undef
            this.plexApi.query('/status/sessions')
                .then((response) => {
                    if (response['MediaContainer'] && response['MediaContainer']['size'] > 0) {
                        const container = response['MediaContainer'];
                        const sessions = !!container && response['MediaContainer']['Metadata'];

                        if (sessions && sessions.length) {
                            const cache = {};

                            sessions.forEach((session) => {
                                const sessionKey = session['sessionKey'];
                                cache[sessionKey] = session;
                            });

                            this.cache = cache;
                            return resolve(cache);
                        }
                    }

                    reject();
                });
        });
    }

    fetch(sessionKey) {
        return new Promise((resolve) => { // eslint-disable-line no-undef
            if (this.cache[sessionKey]) {
                resolve(this.cache[sessionKey]);
            } else {
                this.fetchAll().then(cache => resolve(cache[sessionKey]));
            }
        });
    }

    delete(sessionKey) {
        delete this.cache[sessionKey];
    }
}

module.exports = SessionStore;
