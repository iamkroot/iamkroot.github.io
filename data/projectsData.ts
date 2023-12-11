interface Projects {
  title: string
  description: string
  href?: string
  imgSrc?: string
}

const projectsData: Projects[] = [
  {
    title: 'Trakt Scrobbler',
    description: `Python application that automatically recognizes the currently playing media on your PC and syncs that information with Trakt.tv servers.`,
    href: 'https://github.com/iamkroot/trakt-scrobbler',
  },
]

export default projectsData
