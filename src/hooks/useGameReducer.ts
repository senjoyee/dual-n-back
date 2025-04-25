import { useReducer } from 'react';
import { GameReducerState, GameAction, FeedbackType } from '../types';
import { determineFeedback, determineMissFeedback, calculateResults } from '../utils/gameLogic';
import { FEEDBACK_DURATION_MS } from '../constants';

const initialState: GameReducerState = {
    status: 'idle',
    score: 0,
    currentTrial: -1,
    elapsedTime: 0,
    stimulusSequence: [],
    userResponses: [],
    activeVisualStimulus: null,
    activeAudioStimulus: null,
    feedback: { visual: null, audio: null },
    showFeedbackUntil: 0,
    results: null,
    settings: null,
};

function gameReducer(state: GameReducerState, action: GameAction): GameReducerState {
    switch (action.type) {
        case 'START_GAME':
            console.log("Reducer: START_GAME - Preparing state.");
            return {
                ...initialState,
                status: 'idle',
                stimulusSequence: action.sequence,
                userResponses: new Array(action.sequence.length).fill(null).map(() => ({ visual: null, audio: null })),
                currentTrial: -1,
                elapsedTime: 0,
                score: 0,
                settings: action.settings,
            };

        case 'RUN_GAME':
            if (state.status === 'idle') {
                console.log("Reducer: RUN_GAME - Setting status to running.");
                return { ...state, status: 'running' };
            }
            console.warn("Reducer: RUN_GAME called when status was not idle.", state.status);
            return state;

        case 'STOP_GAME':
            console.log("Reducer: STOP_GAME - Resetting to idle.");
            return {
                ...state,
                status: 'idle',
                score: 0,
                currentTrial: -1,
                elapsedTime: 0,
                userResponses: new Array(state.stimulusSequence.length).fill(null).map(() => ({ visual: null, audio: null })),
                activeVisualStimulus: null,
                activeAudioStimulus: null,
                feedback: { visual: null, audio: null },
                showFeedbackUntil: 0,
                results: null,
            };

        case 'PAUSE_GAME':
            return state.status === 'running' ? { ...state, status: 'paused' } : state;

        case 'RESUME_GAME':
            return state.status === 'paused' ? { ...state, status: 'running' } : state;

        case 'NEXT_TRIAL': {
            const nextTrialIndex = state.currentTrial + 1;
            if (nextTrialIndex >= state.stimulusSequence.length) {
                return { ...state, status: 'finished' };
            }

            const currentStimulus = state.stimulusSequence[nextTrialIndex];
            const { nLevel } = action.settings;
            let missFeedback: { visual: FeedbackType | null; audio: FeedbackType | null } = { visual: null, audio: null };
            let scoreDelta = 0;

            if (state.currentTrial >= nLevel) {
                const prevTrialIndex = state.currentTrial;
                const prevStimulus = state.stimulusSequence[prevTrialIndex];
                const nBackStimulus = state.stimulusSequence[prevTrialIndex - nLevel];
                const prevResponse = state.userResponses[prevTrialIndex];

                if (action.settings?.gameMode !== 'Audio') {
                    const visualMatchOccurred = prevStimulus.visualPosition !== null && prevStimulus.visualPosition === nBackStimulus.visualPosition;
                    missFeedback.visual = determineMissFeedback(visualMatchOccurred, prevResponse.visual);
                    if (missFeedback.visual === 'miss') scoreDelta -= 1;
                }
                if (action.settings?.gameMode !== 'Visual') {
                    const audioMatchOccurred = prevStimulus.audioLetter !== null && prevStimulus.audioLetter === nBackStimulus.audioLetter;
                    missFeedback.audio = determineMissFeedback(audioMatchOccurred, prevResponse.audio);
                    if (missFeedback.audio === 'miss') scoreDelta -= 1;
                }
            }

            const nextActiveVisualStimulus = currentStimulus.visualPosition !== null ? { visualPosition: currentStimulus.visualPosition } : null;

            return {
                ...state,
                score: state.score + scoreDelta,
                currentTrial: nextTrialIndex,
                activeVisualStimulus: nextActiveVisualStimulus,
                activeAudioStimulus: currentStimulus.audioLetter ? { audioLetter: currentStimulus.audioLetter } : null,
                feedback: (missFeedback.visual || missFeedback.audio) ? missFeedback : { visual: null, audio: null },
                showFeedbackUntil: (missFeedback.visual || missFeedback.audio) ? action.currentTime + FEEDBACK_DURATION_MS : 0,
                elapsedTime: state.elapsedTime,
            };
        }

        case 'REGISTER_RESPONSE': {
            const { responseType, currentTime } = action;
            const { nLevel } = state.settings!;
            const currentTrialIndex = state.currentTrial;

            if (currentTrialIndex < nLevel) {
                return state;
            }

            if (responseType === 'visual' && state.userResponses[currentTrialIndex]?.visual !== null) return state;
            if (responseType === 'audio' && state.userResponses[currentTrialIndex]?.audio !== null) return state;

            const currentStimulus = state.stimulusSequence[currentTrialIndex];
            const nBackStimulus = state.stimulusSequence[currentTrialIndex - nLevel];

            const updatedTrialResponse = { ...(state.userResponses[currentTrialIndex] || { visual: null, audio: null }) };

            let feedback: { visual: FeedbackType | null; audio: FeedbackType | null } = { visual: state.feedback.visual, audio: state.feedback.audio };
            let showFeedback = false;
            let scoreDelta = 0;

            if (responseType === 'visual' && state.settings?.gameMode !== 'Audio') {
                const isMatch = currentStimulus.visualPosition !== null && nBackStimulus.visualPosition !== null && currentStimulus.visualPosition === nBackStimulus.visualPosition;
                updatedTrialResponse.visual = true;
                const responseFeedback = determineFeedback(isMatch, true);
                if (responseFeedback) {
                    feedback.visual = responseFeedback;
                    showFeedback = true;
                    if (responseFeedback === 'correct') scoreDelta += 1;
                    else if (responseFeedback === 'false-alarm') scoreDelta -= 1;
                }
            } else if (responseType === 'audio' && state.settings?.gameMode !== 'Visual') {
                const isMatch = currentStimulus.audioLetter !== null && nBackStimulus.audioLetter !== null && currentStimulus.audioLetter === nBackStimulus.audioLetter;
                updatedTrialResponse.audio = true;
                const responseFeedback = determineFeedback(isMatch, true);
                if (responseFeedback) {
                    feedback.audio = responseFeedback;
                    showFeedback = true;
                    if (responseFeedback === 'correct') scoreDelta += 1;
                    else if (responseFeedback === 'false-alarm') scoreDelta -= 1;
                }
            }

            const newUserResponses = {
                ...state.userResponses,
                [currentTrialIndex]: updatedTrialResponse
            };

            return {
                ...state,
                score: state.score + scoreDelta,
                userResponses: newUserResponses,
                feedback: showFeedback ? feedback : state.feedback,
                showFeedbackUntil: showFeedback ? currentTime + FEEDBACK_DURATION_MS : state.showFeedbackUntil,
            };
        }

        case 'SHOW_FEEDBACK':
            return {
                ...state,
                feedback: action.feedback,
                showFeedbackUntil: Date.now() + action.duration,
            };

        case 'CLEAR_FEEDBACK':
            if (Date.now() >= state.showFeedbackUntil) {
                return { ...state, feedback: { visual: null, audio: null }, showFeedbackUntil: 0 };
            }
            return state;

        case 'UPDATE_ELAPSED_TIME':
            return {
                ...state,
                elapsedTime: action.payload,
            };

        case 'CLEAR_VISUAL_STIMULUS':
            return { ...state, activeVisualStimulus: null };

        case 'END_SESSION':
            if (!state.settings) {
                console.error("Attempted to end session without settings.");
                return { ...state, status: 'settings' };
            }
            const finalResults = calculateResults(state.settings, state);
            return {
                ...state,
                status: 'finished',
                results: finalResults,
                activeVisualStimulus: null,
                activeAudioStimulus: null,
                feedback: { visual: null, audio: null },
            };

        default:
            const exhaustiveCheck: never = action;
            console.warn(`Unhandled action type: ${(exhaustiveCheck as any)?.type}`);
            return state;
    }
}

export function useGameReducer() {
    const [state, dispatch] = useReducer(gameReducer, {
        ...initialState,
    });
    return [state, dispatch] as const;
}
