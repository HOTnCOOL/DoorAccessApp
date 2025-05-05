import { Grid, Button } from '@mui/material';
import { Backspace } from '@mui/icons-material';

const KeyPad = ({ onKeyPress, disabled = false }) => {
  // Define keypad layout
  const keys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['clear', '0', 'backspace'],
    ['enter']
  ];
  
  // Render a key button
  const renderKey = (key) => {
    let label = key;
    let color = 'primary';
    let variant = 'contained';
    let fullWidth = false;
    
    if (key === 'clear') {
      label = 'Clear';
      color = 'error';
      variant = 'outlined';
    } else if (key === 'backspace') {
      label = <Backspace />;
      color = 'warning';
    } else if (key === 'enter') {
      label = 'Enter';
      color = 'success';
      fullWidth = true;
    }
    
    return (
      <Grid 
        item 
        xs={key === 'enter' ? 12 : 4} 
        key={key}
      >
        <Button
          fullWidth
          variant={variant}
          color={color}
          size="large"
          onClick={() => onKeyPress(key)}
          disabled={disabled}
          sx={{ 
            height: 64, 
            fontSize: key.length === 1 ? '1.5rem' : '1rem',
          }}
        >
          {label}
        </Button>
      </Grid>
    );
  };
  
  return (
    <Grid container spacing={1}>
      {keys.map((row, rowIndex) => (
        <Grid container item spacing={1} key={`row-${rowIndex}`}>
          {row.map(renderKey)}
        </Grid>
      ))}
    </Grid>
  );
};

export default KeyPad;