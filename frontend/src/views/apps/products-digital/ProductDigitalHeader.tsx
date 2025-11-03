// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

type Props = {
  searchValue: string
  setSearchValue: (val: string) => void
}

const ProductDigitalHeader = (props: Props) => {
  // Props
  const { searchValue, setSearchValue } = props

  return (
    <Card>
      <CardContent className='flex flex-wrap justify-between items-center gap-4'>
        <div>
          <Typography variant='h5' className='mbe-1'>
            Digital Products Library
          </Typography>
          <Typography>Browse and download our collection of digital products</Typography>
        </div>
        <div className='flex flex-wrap gap-4 items-center'>
          <TextField
            placeholder='Search products...'
            size='small'
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
            className='is-[250px]'
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <i className='tabler-search' />
                </InputAdornment>
              )
            }}
          />
        </div>
      </CardContent>
    </Card>
  )
}

export default ProductDigitalHeader
