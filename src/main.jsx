import React from 'react';
import {createRoot} from 'react-dom/client';
import './styles/tokens.css';
import './styles/global.css';
function ScaffoldCheck(){return <main className="scaffold"><p className="eyebrow">PROJECT SCAFFOLD · M01</p><h1>NATION: <span>RISE TO POWER</span></h1><p className="status">Foundation ready for the first UI milestone.</p><section className="panel"><strong>Milestone 01</strong><p>Project structure, design tokens and data pipeline scaffold are installed.</p><small>Gameplay simulation is not implemented in M01.</small></section></main>}
createRoot(document.getElementById('root')).render(<React.StrictMode><ScaffoldCheck/></React.StrictMode>);
