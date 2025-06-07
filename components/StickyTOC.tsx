/*
Sticky Table-of-Contents, adapted from https://github.com/Th1nhNg0/th1nhng0.vercel.app/blob/5e73a420828d82f01e7147512a2c3273c4ec19f8/layouts/PostLayout.js
*/
import Link from '@/components/Link'
import { useRef, useEffect, useState } from 'react'

const getTocState = (toc) => {
  const etoc = toc.map((e) => ({ ...e, children: [] }))
  for (let i = etoc.length - 1; i >= 0; i--) {
    if (etoc[i].depth == 1) continue
    for (let j = i; j >= 0; j--) {
      if (etoc[i].depth - etoc[j].depth == 1) {
        etoc[j].children.unshift(etoc[i])
        break
      }
    }
  }
  return etoc
}

function TocComponent({ toc }) {
  const [activeId, setActiveId] = useState()
  useIntersectionObserver(setActiveId)
  const TOC = getTocState(toc).filter((e) => e.depth == 1)

  const RenderToc = ({ item, activeId }) => {
    const isActive = (e) => {
      if ('#' + activeId === e.url) return true
      for (const i of e.children) if (isActive(i)) return true
      return false
    }
    return item.map((e, i) => (
      <div key={i}>
        <Link href={e.url}>
          <p
            className={`border-l-[3px] pl-2 ${
              isActive(e) && 'border-primary-500 text-primary-600'
            }`}
          >
            {e.value}
          </p>
        </Link>
        {isActive(e) && e.children.length > 0 && (
          <div className="mt-1 ml-4 space-y-1">
            <RenderToc item={e.children} activeId={activeId} />
          </div>
        )}
      </div>
    ))
  }

  return (
    <div className="mt-5 space-y-1 text-sm">
      <p className="text-lg font-bold">Table of Contents</p>
      <RenderToc item={TOC} activeId={activeId} />
    </div>
  )
}

const useIntersectionObserver = (setActiveId) => {
  const headingElementsRef = useRef({})
  useEffect(() => {
    const callback = (headings) => {
      headingElementsRef.current = headings.reduce((map, headingElement) => {
        map[headingElement.target.id] = headingElement
        return map
      }, headingElementsRef.current)

      const visibleHeadings: { target: { id: number }; id: number }[] = []
      Object.keys(headingElementsRef.current).forEach((key) => {
        const headingElement = headingElementsRef.current[key]
        if (headingElement.isIntersecting) visibleHeadings.push(headingElement)
      })

      const getIndexFromId = (id) => headingElements.findIndex((heading) => heading.id === id)

      if (visibleHeadings.length === 1) {
        setActiveId(visibleHeadings[0].target.id)
      } else if (visibleHeadings.length > 1) {
        const sortedVisibleHeadings = visibleHeadings.sort(
          (a, b) => getIndexFromId(a.target.id) - getIndexFromId(b.target.id)
        )
        setActiveId(sortedVisibleHeadings[0].target.id)
      }
    }

    const observer = new IntersectionObserver(callback, {
      rootMargin: '0px 0px -40% 0px',
    })

    const headingElements = Array.from(document.querySelectorAll('h1, h2, h3'))

    headingElements.forEach((element) => observer.observe(element))

    return () => observer.disconnect()
  }, [setActiveId])
}

export default TocComponent
