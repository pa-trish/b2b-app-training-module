type ProgressModule = {
  id: string;
  sections: Array<{ order: number }>;
  test: { id: string } | null;
};

type ModuleProgressRow = {
  moduleId: string;
  sectionsCompleted: number[];
};

type TestAttemptRow = {
  moduleTestId: string;
  passed: boolean | null;
};

export function computeEnrollmentProgressStats(params: {
  modules: ProgressModule[];
  progress: ModuleProgressRow[];
  attempts: TestAttemptRow[];
}) {
  const progressMap = new Map(params.progress.map((p) => [p.moduleId, p]));
  const passedTestIds = new Set(
    params.attempts.filter((a) => a.passed).map((a) => a.moduleTestId)
  );

  let totalSections = 0;
  let completedSections = 0;
  let totalTests = 0;
  let passedTests = 0;

  for (const module of params.modules) {
    totalSections += module.sections.length;

    const moduleProgress = progressMap.get(module.id);
    if (moduleProgress) {
      const validOrders = new Set(module.sections.map((s) => s.order));
      completedSections += moduleProgress.sectionsCompleted.filter((order) =>
        validOrders.has(order)
      ).length;
    }

    if (module.test) {
      totalTests += 1;
      if (passedTestIds.has(module.test.id)) {
        passedTests += 1;
      }
    }
  }

  return {
    tasksPercent:
      totalSections === 0 ? 0 : Math.round((completedSections / totalSections) * 100),
    testsPercent: totalTests === 0 ? 0 : Math.round((passedTests / totalTests) * 100),
    completedSections,
    totalSections,
    passedTests,
    totalTests,
  };
}
