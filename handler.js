import test from './vite.config.js'

const name = 'asd'

console.log(test.plugins.filter(({ name }) => name === 'vite-plugin-latte')[0]._params.filters[name].toString())
