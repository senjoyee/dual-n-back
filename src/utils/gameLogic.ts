import { GameSettings, GameReducerState, GameMode, Stimulus, GameResults, FeedbackType } from '../types';
import { AUDIO_LETTERS, GRID_CELL_COUNT } from '../constants';

/**
 * Generates a pseudo-random sequence of stimuli for the N-Back game.
 * Ensures a reasonable probability of N-back matches occurring.
 * @param settings - The current game settings.
 * @returns An array of Stimulus objects representing the game sequence.
 */
export function generateSequence(settings: GameSettings): Stimulus[] {
    const { gameMode, nLevel, stimulusDuration, interStimulusInterval, sessionDuration } = settings;
    const trialDuration = stimulusDuration + interStimulusInterval;
    // Log inputs to trial calculation
    console.log(`[generateSequence] Settings: sessionDuration=${sessionDuration}s, stimulusDuration=${stimulusDuration}ms, interStimulusInterval=${interStimulusInterval}ms`);
    console.log(`[generateSequence] Calculated trialDuration: ${trialDuration}ms`);

    // Check for invalid trial duration
    if (trialDuration <= 0) {
      console.error("[generateSequence] Error: trialDuration is zero or negative. Cannot generate sequence.");
      return [];
    }

    const numTrials = Math.floor((sessionDuration * 1000) / trialDuration);
    // Log calculated number of trials
    console.log(`[generateSequence] Calculated numTrials: ${numTrials}`);

    // Calculate minimum required matches (3 matches per 30 seconds)
    const minVisualMatches = gameMode !== GameMode.Audio ? Math.ceil(sessionDuration / 30 * 3) : 0;
    const minAudioMatches = gameMode !== GameMode.Visual ? Math.ceil(sessionDuration / 30 * 3) : 0;
    console.log(`[generateSequence] Minimum required matches - Visual: ${minVisualMatches}, Audio: ${minAudioMatches}`);

    const sequence: Stimulus[] = [];

    // Helper to get a random element or null based on mode
    const getRandomVisual = () => (gameMode === GameMode.Audio) ? null : Math.floor(Math.random() * GRID_CELL_COUNT);
    const getRandomAudio = () => (gameMode === GameMode.Visual) ? null : AUDIO_LETTERS[Math.floor(Math.random() * AUDIO_LETTERS.length)];

    // Target probability for a match to occur on any given trial (for each modality)
    const targetMatchProbability = 0.25; // Base probability

    // Track matches created
    let visualMatchesCreated = 0;
    let audioMatchesCreated = 0;
    
    // Create initial sequence with random distribution of matches
    for (let i = 0; i < numTrials; i++) {
        let visualPosition: number | null = null;
        let audioLetter: string | null = null;
        let forceVisualMatch = false;
        let forceAudioMatch = false;
        
        // As we get closer to the end, force matches if we haven't met minimum
        const remainingTrials = numTrials - i;
        const minRemainingVisual = Math.max(0, minVisualMatches - visualMatchesCreated);
        const minRemainingAudio = Math.max(0, minAudioMatches - audioMatchesCreated);
        
        // Force matches if we're running out of trials to meet the minimum
        if (i >= nLevel && remainingTrials <= minRemainingVisual * 2 && minRemainingVisual > 0 && gameMode !== GameMode.Audio) {
            forceVisualMatch = true;
        }
        
        if (i >= nLevel && remainingTrials <= minRemainingAudio * 2 && minRemainingAudio > 0 && gameMode !== GameMode.Visual) {
            forceAudioMatch = true;
        }

        // Decide if the current trial SHOULD be a match for visual
        if (i >= nLevel && gameMode !== GameMode.Audio && (forceVisualMatch || Math.random() < targetMatchProbability)) {
            visualPosition = sequence[i - nLevel].visualPosition;
            visualMatchesCreated++;
        } else {
            // Ensure the non-match isn't accidentally the same as N-back
            do {
                visualPosition = getRandomVisual();
            } while (i >= nLevel && gameMode !== GameMode.Audio && visualPosition === sequence[i - nLevel].visualPosition && visualPosition !== null);
        }

        // Decide if the current trial SHOULD be a match for audio
        if (i >= nLevel && gameMode !== GameMode.Visual && (forceAudioMatch || Math.random() < targetMatchProbability)) {
            audioLetter = sequence[i - nLevel].audioLetter;
            audioMatchesCreated++;
        } else {
            // Ensure the non-match isn't accidentally the same as N-back
            do {
                audioLetter = getRandomAudio();
            } while (i >= nLevel && gameMode !== GameMode.Visual && audioLetter === sequence[i - nLevel].audioLetter && audioLetter !== null);
        }
        
        sequence.push({ visualPosition, audioLetter });
    }

    // Log final sequence length and number of matches created
    console.log(`[generateSequence] Generated sequence with length: ${sequence.length}`);
    console.log(`[generateSequence] Matches created - Visual: ${visualMatchesCreated}, Audio: ${audioMatchesCreated}`);
    return sequence;
}

