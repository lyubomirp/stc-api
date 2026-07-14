import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { CliModule } from './modules/cli.module';
import { ImportService } from './services/import.service';

async function runImport(): Promise<void> {
  const app = await NestFactory.createApplicationContext(CliModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const reports = await app.get(ImportService).refreshFromRemote();
    const rows = reports.reduce((total, r) => total + r.imported, 0);

    Logger.log(
      `Imported ${rows} rows from ${reports.length} files`,
      'Cli',
    );
  } finally {
    await app.close();
  }
}

async function main(): Promise<void> {
  const command = process.argv[2] ?? 'import';

  if (command !== 'import') {
    Logger.error(
      `Unknown command '${command}'. Available: import`,
      undefined,
      'Cli',
    );
    process.exit(1);
  }

  await runImport();
}

main().catch((err) => {
  Logger.error(err.message, err.stack, 'Cli');
  process.exit(1);
});
