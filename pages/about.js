import { MDXLayoutRenderer } from '@/components/MDXComponents'
import { getFileBySlug } from '@/lib/mdx'
import fs from 'fs'
import path from 'path'

const DEFAULT_LAYOUT = 'AuthorLayout'

export async function getStaticProps() {
  const authorDetails = await getFileBySlug('authors', ['default'])
  const p = path.join(process.cwd(), 'data', 'read_stats.json')
  console.warn(p)
  const rawCalData = JSON.parse(fs.readFileSync(p))
  return { props: { authorDetails, rawCalData } }
}

export default function About({ authorDetails, rawCalData }) {
  const { mdxSource, frontMatter } = authorDetails

  return (
    <MDXLayoutRenderer
      layout={frontMatter.layout || DEFAULT_LAYOUT}
      mdxSource={mdxSource}
      frontMatter={frontMatter}
      rawCalData={rawCalData}
    />
  )
}
