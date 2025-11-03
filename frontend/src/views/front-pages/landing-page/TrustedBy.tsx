// React Imports
import { useEffect, useRef } from 'react'

// MUI Imports
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'

// Third-party Imports
import classnames from 'classnames'

// Hook Imports
import { useIntersection } from '@/hooks/useIntersection'

// Styles Imports
import frontCommonStyles from '@views/front-pages/styles.module.css'

// Data - Logo perusahaan yang mempercayai platform
const trustedCompanies = [
  {
    name: 'Telkom Indonesia',
    logo: '/images/logos/telkom.png', // Akan perlu ditambahkan
    alt: 'Telkom Indonesia'
  },
  {
    name: 'PLN',
    logo: '/images/logos/pln.png',
    alt: 'PLN'
  },
  {
    name: 'Pertamina',
    logo: '/images/logos/pertamina.png',
    alt: 'Pertamina'
  },
  {
    name: 'Danatara',
    logo: '/images/logos/danatara.png',
    alt: 'Danatara'
  },
  {
    name: 'BUMN',
    logo: '/images/logos/bumn.png',
    alt: 'BUMN'
  }
]

const TrustedBy = () => {
  // Refs
  const skipIntersection = useRef(true)
  const ref = useRef<null | HTMLDivElement>(null)

  // Hooks
  const { updateIntersections } = useIntersection()

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (skipIntersection.current) {
          skipIntersection.current = false

          return
        }

        updateIntersections({ [entry.target.id]: entry.isIntersecting })
      },
      { threshold: 0.35 }
    )

    ref.current && observer.observe(ref.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <section id='trusted-by' ref={ref} className='bg-backgroundPaper'>
      <div className={classnames('flex flex-col gap-8 pbs-16 pbe-16', frontCommonStyles.layoutSpacing)}>
        <div className='flex flex-col gap-y-4 items-center justify-center'>
          <Chip size='small' variant='tonal' color='primary' label='Trusted by Leaders' />
          <Typography color='text.primary' variant='h4' className='text-center font-extrabold'>
            BUMN & Perusahaan Besar Percaya Kami
          </Typography>
          <Typography className='text-center text-lg max-w-[600px] font-medium' color='text.secondary'>
            Dipercaya untuk memberdayakan ekosistem UMKM Indonesia
          </Typography>
        </div>

        <div className='flex flex-wrap items-center justify-center gap-12 mbs-8'>
          {trustedCompanies.map((company, index) => (
            <div
              key={index}
              className='flex items-center justify-center grayscale hover:grayscale-0 transition-all duration-300 opacity-60 hover:opacity-100'
            >
              <img
                src={company.logo}
                alt={company.alt}
                className='h-12 sm:h-16 object-contain'
                onError={e => {
                  // Fallback jika logo tidak ada
                  const target = e.target as HTMLImageElement

                  target.style.display = 'none'
                  const parent = target.parentElement

                  if (parent) {
                    const text = document.createElement('div')

                    text.className = 'font-bold text-xl px-6 py-3 bg-gray-100 rounded-lg'
                    text.textContent = company.name
                    parent.appendChild(text)
                  }
                }}
              />
            </div>
          ))}
        </div>

        <div className='flex flex-col sm:flex-row gap-8 sm:gap-12 justify-center items-center mbs-8'>
          <div className='text-center'>
            <Typography variant='h3' color='primary' className='font-extrabold'>
              500+
            </Typography>
            <Typography color='text.secondary' className='font-medium'>UMKM Sukses</Typography>
          </div>
          <div className='text-center'>
            <Typography variant='h3' color='primary' className='font-extrabold'>
              1000+
            </Typography>
            <Typography color='text.secondary' className='font-medium'>Toko Online</Typography>
          </div>
          <div className='text-center'>
            <Typography variant='h3' color='primary' className='font-extrabold'>
              100%
            </Typography>
            <Typography color='text.secondary' className='font-medium'>Gratis Forever</Typography>
          </div>
        </div>
      </div>
    </section>
  )
}

export default TrustedBy
