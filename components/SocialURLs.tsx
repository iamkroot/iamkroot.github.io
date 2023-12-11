import Link from '@/components/Link'

interface Props {
  urls?: string[],
  postUrl: string,
  postText: string,
  discussedText?: string,
}

export default function SocialURLs({ urls, postUrl, postText, discussedText }: Props) {
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
            <Link className="ml-1" key={url} href={url}>
              Post {i + 1}
              {i == urls.length - 1 ? '' : ','}
            </Link>
          ))}
        </span>
      </>
    )
  }
}
