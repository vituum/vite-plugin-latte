import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import process from 'node:process'
import * as childProcess from 'node:child_process'
import FastGlob from 'fast-glob'
import { minimatch } from 'minimatch'
import {
    getPackageInfo,
    pluginError,
    pluginReload,
    merge,
    pluginBundle,
    normalizePath,
    pluginMiddleware
} from 'vituum/utils/common.js'
import { renameBuildEnd, renameBuildStart } from 'vituum/utils/build.js'

const { name } = getPackageInfo(import.meta.url)

/**
 * @type {import('@vituum/vite-plugin-latte/types').PluginUserConfig} options
 */
const defaultOptions = {
    reload: true,
    root: null,
    filters: {},
    functions: {},
    tags: {},
    globals: {
        format: 'latte'
    },
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

const renderTemplate = ({ server, path, filename, cwd, packageRoot }, options, content) => {
    const renderTransformedHtml = options.renderTransformedHtml(server ? filename.replace('.html', '') : filename)

    if (options.data) {
        const normalizePaths = Array.isArray(options.data) ? options.data.map(path => normalizePath(path)) : normalizePath(options.data)

        options.data = FastGlob.sync(normalizePaths).map(entry => resolve(cwd, entry))
    }

    Object.keys(options.filters).forEach(key => {
        if (typeof options.filters[key] === 'function') {
            options.filters[key] = options.filters[key].toString().match(/\(\s*([^)]+?)\s*\)/)[1].replace(/\s/g, '').split(',')
        }
    })

    Object.keys(options.functions).forEach(key => {
        if (typeof options.functions[key] === 'function') {
            options.functions[key] = options.functions[key].toString().match(/\(\s*([^)]+?)\s*\)/)[1].replace(/\s/g, '').split(',')
        }
    })

    if (renderTransformedHtml) {
        const timestamp = Math.floor(Date.now() * Math.random())

        options.contentTimestamp = timestamp

        if (!fs.existsSync(resolve(packageRoot, 'temp'))) {
            fs.mkdirSync(resolve(packageRoot, 'temp'))
        }

        fs.writeFileSync(resolve(packageRoot, `temp/${timestamp}.html`), content)
    }

    const data = Object.assign({ packageRoot, cwd, isRenderTransformedHtml: renderTransformedHtml }, options)

    return execSync(`${options.bin} ${packageRoot}/index.php ${join(options.root, server ? path.replace('.html', '') : path)} ${JSON.stringify(JSON.stringify(data))}`)
}

/**
 * @param {import('@vituum/vite-plugin-latte/types').PluginUserConfig} options
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
            } else {
                options.root = normalizePath(options.root)
            }
        },
        buildStart: async () => {
            if (userEnv.command !== 'build' || !resolvedConfig.build.rollupOptions.input) {
                return
            }

            await renameBuildStart(resolvedConfig.build.rollupOptions.input, options.formats)
        },
        buildEnd: async () => {
            if (userEnv.command !== 'build' || !resolvedConfig.build.rollupOptions.input) {
                return
            }

            await renameBuildEnd(resolvedConfig.build.rollupOptions.input, options.formats)
        },
        transformIndexHtml: {
            enforce: 'pre',
            async transform (content, { path, filename, server }) {
                if (options.ignoredPaths.find(ignoredPath => minimatch(path.replace('.html', ''), ignoredPath) === true)) {
                    return content
                }

                if (
                    !options.formats.find(format => filename.replace('.html', '').endsWith(format)) ||
                    (filename.replace('.html', '').endsWith('.json') && !content.startsWith('{'))
                ) {
                    return content
                }

                if (
                    (filename.replace('.html', '').endsWith('.json') && content.startsWith('{')) &&
                    (JSON.parse(content)?.format && !options.formats.includes(JSON.parse(content)?.format))
                ) {
                    return content
                }

                const render = renderTemplate({ server, path, filename, cwd, packageRoot }, options, content)
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
    }, pluginBundle(options.formats), pluginMiddleware(name, options.formats)]
}

export default plugin
