import { resolve } from 'path'
import latte from './index.js'

export default {
    plugins: [
        latte({
            php: 'php',
            filters: {
                icon: 'latte/IconFilter.php'
            },
            functions: {},
            tags: {},
            globals: {
                srcPath: resolve(process.cwd(), 'playground')
            },
            template: 'playground/templates/Layout/Main.latte'
        })
    ],
    resolve: {
        alias: {
            '/src': resolve(process.cwd(), 'playground')
        }
    },
    root: resolve(process.cwd(), 'playground'),
    publicDir: resolve(process.cwd(), 'public')
}
