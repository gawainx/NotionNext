/** @jest-environment node */
import fs from 'fs'
import path from 'path'
import { transformSync } from 'next/dist/compiled/babel/core'

// Exercise Next's actual Babel plugin: a wrapper around a variable import does
// not produce this metadata, even when dynamic() has ssr: true.
it('emits preload metadata for every Fuwari layout without eager imports', () => {
  const filename = path.resolve('themes/fuwari/layouts.js')
  const { code } = transformSync(fs.readFileSync(filename, 'utf8'), {
    filename,
    babelrc: false,
    configFile: false,
    plugins: [require('next/dist/build/babel/plugins/react-loadable-plugin')],
    caller: { name: 'test', isServer: false, isDev: false }
  })
  expect(code.match(/loadableGenerated:/g)).toHaveLength(9)
  expect(code.match(/require\.resolveWeak\(['"]\.\/index['"]\)/g)).toHaveLength(9)
  expect(code).not.toMatch(/import .* from ['"]\.\/index['"]/)
})
