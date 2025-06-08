import TOCInline from 'pliny/ui/TOCInline'
import Pre from 'pliny/ui/Pre'
import BlogNewsletterForm from 'pliny/ui/BlogNewsletterForm'
import type { MDXComponents } from 'mdx/types'
import Image from './Image'
import CustomLink from './Link'
import ReadingActivity from './ReadingActivity'
import TableWrapper from './TableWrapper'

export const components: MDXComponents = {
  Image,
  TOCInline,
  a: CustomLink,
  ReadingActivity,
  pre: Pre,
  table: TableWrapper,
  BlogNewsletterForm,
}

// used in title fields of type MDX
export const titleComponents: MDXComponents = {
  // hack to remove the outer <p> tags
  p: ({ children }) => <span>{children}</span>,
}