/**
 * Calculates the results of a completed N-Back game session.
 * @param settings - The settings used for the game session.
 * @param gameState - The final state of the game, including the sequence and user responses.
 * @returns A GameResults object detailing the performance.
 */
export function calculateResults(settings: GameSettings, gameState: GameReducerState): GameResults {
    const { gameMode, nLevel } = settings;
    const { stimulusSequence, userResponses } = gameState; 
    const numTrials = stimulusSequence.length;

    let visualResults = null;
    let audioResults = null;

    // Updated structure for results
    const initResultCounters = () => ({ 
        hits: 0, 
        misses: 0, 
        falseAlarms: 0, 
        errors: 0, // New: misses + falseAlarms
        totalMatches: 0, 
        rate: 0 // New: Replaces accuracy
    });

    if (gameMode !== GameMode.Audio) visualResults = initResultCounters();
    if (gameMode !== GameMode.Visual) audioResults = initResultCounters();

    for (let i = nLevel; i < numTrials; i++) {
        const currentStimulus = stimulusSequence[i];
        const nBackStimulus = stimulusSequence[i - nLevel];
        const userResponse = userResponses[i] ?? { visual: null, audio: null }; 

        // --- Visual Score Calculation ---
        if (visualResults && currentStimulus.visualPosition !== null && nBackStimulus.visualPosition !== null) {
            const isVisualMatch = currentStimulus.visualPosition === nBackStimulus.visualPosition;
            if (isVisualMatch) {
                visualResults.totalMatches++;
                if (userResponse.visual === true) {
                    visualResults.hits++;
                } else {
                    visualResults.misses++;
                }
            } else {
                if (userResponse.visual === true) {
                    visualResults.falseAlarms++;
                } else {
                }
            }
        }

        // --- Audio Score Calculation ---
        if (audioResults && currentStimulus.audioLetter !== null && nBackStimulus.audioLetter !== null) {
            const isAudioMatch = currentStimulus.audioLetter === nBackStimulus.audioLetter;
            if (isAudioMatch) {
                audioResults.totalMatches++;
                if (userResponse.audio === true) {
                    audioResults.hits++;
                } else {
                    audioResults.misses++;
                }
            } else {
                if (userResponse.audio === true) {
                    audioResults.falseAlarms++;
                } else {
                }
            }
        }
    }

    // Calculate derived metrics (Errors, Rate) and Overall Success Rate
    let totalOverallHits = 0;
    let totalOverallMatches = 0;

    if (visualResults) {
        visualResults.errors = visualResults.misses + visualResults.falseAlarms;
        if (visualResults.totalMatches > 0) {
             visualResults.rate = ((visualResults.totalMatches - visualResults.errors) / visualResults.totalMatches) * 100;
        } else {
             visualResults.rate = visualResults.errors === 0 ? 100 : 0; // Handle division by zero - 100% if 0 matches and 0 errors, 0% otherwise
        }
        totalOverallHits += visualResults.hits;
        totalOverallMatches += visualResults.totalMatches;
    }
    if (audioResults) {
        audioResults.errors = audioResults.misses + audioResults.falseAlarms;
         if (audioResults.totalMatches > 0) {
            audioResults.rate = ((audioResults.totalMatches - audioResults.errors) / audioResults.totalMatches) * 100;
         } else {
            audioResults.rate = audioResults.errors === 0 ? 100 : 0; // Handle division by zero
         }
         totalOverallHits += audioResults.hits;
         totalOverallMatches += audioResults.totalMatches;
    }

    // Calculate overall success rate based on hits vs total matches
    const overallSuccessRate = totalOverallMatches > 0 ? (totalOverallHits / totalOverallMatches) * 100 : 0;

    return {
        settings,
        totalTrials: numTrials,
        visual: visualResults,
        audio: audioResults,
        overallSuccessRate, // Renamed from overallAccuracy
    };
}

/**
 * Determines the feedback type based on stimulus match and user response.
 * @param isMatch - Whether the stimulus was an actual N-back match.
 * @param userPressedMatch - Whether the user pressed the match key.
 * @returns FeedbackType ('correct', 'miss', 'false-alarm') or null if no feedback needed immediately.
 */
export function determineFeedback(isMatch: boolean, userPressedMatch: boolean | null): FeedbackType | null {
    if (isMatch) {
        return userPressedMatch === true ? 'correct' : null; // Miss handled separately after timeout
    } else {
        return userPressedMatch === true ? 'false-alarm' : null; // Correct non-match has no feedback
    }
}

/**
 * Determines the feedback type for a miss (match occurred, user didn't respond in time).
 * To be called after the response window closes.
 * @param isMatch - Whether the stimulus was an actual N-back match.
 * @param userPressedMatch - Whether the user pressed the match key (will be null or false if they missed).
 * @returns 'miss' if applicable, otherwise null.
 */
export function determineMissFeedback(isMatch: boolean, userPressedMatch: boolean | null): FeedbackType | null {
     return isMatch && userPressedMatch !== true ? 'miss' : null;
}
