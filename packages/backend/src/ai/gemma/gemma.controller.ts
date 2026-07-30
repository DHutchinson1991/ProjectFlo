import { Body, Controller, Get, Post, UseGuards, ValidationPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GemmaService } from './gemma.service';
import { GemmaChatRequestDto } from './dto/chat-request.dto';

@Controller('api/ai/gemma')
@UseGuards(AuthGuard('jwt'))
export class GemmaController {
  constructor(private readonly gemmaService: GemmaService) {}

  @Post('chat')
  chat(
    @Body(new ValidationPipe({ transform: true }))
    dto: GemmaChatRequestDto,
  ) {
    return this.gemmaService.chat(dto);
  }

  @Get('models')
  listModels() {
    return this.gemmaService.listModels();
  }
}
