import * as os from 'node:os';
import * as path from 'node:path';

/**
 * Resolves storage independently from the shell's current working directory.
 * This keeps the database and encrypted vault together whether the API is
 * started from the workspace root or from apps/api.
 */
export function getDataDirectory(): string {
  if (process.env['DATA_DIR']) {
    return path.resolve(process.env['DATA_DIR']);
  }

  if (process.env['VERCEL']) {
    return '/tmp/docvault_data';
  }

  if (process.env['NODE_ENV'] === 'test') {
    return path.join(os.tmpdir(), `docvault-x-tests-${process.pid}`);
  }

  return path.resolve(__dirname, '../../data');
}
