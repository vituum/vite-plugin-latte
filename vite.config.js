import { resolve } from 'path'
import FastGlob from 'fast-glob'
import latte from './index.js'

const middleware = {
    name: 'middleware',
    apply: 'serve',
    configureServer(viteDevServer) {
        return () => {
            viteDevServer.middlewares.use(async(req, res, next) => {
                if (!req.originalUrl.startsWith('/views')) {
                    req.originalUrl = '/views' + req.originalUrl
                }

                if (!req.originalUrl.endsWith('.html') &&
                  (req.originalUrl !== '/' && !req.originalUrl.endsWith('/'))) {
                    req.originalUrl = req.originalUrl + '.html'
                } else if (!req.originalUrl.endsWith('.html')) {
                    req.originalUrl = req.originalUrl + 'index.html'
                }

                req.url = req.originalUrl

                next()
            })
        }
    }
}

export default {
    plugins: [
        middleware,
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
            data: './playground/data/**/*.json',
            template: 'templates/Layout/Main.latte'
        })
    ],
    resolve: {
        alias: {
            '/src': resolve(process.cwd(), 'playground')
        }
    },
    root: resolve(process.cwd(), 'playground'),
    publicDir: resolve(process.cwd(), 'public'),
    build: {
        manifest: true,
        emptyOutDir: false,
        polyfillModulePreload: false,
        outDir: resolve(process.cwd(), 'public'),
        rollupOptions: {
            input: FastGlob.sync(['./playground/views/**/*.html', './playground/styles/**/*.css', './playground/scripts/**/*.js']).map(entry => resolve(process.cwd(), entry))
        }
    }
}
