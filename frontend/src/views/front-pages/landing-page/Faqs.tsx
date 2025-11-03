// React Imports
import { useEffect, useRef } from 'react'

// MUI Imports
import Typography from '@mui/material/Typography'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import Grid from '@mui/material/Grid2'
import Chip from '@mui/material/Chip'

// Third-party Imports
import classnames from 'classnames'

// Hook Imports
import { useIntersection } from '@/hooks/useIntersection'

// Styles Imports
import frontCommonStyles from '@views/front-pages/styles.module.css'
import styles from './styles.module.css'

type FaqsDataTypes = {
  id: string
  question: string
  active?: boolean
  answer: string
}

const FaqsData: FaqsDataTypes[] = [
  {
    id: 'panel1',
    question: 'Apakah benar-benar gratis?',
    active: true,
    answer:
      'Ya, 100% gratis selamanya! Website, domain (20 slot pertama), AI mentor, learning center, produk digital, dan komunitas—semua tanpa biaya.'
  },
  {
    id: 'panel2',
    question: 'Bagaimana cara dapat domain gratis?',
    answer:
      'Daftar sekarang dan klaim domain gratis (.com/.id/.net) untuk 20 pendaftar tercepat. Setelah kuota habis, tetap bisa pakai subdomain gratis!'
  },
  {
    id: 'panel3',
    question: 'Perlu keahlian coding?',
    answer:
      'Tidak perlu! Drag & drop builder yang mudah. Website jadi dalam 5-10 menit. Calista AI siap bantu 24/7.'
  },
  {
    id: 'panel4',
    question: 'Apa itu Calista AI?',
    answer:
      'Mentor bisnis AI pribadi Anda. Tanya strategi marketing, ide konten, copywriting, atau tips jualan—dapat jawaban instan 24/7, gratis!'
  },
  {
    id: 'panel5',
    question: 'Belum punya produk, bisa jualan apa?',
    answer:
      'Kami sediakan produk digital siap jual gratis: ebook, template, panduan marketing, course. Langsung upload ke toko, mulai jualan tanpa modal!'
  },
  {
    id: 'panel6',
    question: 'Apakah SEO-friendly?',
    answer:
      'Ya! Auto-optimized untuk Google. Cepat, mobile-responsive, dan ada materi SEO lengkap di Learning Center.'
  }
]

const Faqs = () => {
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
    <section id='faq' ref={ref} className={classnames('py-7 mb-1 bg-backgroundDefault', styles.sectionStartRadius)}>
      <div className={classnames('flex flex-col gap-16', frontCommonStyles.layoutSpacing)}>
        <div className='flex flex-col gap-y-4 items-center justify-center'>
          <Chip size='small' variant='tonal' color='primary' label='FAQ' />
          <div className='flex flex-col items-center gap-y-1 justify-center flex-wrap'>
            <div className='flex items-center gap-x-2'>
              <Typography color='text.primary' variant='h4' className='text-center'>
                <span className='relative z-[1] font-extrabold'>
                  Pertanyaan
                  <img
                    src='/images/front-pages/landing-page/bg-shape.png'
                    alt='bg-shape'
                    className='absolute block-end-0 z-[1] bs-[40%] is-[132%] -inline-start-[8%] block-start-[17px]'
                  />
                </span>{' '}
                yang Sering Ditanyakan
              </Typography>
            </div>
            <Typography className='text-center text-lg max-w-[700px]'>
              Temukan jawaban lengkap untuk pertanyaan umum seputar platform kami dan cara memaksimalkan bisnis online Anda
            </Typography>
          </div>
        </div>
        <div>
          <Grid container spacing={6}>
            <Grid size={{ xs: 12, lg: 5 }} className='text-center'>
              <img
                src='/images/front-pages/landing-page/boy-sitting-with-laptop.png'
                alt='boy with laptop'
                className='is-[80%] max-is-[320px]'
              />
            </Grid>
            <Grid size={{ xs: 12, lg: 7 }}>
              <div>
                {FaqsData.map((data, index) => {
                  return (
                    <Accordion key={index} defaultExpanded={data.active}>
                      <AccordionSummary
                        aria-controls={data.id + '-content'}
                        id={data.id + '-header'}
                        className='font-medium'
                        color='text.primary'
                      >
                        {data.question}
                      </AccordionSummary>
                      <AccordionDetails className='text-textSecondary'>{data.answer}</AccordionDetails>
                    </Accordion>
                  )
                })}
              </div>
            </Grid>
          </Grid>
        </div>
      </div>
    </section>
  )
}

export default Faqs
