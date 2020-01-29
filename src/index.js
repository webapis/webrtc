/* eslint-disable no-unused-vars */
import React from 'react';
import ReactDOM from 'react-dom';
import adapter from 'webrtc-adapter';
import * as serviceWorker from './serviceWorker';
import Demo from './Demo';

ReactDOM.render(
  <Demo title=" Peer to Peer File Transfer Demo using WebRTC" clientOneName="gon" clientTwoName="kon" />,
  document.getElementById('root')
);
// test
// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
