import { SwaggerOptions } from '@fastify/swagger';

const swaggerOpts: SwaggerOptions = {
  routePrefix: '/doc',
  openapi: {
    info: {
      title: 'Wallpaper changer api',
      description: 'api documentation',
      version: '0.1.0',
    },
    
  },
  uiConfig: {
    docExpansion: 'full',
    deepLinking: false,
  },
  uiHooks: {
    onRequest: function (request, reply, next) {
      next();
    },
    preHandler: function (request, reply, next) {
      next();
    },
  },
  staticCSP: true,
  transformStaticCSP: header => header,
  exposeRoute: true,
};
export default swaggerOpts;
