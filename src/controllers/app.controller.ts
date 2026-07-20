import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  health(): { status: string } {
    return { status: 'ok' };
  }
}
