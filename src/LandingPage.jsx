import { useEffect } from 'react'
import landingHtml from './landing-body.html?raw'

export default function LandingPage() {
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

    document
      .querySelectorAll(
        '.block-head, .feat-text, .feat-row > .phone-stage, .step, .testi-card, .cat-card, .stats-grid > div',
      )
      .forEach((el, i) => {
        el.classList.add('reveal')
        el.style.transitionDelay = `${(i % 5) * 60}ms`
        io.observe(el)
      })

    cleanups.push(() => io.disconnect())

    return () => {
      cleanups.forEach((fn) => fn())
    }
  }, [])

  return <div dangerouslySetInnerHTML={{ __html: landingHtml }} />
}
