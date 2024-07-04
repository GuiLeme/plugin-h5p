import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { renderH5pForNonPresenter } from '../h5p-renderer/utils';
import { NonPresenterViewComponentProps } from './types';
import * as Styled from '../styles';
import { CurrentH5pStateWindow, H5pAsJsonObject } from '../../../commons/types';

declare const window: CurrentH5pStateWindow;

window.currentH5pState = '';
function NonPresenterViewComponent(props: NonPresenterViewComponentProps) {
  const stopInfinitLoop = useRef(false);
  const containerRef = useRef(null);

  const [contentRendered, setContentRendered] = useState(false);
  const [h5pState, setH5pState] = useState({});
  const {
    contentAsJson, currentUserName, h5pAsJson,
    pushEntryTestResult, pushEntryLadTestResult, currentUserId,
    pushH5pCurrentState, lastUpdateId, lastPayloadJson,
    replaceH5pCurrentState, pluginApi,
  } = props;

  const h5pAsJsonObject: H5pAsJsonObject = JSON.parse(h5pAsJson);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const eventHandler = (event: any) => {
    if (event.getScore && event.getMaxScore && event.getVerb
      && pushEntryTestResult && pushEntryLadTestResult) {
      const score = event.getScore();
      const maxScore = event.getMaxScore();
      const verb = event.getVerb();
      if (verb === 'answered') {
        pluginApi.sendDataAnalytics({
          learningAnalyticsDashboardColumnTitle: h5pAsJsonObject.title,
          learningAnalyticsDashboardValue: `${(parseFloat(score) / parseFloat(maxScore)) * 10}`,
        });
        pushEntryTestResult({
          testResultActivityTitle: h5pAsJsonObject.title,
          userId: currentUserId,
          testResultObject: score,
          testResultMaximumScore: maxScore,
        });
      }
    }
  };

  useEffect(() => {
    if (pushH5pCurrentState
      && h5pState
      && Object.keys(h5pState).length !== 0 && replaceH5pCurrentState) {
      const currentState = JSON.stringify(h5pState);
      if (lastUpdateId) {
        replaceH5pCurrentState(lastUpdateId, {
          userName: currentUserName,
          userId: currentUserId,
          currentState,
        });
      } else {
        pushH5pCurrentState({
          userName: currentUserName,
          userId: currentUserId,
          currentState,
        });
      }
    }
  }, [h5pState]);
  useEffect(() => {
    window.H5P?.externalDispatcher?.on('xAPI', eventHandler);
    const timeoutReference = setTimeout(
      renderH5pForNonPresenter(
        containerRef,
        lastPayloadJson,
        setH5pState,
        contentAsJson,
        h5pAsJson,
        setContentRendered,
      ),
      100,
    );

    return () => {
      window.H5P?.externalDispatcher?.off('xAPI', eventHandler);
      clearTimeout(timeoutReference);
    };
  }, []);
  if (pushEntryTestResult
    && pushEntryLadTestResult && !stopInfinitLoop.current && contentRendered) {
    stopInfinitLoop.current = true;
    window.H5P?.externalDispatcher?.on('xAPI', eventHandler);
  }

  return (
    <div
      id="h5p-container"
      style={
        {
          width: '100%',
          background: '#F3F6F9',
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
        }
      }
    >
      <Styled.ScrollboxVertical
        ref={containerRef}
      />
    </div>
  );
}

export default NonPresenterViewComponent;
