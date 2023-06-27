import vituum from 'vituum'
import { resolve } from 'path'
import latte from './index.js'

export default {
    plugins: [
        vituum(),
        latte({
            filters: {
                icon: 'latte/IconFilter.php',
                hello: (value, there) => {
                    return 'Hello ' + there + ' ' + value
                }
            },
            globals: {
                template: resolve(process.cwd(), 'playground/templates/Layout/Main.latte'),
                srcPath: resolve(process.cwd(), 'playground')
            },
            data: './playground/data/**/*.json',
            renderTransformedHtml: (filename) => !filename.endsWith('.latte')
        })
    ],
    resolve: {
        alias: {
            '/src': resolve(process.cwd(), 'playground')
        }
    },
    publicDir: resolve(process.cwd(), 'public'),
    build: {
        manifest: true,
        emptyOutDir: false,
        modulePreload: false,
        outDir: resolve(process.cwd(), 'public')
    }
}
