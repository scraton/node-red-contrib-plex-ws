function bindStateHandlers(node, server) {
    const plex = !!server ? server.plex : null;

    if (plex) {
        plex.on('open', () => updateNodeStatusSuccess(node));
        plex.on('close', () => updateNodeStatusFailed(node, 'disconnected'));
        plex.on('error', () => updateNodeStatusFailed(node, 'error'));
        plex.on('unauthorized', () => updateNodeStatusFailed(node, 'unauthorized'));
        plex.on('pong-timeout', () => updateNodeStatusPending(node, 'reconnecting'));
    }
}

function updateNodeStatus(node, fill, shape, msg) {
    node.status({ fill: fill, shape: shape, text: msg });
}

function updateNodeStatusSuccess(node, msg='connected') {
    updateNodeStatus(node, 'green', 'dot', msg);
}

function updateNodeStatusPending(node, msg) {
    updateNodeStatus(node, 'yellow', 'ring', msg);
}

function updateNodeStatusFailed(node, msg) {
    updateNodeStatus(node, 'red', 'ring', msg);
}

module.exports = {
    bindStateHandlers: bindStateHandlers,
    updateNodeStatus: updateNodeStatus,
    updateNodeStatusSuccess: updateNodeStatusSuccess,
    updateNodeStatusFailed: updateNodeStatusFailed,
    updateNodeStatusPending: updateNodeStatusPending,
};
