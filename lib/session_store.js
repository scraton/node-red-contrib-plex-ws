class SessionStore {
    constructor(plexApi) {
        this.plexApi = plexApi;
        this.cache = {};
    }

    fetchAll() {
        return new Promise((resolve, reject) => {
            console.log('fetching plex sessions via api');

            this.plexApi.query('/status/sessions').then((response) => {
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
                })
                .catch(err => reject(err));
        });
    }

    fetch(sessionKey) {
        return new Promise((resolve, reject) => {
            if (this.cache[sessionKey]) {
                resolve(this.cache[sessionKey]);
            } else {
                this.fetchAll()
                    .then(cache => resolve(cache[sessionKey]))
                    .catch(err => reject(err));
            }
        });
    }

    delete(sessionKey) {
        delete this.cache[sessionKey];
    }
}

module.exports = SessionStore;
