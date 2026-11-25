import { createRoot } from 'react-dom/client';
import { ReviewShell } from './ReviewShell';
import { areas, states } from '../states.js';
import { notes, reasons } from '../notes.js';

createRoot(document.getElementById('root')!).render(<ReviewShell areas={areas} states={states} notes={notes} reasons={reasons} />);
