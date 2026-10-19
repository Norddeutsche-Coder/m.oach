import { readdir, readFile } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const outputDirectory = fileURLToPath(new URL('../dist/', import.meta.url))
const testApiName = '__planGoldenMaster'

async function javascriptFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = await Promise.all(
    entries.map((entry) => {
      const path = join(directory, entry.name)
      return entry.isDirectory() ? javascriptFiles(path) : path
    }),
  )
  return files.flat().filter((file) => ['.js', '.mjs', '.cjs'].includes(extname(file)))
}

let files
try {
  files = await javascriptFiles(outputDirectory)
} catch (error) {
  if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
    console.error('Production bundle not found. Run npm run build before this check.')
    process.exit(1)
  }
  throw error
}

for (const file of files) {
  if ((await readFile(file, 'utf8')).includes(testApiName)) {
    console.error(`Test-only plan API found in production bundle: ${file}`)
    process.exit(1)
  }
}

console.log(`Checked ${files.length} JavaScript bundle files: test-only plan API is absent.`)
