import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { GraphModule } from './graph/graph.module.js';
import { RoutingModule } from './routing/routing.module.js';

@Module({
  imports: [GraphModule, RoutingModule],
  controllers: [AppController],
})
export class AppModule {}
