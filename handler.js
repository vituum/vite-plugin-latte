import { resolve } from 'path'

const vite = (await import(resolve(process.cwd(), 'vite.config.js'))).default
let params = JSON.parse(process.argv[4])
const name = process.argv[2]
const type = process.argv[3]

params = params.map(value => Buffer.from(value, 'base64').toString('utf-8'))

const output = await vite.plugins.find(plugin => plugin[0]?.name === '@vituum/vite-plugin-latte')[0]._options[type][name](...params)

if (output) {
    console.log(Buffer.from(output.toString(), 'utf-8').toString('base64'))
}
