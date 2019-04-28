const promiseRetry = require('promise-retry');

class SessionStore {
    constructor(plexApi) {
        this.plexApi = plexApi;
        this.cache = {};
        this.fetchAllPromise = null;
        this.retryOptions = {
            retries: 10,
            minTimeout: 500,
            maxTimeout: 1000,
            randomize: true,
        };
    }

    fetchAll() {
        if (this.fetchAllPromise === null) {
            this.fetchAllPromise = promiseRetry((retry) => {
                return this.plexApi
                    .query('/status/sessions')
                    .then((response) => {
                        if (response['MediaContainer']) {
                            const { MediaContainer } = response;

                            if (MediaContainer['size'] > 0) {
                                const container = response['MediaContainer'];
                                const sessions = !!container && response['MediaContainer']['Metadata'];

                                if (sessions && sessions.length) {
                                    const cache = {};

                                    sessions.forEach((session) => {
                                        const sessionKey = session['sessionKey'];
                                        cache[sessionKey] = session;
                                    });

                                    this.cache = cache;
                                    this.fetchAllPromise = null;

                                    return cache;
                                }
                            } else {
                                return retry();
                            }
                        }
                    })
                    .catch(retry);
            }, this.retryOptions);
        }

        return this.fetchAllPromise;
    }

    fetch(sessionKey) {
        return new Promise((resolve, reject) => { // eslint-disable-line no-undef
            if (this.cache[sessionKey]) {
                resolve(this.cache[sessionKey]);
            } else {
                this.fetchAll()
                    .then(cache => resolve(cache[sessionKey]))
                    .catch(reject);
            }
        });
    }

    delete(sessionKey) {
        delete this.cache[sessionKey];
    }
}

module.exports = SessionStore;
