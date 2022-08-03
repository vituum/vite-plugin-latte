import { extname, resolve } from 'path'
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
    data: ''
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

const renderTemplate = (path, params) => {
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

    return execSync(`${params.bin} index.php ${params.root + path} ${JSON.stringify(JSON.stringify(params))}`)
}

const latte = (params) => {
    params.cwd = process.cwd()

    params = lodash.merge(defaultParams, params)

    if (params.bin === 'docker') {
        params.bin = `docker run --rm --name index -v "${process.cwd()}":/usr/src/app -w /usr/src/app php:8-cli php`
    }

    return {
        _params: params,
        name: 'vite-plugin-latte',
        config: ({ root }) => {
            params.root = root
        },
        transformIndexHtml: {
            enforce: 'pre',
            async transform(content, { path, server }) {
                const renderLatte = renderTemplate(path, params)

                if (renderLatte.error) {
                    server.ws.send({
                        type: 'error',
                        err: {
                            message: renderLatte.output,
                            plugin: 'vite-plugin-latte'
                        }
                    })

                    return
                }

                return renderLatte.output
            }
        },
        handleHotUpdate({ file, server }) {
            if (extname(file) === '.latte' || extname(file) === '.html') {
                server.ws.send({ type: 'full-reload' })
            }
        }
    }
}

export default latte
