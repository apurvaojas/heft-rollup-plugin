import React from 'react';
import { smallFunction } from '@example/lib-rollup';

export default function RollupPage(){
  return React.createElement('div', null, `Rollup page -> ${smallFunction()}`);
}
