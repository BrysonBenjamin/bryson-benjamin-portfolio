import { runSaSaLiveEvaluation } from "./evaluations";

const record = await runSaSaLiveEvaluation();
console.log(JSON.stringify(record));
if (!record.passed) process.exitCode = 1;
