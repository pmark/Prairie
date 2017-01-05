import './main.css';
import React         from 'react';
import ReactDOM      from 'react-dom';
import { Provider }  from 'react-redux';
import { makeStore } from './lib/store';
import Force         from './components/force.jsx';
import Chart         from './components/chart.jsx';

const nodes = [];
const links = [];

const newNode = () => {
  nodes.push({
    key: `node${nodes.length}`,  // this can be better
    id: `node${nodes.length}`,  // this can be better
    index: nodes.length,
    x: 400, //Math.floor(Math.random() * 300 + 200),
    y: 300, //Math.floor(Math.random() * 200 + 100),
    size: 30,
  });

  if (nodes.length > 1) {
    // links.push({
    //   source: nodes.length-2,
    //   target: nodes.length-1,
    //   key: `link${nodes.length}`,  // this can be better
    // });

    if (nodes.length > 2) {
      links.push({
        source: nodes.length - 1,
        target: Math.floor(Math.random() * (nodes.length - 1)),
        key: `link${nodes.length}${Math.random()}`,  // this can be better
      });
    }
  }
};

Array.apply(null, {length:30}).forEach(() => newNode());


const store = makeStore();
const app = <Provider store={store}>
  <Force nodes={nodes} links={links} />
</Provider>

const mountingPoint = document.createElement('div');
mountingPoint.className = 'react-app';
document.body.appendChild(mountingPoint);

ReactDOM.render(app, mountingPoint);
