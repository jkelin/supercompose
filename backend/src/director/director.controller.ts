import { Controller, Get } from '@nestjs/common';
import { DirectorService } from './director.service';

@Controller()
export class DirectorController {
  constructor(private readonly director: DirectorService) {}

  @Get('/reconciliate')
  async reconciliate() {
    await this.director.reconciliate();
  }
}
