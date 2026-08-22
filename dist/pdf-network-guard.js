import http from "node:http";
import https from "node:https";
import net from "node:net";
import tls from "node:tls";
export class ExternalFetchAttemptError extends Error {
    constructor() {
        super("PDF_EXTERNAL_FETCH_ATTEMPT");
        this.name = "ExternalFetchAttemptError";
    }
}
export function installPdfNetworkGuards() {
    const modules = { http, https, net, tls };
    const originals = {
        fetch: globalThis.fetch,
        httpGet: modules.http.get,
        httpRequest: modules.http.request,
        httpsGet: modules.https.get,
        httpsRequest: modules.https.request,
        netConnect: modules.net.connect,
        netCreateConnection: modules.net.createConnection,
        tlsConnect: modules.tls.connect,
    };
    const blocked = (() => {
        throw new ExternalFetchAttemptError();
    });
    globalThis.fetch = blocked;
    modules.http.get = blocked;
    modules.http.request = blocked;
    modules.https.get = blocked;
    modules.https.request = blocked;
    modules.net.connect = blocked;
    modules.net.createConnection = blocked;
    modules.tls.connect = blocked;
    return () => {
        globalThis.fetch = originals.fetch;
        modules.http.get = originals.httpGet;
        modules.http.request = originals.httpRequest;
        modules.https.get = originals.httpsGet;
        modules.https.request = originals.httpsRequest;
        modules.net.connect = originals.netConnect;
        modules.net.createConnection = originals.netCreateConnection;
        modules.tls.connect = originals.tlsConnect;
    };
}
