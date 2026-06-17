import { useEffect, useMemo } from 'react'
import landingHtml from './landing-body.html?raw'
import { APK_DOWNLOAD_URL } from './apkDownloadUrl.js'

export default function LandingPage() {
  const html = useMemo(
    () => landingHtml.replaceAll('__APK_DOWNLOAD_URL__', APK_DOWNLOAD_URL),
    [],
  )

  useEffect(() => {
    const cleanups = []

    document.querySelectorAll('.faq-q').forEach((q) => {
      const onClick = () => {
        q.parentElement?.classList.toggle('open')
      }
      q.addEventListener('click', onClick)
      cleanups.push(() => q.removeEventListener('click', onClick))
    })

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in')
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.12 },
    )

    const isMobile = window.matchMedia('(max-width: 900px)').matches

    document
      .querySelectorAll(
        '.block-head, .feat-text, .feat-row > .phone-stage, .step, .testi-card, .cat-card, .stats-grid > div',
      )
      .forEach((el, i) => {
        el.classList.add('reveal')
        if (isMobile) {
          el.classList.add('in')
          return
        }
        el.style.transitionDelay = `${(i % 5) * 60}ms`
        io.observe(el)
      })

    cleanups.push(() => io.disconnect())

    return () => {
      cleanups.forEach((fn) => fn())
    }
  }, [])

  return <div dangerouslySetInnerHTML={{ __html: html }} />
}
