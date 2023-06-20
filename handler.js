import { resolve } from 'node:path'
import fs from 'node:fs'

function find (obj) {
    if (typeof obj === 'object') {
        if (obj.name === '@vituum/vite-plugin-latte') {
            return obj
        } else {
            for (const key in obj) {
                const result = find(obj[key])

                if (result !== null) {
                    return result
                }
            }
        }
    }

    return null
}

const DEFAULT_CONFIG_FILES = [
    'vite.config.js',
    'vite.config.mjs',
    'vite.config.ts',
    'vite.config.cjs',
    'vite.config.mts',
    'vite.config.cts'
]

let resolvedPath

for (const filename of DEFAULT_CONFIG_FILES) {
    const filePath = resolve(process.cwd(), filename)
    if (!fs.existsSync(filePath)) continue

    resolvedPath = filePath
    break
}

const vite = (await import(resolvedPath)).default
let params = JSON.parse(process.argv[4])
const name = process.argv[2]
const type = process.argv[3]

params = params.map(value => Buffer.from(value, 'base64').toString('utf-8'))

const output = await find(vite.plugins)._options[type][name](...params)

if (output) {
    console.log(Buffer.from(output.toString(), 'utf-8').toString('base64'))
}
