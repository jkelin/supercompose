import { Controller, Get, Inject } from '@nestjs/common';
import { DirectorService } from './director.service';

@Controller()
export class DirectorController {
  constructor(@Inject() private readonly director: DirectorService) {}

  @Get('/reconciliate')
  async reconciliate() {
    await this.director.reconciliate();
  }
}
