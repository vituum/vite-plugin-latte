import { extname, resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import process from 'node:process'
import * as childProcess from 'child_process'
import FastGlob from 'fast-glob'
import lodash from 'lodash'

const defaultParams = {
    bin: 'php',
    filters: {},
    functions: {},
    tags: {},
    globals: {},
    data: '',
    isStringFilter: undefined,
    filetypes: {
        html: /.(json.html|latte.json.html|latte.html)$/,
        json: /.(json.latte.html)$/
    }
}

const execSync = (cmd) => {
    try {
        return {
            output: childProcess.execSync(cmd).toString()
        }
    } catch ({ output }) {
        return {
            error: true,
            output: output[1].toString()
        }
    }
}

const renderTemplate = (path, params, content) => {
    if (params.data) {
        params.data = FastGlob.sync(params.data).map(entry => resolve(process.cwd(), entry))
    }

    Object.keys(params.filters).forEach(key => {
        if (typeof params.filters[key] === 'function') {
            params.filters[key] = params.filters[key].toString().match(/\(\s*([^)]+?)\s*\)/)[1].replace(/\s/g, '').split(',')
        }
    })

    Object.keys(params.functions).forEach(key => {
        if (typeof params.functions[key] === 'function') {
            params.functions[key] = params.functions[key].toString().match(/\(\s*([^)]+?)\s*\)/)[1].replace(/\s/g, '').split(',')
        }
    })

    if (params.isString) {
        const timestamp = Math.floor(Date.now() * Math.random())

        params.contentTimestamp = timestamp

        if (!fs.existsSync(resolve(params.packageRoot, 'temp'))) {
            fs.mkdirSync(resolve(params.packageRoot, 'temp'))
        }

        fs.writeFileSync(resolve(params.packageRoot, `temp/${timestamp}.html`), content)
    }

    return execSync(`${params.bin} ${params.packageRoot}/index.php ${params.root + path} ${JSON.stringify(JSON.stringify(params))}`)
}

const latte = (params = {}) => {
    params.cwd = process.cwd()

    params = lodash.merge(defaultParams, params)

    params.packageRoot = dirname((fileURLToPath(import.meta.url)))

    if (fs.existsSync(resolve(params.packageRoot, 'temp'))) {
        fs.rmSync(resolve(params.packageRoot, 'temp'), { recursive: true, force: true })
    }

    if (params.bin === 'docker') {
        params.bin = `docker run --rm --name index -v "${process.cwd()}":/usr/src/app -w /usr/src/app php:8-cli php`
    }

    return {
        _params: params,
        name: '@vituum/vite-plugin-latte',
        config: ({ root }) => {
            params.root = root
        },
        transformIndexHtml: {
            enforce: 'pre',
            async transform(content, { path, filename, server }) {
                if (
                    !params.filetypes.html.test(path) &&
                    !params.filetypes.json.test(path) &&
                    !content.startsWith('<script type="application/json"')
                ) {
                    return content
                }

                if (content.startsWith('<script type="application/json"') && !content.includes('data-format="latte"')) {
                    return content
                }

                if (typeof params.isStringFilter === 'function' && params.isStringFilter(filename)) {
                    params.isString = true
                } else {
                    params.isString = false
                }

                const renderLatte = renderTemplate(path, params, content)

                if (renderLatte.error) {
                    if (!server) {
                        console.error(renderLatte.output)
                        return
                    }

                    server.ws.send({
                        type: 'error',
                        err: {
                            message: renderLatte.output,
                            plugin: '@vituum/vite-plugin-latte'
                        }
                    })

                    return
                }

                return renderLatte.output
            }
        },
        handleHotUpdate({ file, server }) {
            if (extname(file) === '.latte' || extname(file) === '.html' || extname(file) === '.json') {
                server.ws.send({ type: 'full-reload' })
            }
        }
    }
}

export default latte
