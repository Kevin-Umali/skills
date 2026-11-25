// Loaded by the shell with ?state, ?theme (light or dark) and ?reset.
// Before renders the production view; After renders the mirror copy. Both get a view model built from state.fixture.
import { createRoot } from 'react-dom/client';
import { states } from '../states.js';

const params = new URLSearchParams(location.search);
const state = states.find((candidate) => candidate.id === params.get('state')) ?? states[0];
document.documentElement.dataset.theme = params.get('theme') === 'dark' ? 'dark' : 'light';

// Replace with the real view, for example <BillingView {...buildViewModel(state.fixture)} />.
createRoot(document.getElementById('root')!).render(<pre>{`${state.label}: ${JSON.stringify(state.fixture)}`}</pre>);
