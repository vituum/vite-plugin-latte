import { join, resolve } from 'path'
import FastGlob from 'fast-glob'
import latte from './index.js'
import fs from 'fs'

let format = 'latte'

const middleware = {
    name: 'middleware',
    apply: 'serve',
    configureServer(viteDevServer) {
        return () => {
            viteDevServer.middlewares.use(async(req, res, next) => {
                if (req.originalUrl === '/' || req.originalUrl.endsWith('/')) {
                    req.originalUrl = req.originalUrl + 'index'
                }

                if (!req.originalUrl.startsWith('/views')) {
                    req.originalUrl = '/views' + req.originalUrl
                }

                const transformedUrl = req.originalUrl.replace('.html', '')

                if (fs.existsSync(join(viteDevServer.config.root, `${transformedUrl}.latte`)) || fs.existsSync(join(viteDevServer.config.root, `${transformedUrl}.latte.html`))) {
                    format = 'latte'
                }

                if (fs.existsSync(join(viteDevServer.config.root, `${transformedUrl}.json`)) || fs.existsSync(join(viteDevServer.config.root, `${transformedUrl}.json.html`))) {
                    format = 'json'
                }

                if (!req.originalUrl.endsWith('.html')) {
                    req.originalUrl = req.originalUrl + `.${format}.html`
                } else if (req.originalUrl.endsWith('.html')) {
                    req.originalUrl = req.originalUrl.replace('.html', `.${format}.html`)
                }

                const templatePath = join(viteDevServer.config.root, req.originalUrl.replace('.html', ''))

                if (fs.existsSync(templatePath) && !req.originalUrl.includes('.latte.json')) {
                    const output = await viteDevServer.transformIndexHtml(req.originalUrl.replace('.html', ''), '')

                    if (req.originalUrl.startsWith('/views/dialog')) {
                        res.setHeader('Content-Type', 'application/json')
                    }

                    res.statusCode = 200
                    res.end(output)
                } else if (fs.existsSync(templatePath + '.html')) {
                    req.url = req.originalUrl

                    next()
                } else {
                    req.originalUrl = req.originalUrl.replace(`.${format}`, '')

                    req.url = req.originalUrl

                    next()
                }
            })
        }
    }
}

export default {
    plugins: [
        middleware,
        latte({
            filters: {
                icon: 'latte/IconFilter.php',
                hello: (value, there) => {
                    console.log('Hello ' + there + ' ' + value)
                }
            },
            globals: {
                template: resolve(process.cwd(), 'playground/templates/Layout/Main.latte'),
                srcPath: resolve(process.cwd(), 'playground')
            },
            data: './playground/data/**/*.json'
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
