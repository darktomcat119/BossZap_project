import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriberCategory } from '../../database/entities/subscriber-category.entity';
import { SubscriberCategoriesService } from './subscriber-categories.service';
import { SubscriberCategoriesController } from './subscriber-categories.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SubscriberCategory])],
  controllers: [SubscriberCategoriesController],
  providers: [SubscriberCategoriesService],
  exports: [SubscriberCategoriesService],
})
export class SubscriberCategoriesModule {}
