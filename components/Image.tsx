import NextImage, { ImageProps } from 'next/image'

// const Image = ({ ...rest }) => <img {...rest} />
const Image = ({ src, ...rest }: ImageProps) => (
  <NextImage src={`/iamkroot.github.io${src}`} {...rest} />
)

export default Image
