export const CLEANING_REPORT = 'Cleaning report.';
export const CLEANING_REPORT_ASYNC = 'Cleaning report async.';
export const CLEANING_PROGRESS = 'Cleaning report progress.';

export const CleaningReport = (report) => ({
    type: CLEANING_REPORT,
    payload: { report }
});

export const CleaningReportAsync = () => ({ type: CLEANING_REPORT_ASYNC, payload: {} });

export const CleaningProgress = (progress) => ({
    type: CLEANING_PROGRESS,
    payload: { progress }
});
