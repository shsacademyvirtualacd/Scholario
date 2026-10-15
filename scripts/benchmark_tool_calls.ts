import { performance } from 'perf_hooks';

async function mockExecuteAdminDataQuery(toolName: string, delayMs: number = 50) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    return { status: "ok", toolName };
}

async function sequentialExecution(calls: { name: string; args: any; id?: string }[]) {
    const toolParts: any[] = [];
    for (const call of calls) {
        const toolName = call.name || '';
        const data = await mockExecuteAdminDataQuery(toolName, 50);
        toolParts.push({
            functionResponse: {
                name: toolName,
                response: {
                    result: data,
                },
                ...(call.id ? { id: call.id } : {}),
            },
        });
    }
    return toolParts;
}

async function batchedExecution(calls: { name: string; args: any; id?: string }[]) {
    const toolParts = await Promise.all(
        calls.map(async (call) => {
            const toolName = call.name || '';
            const data = await mockExecuteAdminDataQuery(toolName, 50);
            return {
                functionResponse: {
                    name: toolName,
                    response: {
                        result: data,
                    },
                    ...(call.id ? { id: call.id } : {}),
                },
            };
        })
    );
    return toolParts;
}

async function runBenchmark() {
    const testCalls = [
        { name: 'queryStudentsAndEnrollments', args: {}, id: 'call_1' },
        { name: 'queryTeachersAndFaculty', args: {}, id: 'call_2' },
        { name: 'queryPricingAndFeeConfigs', args: {}, id: 'call_3' },
    ];

    console.log("Running Sequential Execution...");
    const startSeq = performance.now();
    const seqResult = await sequentialExecution(testCalls);
    const endSeq = performance.now();
    const seqDuration = endSeq - startSeq;
    console.log(`Sequential Execution took: ${seqDuration.toFixed(2)} ms`);

    console.log("Running Batched Execution (Promise.all)...");
    const startBatch = performance.now();
    const batchResult = await batchedExecution(testCalls);
    const endBatch = performance.now();
    const batchDuration = endBatch - startBatch;
    console.log(`Batched Execution took: ${batchDuration.toFixed(2)} ms`);

    console.log(`Speedup: ${(seqDuration / batchDuration).toFixed(2)}x faster`);

    // Verify output structure equivalence
    if (JSON.stringify(seqResult) === JSON.stringify(batchResult)) {
        console.log("✅ Verification passed: Outputs are identical!");
    } else {
        console.error("❌ Verification failed: Outputs differ!");
    }
}

runBenchmark().catch(console.error);
