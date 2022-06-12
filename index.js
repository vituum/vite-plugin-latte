import { extname, resolve } from 'path'
import * as childProcess from 'child_process'
import FastGlob from 'fast-glob'

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

const renderTemplate = (path, config) => {
    if (config.data) {
        config.data = FastGlob.sync(config.data).map(entry => resolve(process.cwd(), entry))
    }

    return execSync(`${config.php} index.php ${path} ${JSON.stringify(JSON.stringify(config))}`)
}

const latte = (config) => {
    return {
        name: 'vite-plugin-latte',
        config: ({ root }) => {
            config.root = root
        },
        transformIndexHtml: {
            enforce: 'pre',
            async transform(content, { path, server }) {
                const renderLatte = renderTemplate(path, config)

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
            if (extname(file) === '.latte') {
                server.ws.send({ type: 'full-reload' })
            }
        }
    }
}

export default latte
