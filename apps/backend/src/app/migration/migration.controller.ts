import { Controller, Post, Body, Get } from '@nestjs/common';
import { MigrationService } from './migration.service';
import { ImportDataDto } from './dto/import-data.dto';

@Controller('migration')
export class MigrationController {
  constructor(private readonly migrationService: MigrationService) {}

  @Post('import')
  importData(@Body() data: ImportDataDto) {
    return this.migrationService.importData(data);
  }
}
