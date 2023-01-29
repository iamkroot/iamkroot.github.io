import { MDXLayoutRenderer } from '@/components/MDXComponents'
import { getFileBySlug } from '@/lib/mdx'
import fs from 'fs'
import path from 'path'
import Head from 'next/head'

const DEFAULT_LAYOUT = 'AuthorLayout'

export async function getStaticProps() {
  const authorDetails = await getFileBySlug('authors', ['default'])
  const p = path.join(process.cwd(), 'data', 'read_stats.json')
  const rawCalData = JSON.parse(fs.readFileSync(p))
  return { props: { authorDetails, rawCalData } }
}

export default function About({ authorDetails, rawCalData }) {
  const { mdxSource, frontMatter } = authorDetails

  return (
    <>
      {frontMatter.avatar && (
        <Head>
          <link rel="prefetch" href={frontMatter.avatar} />
        </Head>
      )}
      <MDXLayoutRenderer
        layout={frontMatter.layout || DEFAULT_LAYOUT}
        mdxSource={mdxSource}
        frontMatter={frontMatter}
        rawCalData={rawCalData}
      />
    </>
  )
}
