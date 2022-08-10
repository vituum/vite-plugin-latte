import { join, resolve } from 'path'
import FastGlob from 'fast-glob'
import latte from './index.js'
import fs from 'fs'

const middleware = {
    name: 'middleware',
    apply: 'serve',
    configureServer(viteDevServer) {
        const supportedFormats = ['json', 'latte', 'twig']

        return () => {
            viteDevServer.middlewares.use(async(req, res, next) => {
                let format = null
                let transformedUrl = req.originalUrl.replace('.html', '')

                if (req.originalUrl === '/' || req.originalUrl.endsWith('/')) {
                    transformedUrl = transformedUrl + 'index'
                }

                if (!req.originalUrl.startsWith('/views') && !req.originalUrl.startsWith('/emails')) {
                    transformedUrl = '/views' + transformedUrl
                }

                supportedFormats.every(supportedFormat => {
                    if (fs.existsSync(join(viteDevServer.config.root, `${transformedUrl}.${supportedFormat}`)) || fs.existsSync(join(viteDevServer.config.root, `${transformedUrl}.${supportedFormat}.html`))) {
                        format = supportedFormat
                        return false
                    } else {
                        return true
                    }
                })

                if (format) {
                    transformedUrl = transformedUrl + `.${format}.html`
                } else {
                    transformedUrl = transformedUrl + '.html'
                }

                if (fs.existsSync(join(viteDevServer.config.root, transformedUrl.replace('.html', ''))) && format) {
                    const output = await viteDevServer.transformIndexHtml(transformedUrl.replace('.html', ''), fs.readFileSync(join(viteDevServer.config.root, transformedUrl.replace('.html', ''))).toString())

                    if (transformedUrl.startsWith('/views/dialog')) {
                        res.setHeader('Content-Type', 'application/json')
                    } else {
                        res.setHeader('Content-Type', 'text/html')
                    }

                    res.statusCode = 200
                    res.end(output)
                } else {
                    req.url = transformedUrl

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
            data: './playground/data/**/*.json',
            isStringFilter: (filename) => filename.endsWith('.latte')
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
