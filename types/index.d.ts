export interface PluginUserConfig {
    reload?: boolean | Function
    root?: string
    filters?: Object
    functions?: Object
    tags?: Object
    globals?: Object
    data?: string | string[]
    formats?: string[]
    bin?: string
    renderTransformedHtml?: (filename: string) => boolean
    ignoredPaths?: string[]
}

export default function plugin(options?: PluginUserConfig) : import('vite').Plugin
