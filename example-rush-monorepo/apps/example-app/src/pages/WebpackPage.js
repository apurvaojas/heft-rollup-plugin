import React from 'react';
import { smallFunction } from '@example/lib-webpack';

export default function WebpackPage(){
  return React.createElement('div', null, `Webpack page -> ${smallFunction()}`);
}
