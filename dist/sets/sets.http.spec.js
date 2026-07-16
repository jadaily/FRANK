"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const http = __importStar(require("http"));
const sets_http_1 = require("./sets.http");
describe('set logging HTTP endpoint', () => {
    let server;
    let port;
    beforeEach(async () => {
        server = (0, sets_http_1.createSetLogServer)();
        await new Promise((resolve) => {
            server.listen(0, () => resolve());
        });
        port = server.address().port;
    });
    afterEach(async () => {
        await new Promise((resolve, reject) => {
            server.close((error) => (error ? reject(error) : resolve()));
        });
    });
    it('accepts a POST request and returns the rating update payload', async () => {
        const response = await new Promise((resolve, reject) => {
            const req = http.request({
                hostname: '127.0.0.1',
                port,
                path: '/sets',
                method: 'POST',
                headers: { 'content-type': 'application/json' },
            }, (res) => {
                let body = '';
                res.on('data', (chunk) => {
                    body += chunk;
                });
                res.on('end', () => resolve({ statusCode: res.statusCode ?? 0, body }));
            });
            req.on('error', reject);
            req.write(JSON.stringify({
                userId: 'user-1',
                exercise: 'squat',
                weight: 225,
                reps: 5,
                sex: 'male',
                bodyweightKg: 82.5,
            }));
            req.end();
        });
        expect(response.statusCode).toBe(200);
        expect(response.body).toContain('estimatedOneRepMax');
        expect(response.body).toContain('1500.9');
    });
});
