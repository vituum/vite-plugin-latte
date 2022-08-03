import { resolve } from 'path'

const vite = (await import(resolve(process.cwd(), 'vite.config.js'))).default
const params = JSON.parse(process.argv[2])
const name = params[0]

params.shift()

vite.plugins.filter(({ name }) => name === 'vite-plugin-latte')[0]._params.filters[name](...params)
