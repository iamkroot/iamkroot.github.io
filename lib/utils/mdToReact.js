import { bundleMDX } from 'mdx-bundler'
import { getMDXComponent } from 'mdx-bundler/client'

export async function parseMdToReact(posts) {
  if (!(posts instanceof Array)) {
    return
  }
  return Promise.all(
    posts.map(async (post) => {
      let { code } = await bundleMDX({ source: post.title })
      return {
        ...post,
        rawTitle: post.title,
        title: getMDXComponent(code),
      }
    })
  )
}
