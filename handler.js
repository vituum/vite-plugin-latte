import vite from './vite.config.js'

const params = JSON.parse(process.argv[2])

vite.plugins.filter(({ name }) => name === 'vite-plugin-latte')[0]._params.filters[params.name](params.value, params.p1, params.p2, params.p3, params.p4)
