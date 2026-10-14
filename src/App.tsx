/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SummonerGame } from './components/summoner/SummonerGame';

export default function App() {
  return (
    <main className="min-h-screen bg-[#070d14] text-slate-100 flex flex-col">
      <SummonerGame />
    </main>
  );
}
