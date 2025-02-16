// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {generateId} from 'mattermost-redux/utils/helpers';

import {Store} from 'src/types/store';

import {
    toggleRHS,
    setClientId,
    setRHSViewingList,
    setRHSViewingPlaybookRun,
    promptUpdateStatus,
} from 'src/actions';

import {
    inPlaybookRunChannel,
    isPlaybookRunRHSOpen,
    currentRHSState,
    selectExperimentalFeatures,
    currentPlaybookRun,
} from 'src/selectors';

import {RHSState} from 'src/types/rhs';

type SlashCommandObj = {message?: string; args?: string[];} | {error: string;} | {};

export function makeSlashCommandHook(store: Store) {
    return async (inMessage: any, args: any): Promise<SlashCommandObj> => {
        const state = store.getState();
        const isInPlaybookRunChannel = inPlaybookRunChannel(state);
        const message = inMessage && typeof inMessage === 'string' ? inMessage.trim() : null;
        const experimentalFeaturesEnabled = selectExperimentalFeatures(store.getState());

        if (message?.startsWith('/playbook run')) {
            const clientId = generateId();
            store.dispatch(setClientId(clientId));

            return {message: `/playbook run ${clientId}`, args};
        }

        if (experimentalFeaturesEnabled && message?.startsWith('/playbook update') && isInPlaybookRunChannel) {
            const clientId = generateId();
            const currentRun = currentPlaybookRun(state);
            store.dispatch(setClientId(clientId));
            store.dispatch(promptUpdateStatus(currentRun.team_id, currentRun.id, currentRun.playbook_id, currentRun.channel_id));
            return {};
        }

        if (message?.startsWith('/playbook info')) {
            if (inPlaybookRunChannel(state) && !isPlaybookRunRHSOpen(state)) {
                //@ts-ignore thunk
                store.dispatch(toggleRHS());
            }

            if (inPlaybookRunChannel(state) && currentRHSState(state) !== RHSState.ViewingPlaybookRun) {
                store.dispatch(setRHSViewingPlaybookRun());
            }

            return {message, args};
        }

        if (message?.startsWith('/playbook list')) {
            if (!isPlaybookRunRHSOpen(state)) {
                //@ts-ignore thunk
                store.dispatch(toggleRHS());
            }

            if (inPlaybookRunChannel(state) && currentRHSState(state) !== RHSState.ViewingList) {
                store.dispatch(setRHSViewingList());
            }

            return {message, args};
        }

        return {message: inMessage, args};
    };
}
