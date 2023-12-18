import NextImage, { ImageProps } from 'next/image'
import { imageSize } from 'image-size'

// const Image = ({ ...rest }) => <img {...rest} />
const Image = ({ src, ...rest }: ImageProps) => {
  let width: number | undefined = undefined,
    height: number | undefined = undefined
  if (
    process.env.NODE_ENV === 'development' &&
    !('width' in rest) &&
    src.toString().startsWith('/static')
  ) {
    const size = imageSize('public' + src.toString())
    height = size.height
    width = size.width
  }
  return <NextImage src={src} width={width} height={height} {...rest} />
}

export default Image
