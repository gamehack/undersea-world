import { createOceanApp } from './app/app';
import './styles.css';
import './controls.css';

const root = document.querySelector<HTMLElement>('#app');
if (!root) throw new Error('Missing #app root');
createOceanApp(root);
