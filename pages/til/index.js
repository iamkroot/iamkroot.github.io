import siteMetadata from '@/data/siteMetadata'
import { PageSEO } from '@/components/SEO'
import { getAllFilesFrontMatter } from '@/lib/mdx'
import ListLayout from '@/layouts/ListLayout'

const POSTS_PER_PAGE = 10

export async function getStaticProps() {
  const posts = (await getAllFilesFrontMatter('til')).map((p) => {
    return { postType: 'til', ...p }
  })
  const initialDisplayPosts = posts.slice(0, POSTS_PER_PAGE)
  const pagination = {
    currentPage: 1,
    totalPages: Math.ceil(posts.length / POSTS_PER_PAGE),
  }

  return { props: { initialDisplayPosts, posts, pagination } }
}

export default function TIL({ posts, initialDisplayPosts, pagination }) {
  return (
    <>
      <PageSEO
        title={`Today I Learned - ${siteMetadata.author}`}
        description={siteMetadata.description}
      />
      <ListLayout
        posts={posts}
        initialDisplayPosts={initialDisplayPosts}
        pagination={pagination}
        title="Today I Learned"
      />
    </>
  )
}