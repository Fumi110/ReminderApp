import { Client } from '@line/bot-sdk';
import { lineConfig } from '../config/line.config.js';

export const lineClient = new Client(lineConfig);
