import Link from '@/components/Link'

export default function SocialURLs({ urls, postUrl, postText, discussedText }) {
  if (!urls || urls.length === 0) {
    return (
      <Link href={postUrl} rel="nofollow">
        {postText}
      </Link>
    )
  } else if (urls.length === 1) {
    return <Link href={urls[0]}>{discussedText}</Link>
  } else {
    return (
      <>
        {discussedText}:
        <span>
          {urls.map((url, i) => (
            <Link class="ml-1" key={url} href={url}>
              Post {i + 1}
              {i == urls.length - 1 ? '' : ','}
            </Link>
          ))}
        </span>
      </>
    )
  }
}
