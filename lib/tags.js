import fs from 'fs'
import matter from 'gray-matter'
import path from 'path'
import { getFiles } from './mdx'
import kebabCase from './utils/kebabCase'

const root = process.cwd()

export async function getAllTagsOfType(type) {
  const files = await getFiles(type)

  let tagCount = {}
  // Iterate through each post, putting all found tags into `tags`
  files.forEach((file) => {
    const source = fs.readFileSync(path.join(root, 'data', type, file), 'utf8')
    const { data } = matter(source)
    if (data.tags && data.draft !== true) {
      data.tags.forEach((tag) => {
        const formattedTag = kebabCase(tag)
        if (formattedTag in tagCount) {
          tagCount[formattedTag] += 1
        } else {
          tagCount[formattedTag] = 1
        }
      })
    }
  })

  return tagCount
}

export async function getAllTags() {
  let tagCount = await getAllTagsOfType('blog')
  const tagstil = await getAllTagsOfType('til')
  for (const [t, v] of Object.entries(tagstil)) {
    if (t in tagCount) {
      tagCount[t] += v
    } else {
      tagCount[t] = v
    }
  }

  return tagCount
}
