import React, { Suspense, useState } from "react";
import { createRoot } from "react-dom/client";

const RollupPage = React.lazy(() => import("./pages/RollupPage"));
const WebpackPage = React.lazy(() => import("./pages/WebpackPage"));

function App() {
  const [page, setPage] = useState('rollup');
  return React.createElement('div', null, [
    React.createElement('h1', { key: 'h1' }, 'Example CRA App'),
    React.createElement('div', { key: 'nav' }, [
      React.createElement('button', { key: 'b1', onClick: () => setPage('rollup') }, 'Rollup Page'),
      React.createElement('button', { key: 'b2', onClick: () => setPage('webpack') }, 'Webpack Page')
    ]),
    React.createElement(Suspense, { key: 'suspense', fallback: React.createElement('div', null, 'loading...') },
      page === 'rollup' ? React.createElement(RollupPage) : React.createElement(WebpackPage)
    )
  ]);
}

createRoot(document.getElementById('root')).render(React.createElement(App));
