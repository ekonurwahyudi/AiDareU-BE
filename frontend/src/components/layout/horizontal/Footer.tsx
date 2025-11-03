// Component Imports
import LayoutFooter from '@layouts/components/horizontal/Footer'
import FooterContent from './FooterContent'

const Footer = () => {
  return (
    <LayoutFooter overrideStyles={{ backgroundColor: '#211B2C' }}>
      <FooterContent />
    </LayoutFooter>
  )
}

export default Footer
