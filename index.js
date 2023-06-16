import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import process from 'node:process'
import * as childProcess from 'node:child_process'
import FastGlob from 'fast-glob'
import { minimatch } from 'minimatch'
import { getPackageInfo, pluginError, pluginReload, merge, pluginBundle } from 'vituum/utils/common.js'
import { renameBuildEnd, renameBuildStart } from 'vituum/utils/build.js'

const { name } = getPackageInfo(import.meta.url)

/**
 * @type {import('@vituum/vite-plugin-latte/types/index.d.ts').PluginUserConfig} options
 */
const defaultOptions = {
    reload: true,
    root: null,
    filters: {},
    functions: {},
    tags: {},
    globals: {},
    data: ['src/data/**/*.json'],
    formats: ['latte', 'json.latte', 'json'],
    bin: 'php',
    renderTransformedHtml: () => false,
    ignoredPaths: []
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

const renderTemplate = ({ path, filename, cwd, packageRoot }, params, content) => {
    const renderTransformedHtml = params.renderTransformedHtml(filename)

    if (params.data) {
        const normalizePaths = Array.isArray(params.data) ? params.data.map(path => path.replace(/\\/g, '/')) : params.data.replace(/\\/g, '/')

        params.data = FastGlob.sync(normalizePaths).map(entry => resolve(process.cwd(), entry))
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

    if (renderTransformedHtml) {
        const timestamp = Math.floor(Date.now() * Math.random())

        params.contentTimestamp = timestamp

        if (!fs.existsSync(resolve(packageRoot, 'temp'))) {
            fs.mkdirSync(resolve(packageRoot, 'temp'))
        }

        fs.writeFileSync(resolve(packageRoot, `temp/${timestamp}.html`), content)
    }

    return execSync(`${params.bin} ${packageRoot}/index.php ${join(params.root, path)} ${JSON.stringify(JSON.stringify(Object.assign({ packageRoot, cwd, renderTransformedHtml }, params)))}`)
}

/**
 * @param {import('@vituum/vite-plugin-latte/types/index.d.ts').PluginUserConfig} options
 * @returns [import('vite').Plugin]
 */
const plugin = (options = {}) => {
    let resolvedConfig
    let userEnv

    options = merge(defaultOptions, options)

    const cwd = process.cwd()
    const packageRoot = dirname((fileURLToPath(import.meta.url)))

    if (fs.existsSync(resolve(packageRoot, 'temp'))) {
        fs.rmSync(resolve(packageRoot, 'temp'), { recursive: true, force: true })
    }

    if (options.bin === 'docker') {
        options.bin = `docker run --rm --name index -v "${process.cwd()}":/usr/src/app -w /usr/src/app php:8-cli php`
    }

    return [{
        _options: options,
        name,
        config (userConfig, env) {
            userEnv = env
        },
        configResolved (config) {
            resolvedConfig = config

            if (!options.root) {
                options.root = config.root
            }
        },
        buildStart: async () => {
            if (userEnv.command !== 'build') {
                return
            }

            await renameBuildStart(resolvedConfig.build.rollupOptions.input, options.formats)
        },
        buildEnd: async () => {
            if (userEnv.command !== 'build') {
                return
            }

            await renameBuildEnd(resolvedConfig.build.rollupOptions.input, options.formats)
        },
        transformIndexHtml: {
            enforce: 'pre',
            async transform (content, { path, filename, server }) {
                path = path.replace('?raw', '')
                filename = filename.replace('?raw', '')

                if (options.ignoredPaths.find(ignoredPath => minimatch(path.replace('.html', ''), ignoredPath) === true)) {
                    return content
                }

                if (!options.formats.find(format => path.endsWith(`${format}.html`))) {
                    return content
                }

                const render = renderTemplate({ path, filename, cwd, packageRoot }, options, content)
                const warningLog = render.output.includes('Warning: Undefined')

                if (render.error || warningLog) {
                    const message = warningLog ? 'Warning: Undefined' + render.output.split('Warning: Undefined').pop() : render.output
                    const renderError = pluginError(message, server, name)

                    if (renderError && server) {
                        return
                    } else if (renderError) {
                        return renderError
                    }
                }

                return render.output
            }
        },
        handleHotUpdate: ({ file, server }) => pluginReload({ file, server }, options)
    }, pluginBundle(options.formats)]
}

export default plugin
