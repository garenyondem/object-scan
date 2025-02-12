import fs from 'smart-fs';
import path from 'path';
import genTable from './benchmark/gen-table.js';

const execute = async () => fs.smartWrite(
  path.join(fs.dirname(import.meta.url), 'benchmark', 'result.md'),
  await genTable()
);
await execute();
