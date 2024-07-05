import {
  BbbPluginSdk,
  DataChannelTypes,
  PluginApi,
  RESET_DATA_CHANNEL,
} from 'bigbluebutton-html-plugin-sdk';
import { useEffect } from 'react';
import * as React from 'react';
import {
  GenericContentRenderFunctionProps,
  LADTestResult,
  TestResult, UserH5pCurrentState, UsersMoreInformationGraphqlResponse,
} from './types';
import NonPresenterViewComponent from './non-presenter-view/component';
import PresenterViewComponent from './presenter-view/component';
import { USERS_MORE_INFORMATION } from './subscriptions';
import { extractH5pContents } from '../h5p-plugin/utils';

export function GenericContentRenderFunction(props: GenericContentRenderFunctionProps) {
  const {
    h5pContentText, currentUser,
    pluginUuid,
  } = props;

  const currentUserPresenter = currentUser?.presenter;
  const pluginApi: PluginApi = BbbPluginSdk.getPluginApi(pluginUuid);

  const {
    data: responseUserH5pCurrentStateList,
    pushEntry: pushUserH5pCurrentStateList,
    deleteEntry: deleteUserH5pCurrentStateList,
    replaceEntry: replaceUserH5pCurrentStateList,
  } = pluginApi.useDataChannel<UserH5pCurrentState>('testResult', DataChannelTypes.All_ITEMS, 'userH5pCurrentState');

  // TODO: Refactor the test results to be just a request done for an external server to be
  // validated and all
  const { pushEntry: pushEntryTestResult } = pluginApi.useDataChannel<TestResult>('testResult', DataChannelTypes.LATEST_ITEM);
  const { pushEntry: pushEntryLadTestResult } = pluginApi.useDataChannel<LADTestResult>('testResult', DataChannelTypes.LATEST_ITEM, 'learning-analytics-dashboard');

  useEffect(() => () => {
    if (currentUser && currentUser.presenter) deleteUserH5pCurrentStateList([RESET_DATA_CHANNEL]);
  }, []);

  const allUsersInfo = pluginApi.useCustomSubscription<UsersMoreInformationGraphqlResponse>(
    USERS_MORE_INFORMATION,
  );
  const usersList = allUsersInfo?.data?.user;
  const responseObject = responseUserH5pCurrentStateList?.data?.filter(
    (h5pState) => h5pState.payloadJson.userId === currentUser?.userId,
  ).map((h5pState) => ({ entryId: h5pState.entryId, payloadJson: h5pState.payloadJson }))[0];

  const { contentAsJson, h5pAsJson } = extractH5pContents(h5pContentText);

  // TODO: Filter the ones where the loading is not done yet (needs refactor in html5)
  // if (responseUserH5pCurrentStateList.loading) return null;
  return (
    currentUserPresenter
      ? (
        <PresenterViewComponent
          currentUserId={currentUser?.userId}
          usersList={usersList}
          h5pLatestStateUpdate={responseUserH5pCurrentStateList}
          contentAsJson={contentAsJson}
          h5pAsJson={h5pAsJson}
        />
      )
      : (
        <NonPresenterViewComponent
          pluginApi={pluginApi}
          currentUserName={currentUser?.name}
          currentUserId={currentUser?.userId}
          contentAsJson={contentAsJson}
          h5pAsJson={h5pAsJson}
          pushEntryTestResult={pushEntryTestResult}
          pushEntryLadTestResult={pushEntryLadTestResult}
          pushH5pCurrentState={pushUserH5pCurrentStateList}
          lastUpdateId={responseObject?.entryId}
          lastPayloadJson={responseObject?.payloadJson}
          replaceH5pCurrentState={replaceUserH5pCurrentStateList}
        />
      )
  );
}