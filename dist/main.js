"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const path_1 = require("path");
const app_module_1 = require("./app.module");
const validation_filter_1 = require("./validation.filter");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors();
    app.useStaticAssets((0, path_1.join)(__dirname, '..', 'public'));
    app.getHttpAdapter().get('/', (_req, res) => {
        res.sendFile((0, path_1.join)(__dirname, '..', 'public', 'index.html'));
    });
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalFilters(new validation_filter_1.ValidationFilter());
    const requestedPort = Number(process.env.PORT) || 3000;
    const portsToTry = [requestedPort, requestedPort + 1, requestedPort + 2, requestedPort + 3];
    for (const port of portsToTry) {
        try {
            await app.listen(port);
            console.log(`Application listening on port ${port}`);
            return;
        }
        catch (error) {
            const err = error;
            if (err.code !== 'EADDRINUSE') {
                throw error;
            }
        }
    }
    throw new Error('Unable to start application: no available port found.');
}
bootstrap();
