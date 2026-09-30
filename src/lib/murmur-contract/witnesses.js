export const createMurmurPrivateState = (respondentSecret, 
// eslint-disable-next-line @typescript-eslint/no-explicit-any
respondentPath) => ({
    respondentSecret,
    respondentPath,
});
export const witnesses = {
    respondentSecret: ({ privateState, }) => [privateState, privateState.respondentSecret],
    respondentPath: ({ privateState,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
     }) => [privateState, privateState.respondentPath],
};
//# sourceMappingURL=witnesses.js.map