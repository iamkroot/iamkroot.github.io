import { Authors, allAuthors } from 'contentlayer/generated'
import { MDXLayoutRenderer } from 'pliny/mdx-components'
import AuthorLayout from '@/layouts/AuthorLayout'
import { coreContent } from 'pliny/utils/contentlayer'
import { genPageMetadata } from 'app/seo'
import Head from 'next/head'
import { components } from '@/components/MDXComponents'

export const metadata = genPageMetadata({ title: 'About' })

export default function Page() {
  const author = allAuthors.find((p) => p.slug === 'default') as Authors
  const mainContent = coreContent(author)

  return (
    <>
      {mainContent.avatar && (
        <Head>
          <link rel="preload" href={mainContent.avatar} as="image" />
        </Head>
      )}
      <AuthorLayout content={mainContent}>
        <MDXLayoutRenderer code={author.body.code} components={components} />
      </AuthorLayout>
    </>
  )
}
