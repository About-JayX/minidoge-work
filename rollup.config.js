import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import polyfillNode from 'rollup-plugin-polyfill-node';
import replace from '@rollup/plugin-replace';

export default {
    input: 'src/worker.js',
    output: {
        file: 'dist/worker.js',
        format: 'es',
        sourcemap: true,
        inlineDynamicImports: true
    },
    plugins: [
        replace({
            preventAssignment: true,
            values: {
                'node:http': 'http',
                'node:https': 'https',
                'node:stream': 'stream',
                'node:buffer': 'buffer',
                'node:util': 'util',
                'node:url': 'url',
                'node:zlib': 'zlib',
                'node:net': 'net',
                'node:path': 'path',
                'node:fs': 'fs'
            }
        }),
        resolve({
            browser: true,
            preferBuiltins: false,
            mainFields: ['browser', 'module', 'main']
        }),
        commonjs({
            transformMixedEsModules: true,
            requireReturnsDefault: 'auto',
            ignore: ['node:http', 'node:https', 'node:stream', 'node:buffer', 'node:util', 'node:url', 'node:zlib', 'node:net', 'node:path', 'node:fs']
        }),
        json(),
        polyfillNode({
            include: ['node-fetch/**/*']
        })
    ],
    external: [
        'http',
        'https',
        'stream',
        'buffer',
        'util',
        'url',
        'zlib',
        'net',
        'path',
        'fs'
    ]
};