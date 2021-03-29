// © Microsoft Corporation. All rights reserved.
import React, { useState, useEffect } from 'react';
import GroupCall from './containers/GroupCall';
import { createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import { reducer } from './core/reducers';
import thunk from 'redux-thunk';
import EndCall from './components/EndCall';
import HomeScreen from './components/HomeScreen';
import ConfigurationScreen from './containers/Configuration';
import { v1 as createGUID } from 'uuid';
import { loadTheme, initializeIcons } from '@fluentui/react';
import { utils } from './Utils/Utils';
import { CallEndReason } from '@azure/communication-calling';

const sdkVersion = require('../package.json').dependencies['@azure/communication-calling'];
const lastUpdated = `Last Updated ${utils.getBuildTime()} with @azure/communication-calling:${sdkVersion}`;

loadTheme({ 
  palette: { 
    themePrimary: '#ff5200', 
    themeLighterAlt: '#fff8f5', 
    themeLighter: '#ffe3d6', 
    themeLight: '#ffcbb3', 
    themeTertiary: '#ff9666', 
    themeSecondary: '#ff661f', 
    themeDarkAlt: '#e64900', 
    themeDark: '#c23d00', 
    themeDarker: '#8f2d00', 
    neutralLighterAlt: '#f3f0ec', 
    neutralLighter: '#efece8', 
    neutralLight: '#e5e2df', 
    neutralQuaternaryAlt: '#d6d2cf', 
    neutralQuaternary: '#ccc9c6', 
    neutralTertiaryAlt: '#c4c1be', 
    neutralTertiary: '#a19f9d', 
    neutralSecondary: '#605e5c', 
    neutralPrimaryAlt: '#3b3a39', 
    neutralPrimary: '#323130', 
    neutralDark: '#201f1e', 
    black: '#000000', 
    white: '#f9f5f1', 
  } 
}); 
initializeIcons();

const store = createStore(reducer, applyMiddleware(thunk));
const App = () => {
  const [page, setPage] = useState('home');
  const [callEndReason, setCallEndReason] = useState<CallEndReason | undefined>();
  const [groupId, setGroupId] = useState('');
  const [screenWidth, setScreenWidth] = useState(0);

  useEffect(() => {
    const setWindowWidth = () => {
      const width = typeof window !== 'undefined' ? window.innerWidth : 0;
      setScreenWidth(width);
    };
    setWindowWidth();
    window.addEventListener('resize', setWindowWidth);
    return () => window.removeEventListener('resize', setWindowWidth);
  }, []);

  const getGroupIdFromUrl = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('groupId');
  };

  const getGroupId = () => {
    if (groupId) return groupId;
    const uri_gid = getGroupIdFromUrl();
    const gid = uri_gid == null || uri_gid === '' ? createGUID() : uri_gid;
    setGroupId(gid);
    return gid;
  };

  const getContent = () => {
    if (page === 'home') {
      return (
        <HomeScreen
          startCallHandler={() => {
            window.history.pushState({}, document.title, window.location.href + '?groupId=' + getGroupId());
          }}
        />
      );
    } else if (page === 'configuration') {
      return (
        <ConfigurationScreen
          startCallHandler={() => setPage('call')}
          unsupportedStateHandler={() => setPage('unsupported')}
          callEndedHandler={(errorMsg: CallEndReason) => { setCallEndReason(errorMsg); setPage('error');} }
          groupId={getGroupId()}
          screenWidth={screenWidth}
        />
      );
    } else if (page === 'call') {
      return (
        <GroupCall
          endCallHandler={() => setPage('endCall')}
          groupId={getGroupId()}
          screenWidth={screenWidth}
        />
      );
    } else if (page === 'endCall') {
      return (
        <EndCall
          message={'You left the call'}
          rejoinHandler={() => {
            window.location.href = window.location.href;
          }}
          homeHandler={() => {
            window.location.href = window.location.href.split('?')[0];
          }}
        />
      );
    } else if (page === 'unsupported') {
      window.document.title = 'Unsupported browser';
      return (
        <>
          <a href="https://docs.microsoft.com/en-us/azure/communication-services/concepts/voice-video-calling/calling-sdk-features#calling-client-library-browser-support">Learn more</a>&nbsp;about
          browsers and platforms supported by the web calling sdk
        </>
      );
    } else if (page === 'error') {
      window.document.title = 'Call Ended';
      return (
        <div>
          <div>{`The call has ended with this error code (Code: ${callEndReason?.code} Subcode: ${callEndReason?.subCode})`}</div >

          <div>
          <a href="https://docs.microsoft.com/en-us/azure/communication-services/concepts/troubleshooting-info?tabs=csharp%2Cjavascript%2Cdotnet">Learn more</a>&nbsp;about
          why this Azure Communication Services call has ended.</div>
        </div>
      );
    } else {
      return <></>
    }
  };

  if (getGroupIdFromUrl() && page === 'home') {
    setPage('configuration');
  }

  return <Provider store={store}>{getContent()}</Provider>;
};

window.setTimeout(() => {
  try {
    console.log(`Azure Communication Services sample group calling app: ${lastUpdated}`);
  } catch (e) {}
}, 0);

export default App;
